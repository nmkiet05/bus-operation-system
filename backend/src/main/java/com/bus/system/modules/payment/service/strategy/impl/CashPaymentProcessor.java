package com.bus.system.modules.payment.service.strategy.impl;

import com.bus.system.modules.payment.domain.enums.PaymentMethod;
import com.bus.system.modules.payment.dto.response.PaymentResponse;
import com.bus.system.modules.payment.service.strategy.PaymentProcessor;
import com.bus.system.modules.payment.domain.PaymentBookingInfo;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Set;

@Component
public class CashPaymentProcessor implements PaymentProcessor {

    @Override
    public PaymentResponse process(PaymentBookingInfo bookingInfo) {
        // Thanh toán tiền mặt tại quầy/nhà xe -> Chỉ confirm status, không có
        // transactionId bên thứ 3
        return PaymentResponse.builder()
                .bookingCode(bookingInfo.getBookingCode())
                .amount(bookingInfo.getTotalAmount())
                .transactionId("CASH-" + bookingInfo.getBookingCode())
                .paymentTime(LocalDateTime.now())
                .status("PENDING") // Tiền mặt thường là PENDING cho đến khi nhân viên xác nhận
                .message("Vui lòng thanh toán tại quầy")
                .build();
    }

    @Override
    public Set<PaymentMethod> getSupportedPaymentMethods() {
        return Set.of(PaymentMethod.CASH, PaymentMethod.COUNTER);
    }
}
