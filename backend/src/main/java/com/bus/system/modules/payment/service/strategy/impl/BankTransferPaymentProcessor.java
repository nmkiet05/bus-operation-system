package com.bus.system.modules.payment.service.strategy.impl;

import com.bus.system.modules.payment.domain.enums.PaymentMethod;
import com.bus.system.modules.payment.dto.response.PaymentResponse;
import com.bus.system.modules.payment.service.strategy.PaymentProcessor;
import com.bus.system.modules.payment.domain.PaymentBookingInfo;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

/**
 * Processor giả lập chuyển khoản ngân hàng.
 * <p>
 * Luồng hoạt động:
 * 1. User chọn "Chuyển khoản" → Booking PENDING
 * 2. Frontend sinh QR code link tới /payment/bank-transfer?code={bookingCode}&amount={amount}
 * 3. User quét QR → mở trang xác nhận
 * 4. User bấm "Xác nhận đã thanh toán" → gọi POST /api/payments/process với method=BANK_TRANSFER
 * 5. Processor này trả về SUCCESS → booking chuyển sang CONFIRMED
 *
 * Lưu ý: Đây là giả lập (mock) — không kết nối ngân hàng thật.
 */
@Component
public class BankTransferPaymentProcessor implements PaymentProcessor {

    @Override
    public PaymentResponse process(PaymentBookingInfo bookingInfo) {
        return PaymentResponse.builder()
                .bookingCode(bookingInfo.getBookingCode())
                .amount(bookingInfo.getTotalAmount())
                .transactionId("BT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .paymentTime(LocalDateTime.now())
                .status("SUCCESS")
                .message("Xác nhận chuyển khoản thành công")
                .build();
    }

    @Override
    public Set<PaymentMethod> getSupportedPaymentMethods() {
        return Set.of(PaymentMethod.BANK_TRANSFER);
    }
}
