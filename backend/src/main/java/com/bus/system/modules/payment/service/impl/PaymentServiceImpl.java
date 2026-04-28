package com.bus.system.modules.payment.service.impl;

import com.bus.system.modules.sales.domain.enums.BookingStatus;
import com.bus.system.modules.payment.domain.PaymentBookingInfo;
import com.bus.system.modules.payment.dto.request.PaymentRequest;
import com.bus.system.modules.payment.dto.response.PaymentResponse;
import com.bus.system.modules.payment.integration.SalesServiceClient;
import com.bus.system.modules.payment.service.PaymentService;
import com.bus.system.modules.payment.service.strategy.PaymentProcessor;
import com.bus.system.modules.payment.service.strategy.PaymentStrategyFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Implementation của PaymentService.
 * Class này đóng vai trò là "Người điều phối" (Orchestrator) trong luồng thanh
 * toán.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    // Client để giao tiếp với module Sales (lấy thông tin vé, cập nhật trạng thái)
    private final SalesServiceClient salesServiceClient;

    // Factory để lấy ra thuật toán xử lý thanh toán phù hợp (VNPAY, Momo, Cash...)
    private final PaymentStrategyFactory paymentStrategyFactory;

    /**
        * Xử lý thanh toán.
     *
     * @param request Yêu cầu thanh toán chứa mã đặt chỗ và phương thức thanh toán.
     * @return Kết quả thanh toán.
     */
    @Override
        public PaymentResponse processPayment(PaymentRequest request) {

        // BƯỚC 1: Lấy thông tin đơn hàng từ Module Sales
        // Chúng ta không truy cập DB của Sales trực tiếp mà gọi qua Interface
        // (SalesServiceClient)
        PaymentBookingInfo bookingInfo = salesServiceClient.getBookingInfo(request.getBookingCode());

        // BƯỚC 2: Kiểm tra trạng thái đơn hàng
        // Nếu đã thanh toán rồi thì trả về lỗi ngay lập tức
        if (BookingStatus.CONFIRMED.name().equals(bookingInfo.getStatus())) {
            return PaymentResponse.builder()
                    .transactionId("ALREADY-PAID-" + UUID.randomUUID())
                    .status("SUCCESS") // Vẫn trả về SUCCESS nhưng kèm thông báo
                    .amount(bookingInfo.getTotalAmount())
                    .message("Đơn hàng này đã được thanh toán trước đó")
                    .build();
        }

        // BƯỚC 3: Xử lý thanh toán (Strategy Pattern)
        // Dựa vào method (VNPAY, CASH, MOMO...), Factory sẽ trả về Processor tương ứng.
        // Ví dụ: method="CASH" -> trả về CashPaymentProcessor
        PaymentProcessor processor = paymentStrategyFactory.getProcessor(request.getMethod());

        // Gọi hàm process() của processor đó để xử lý logic cụ thể
        PaymentResponse response = processor.process(bookingInfo);

        // BƯỚC 4: Cập nhật lại Module Sales dựa trên kết quả
        if ("SUCCESS".equals(response.getStatus())) {
            // Nếu thanh toán thành công, gọi sang Sales để đổi trạng thái vé thành
            // CONFIRMED
            salesServiceClient.confirmBooking(bookingInfo.getBookingCode(), request.getMethod());
            log.info("Booking {} confirmed via {}", bookingInfo.getBookingCode(), request.getMethod());
        } else if ("PENDING".equals(response.getStatus()) && "CASH".equals(request.getMethod())) {
            // Đối với tiền mặt, trạng thái sẽ là PENDING (Chờ thanh toán tại quầy)
            // Hiện tại chúng ta không cần gọi Sales để update trạng thái vì Sales mặc định
            // là PENDING.
            // Có thể mở rộng logic lưu "Phương thức thanh toán dự kiến" nếu cần.
            log.info("Booking {} pending payment via {}", bookingInfo.getBookingCode(), request.getMethod());
        }

        return response;
    }

    @Override
    public PaymentResponse simulatePayment(PaymentRequest request) {
        return processPayment(request);
    }
}
