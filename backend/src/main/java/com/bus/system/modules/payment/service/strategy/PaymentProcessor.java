package com.bus.system.modules.payment.service.strategy;

import com.bus.system.modules.payment.domain.enums.PaymentMethod;
import com.bus.system.modules.payment.dto.response.PaymentResponse;
import com.bus.system.modules.payment.domain.PaymentBookingInfo;

import java.util.Set;

/**
 * Interface cho các chiến lược thanh toán (Strategy Pattern)
 */
public interface PaymentProcessor {
    /**
     * Xử lý thanh toán
     * 
     * @param bookingInfo Thông tin đơn hàng cần thanh toán
     * @return Kết quả thanh toán
     */
    PaymentResponse process(PaymentBookingInfo bookingInfo);

    /**
     * Trả về danh sách phương thức thanh toán mà processor này hỗ trợ
     */
    Set<PaymentMethod> getSupportedPaymentMethods();
}
