package com.bus.system.modules.payment.service.strategy.impl;

import com.bus.system.modules.payment.domain.enums.PaymentMethod;
import com.bus.system.modules.payment.dto.response.PaymentResponse;
import com.bus.system.modules.payment.service.strategy.PaymentProcessor;
import com.bus.system.modules.payment.domain.PaymentBookingInfo;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Component
public class SimulatedPaymentProcessor implements PaymentProcessor {

    @Override
    public PaymentResponse process(PaymentBookingInfo bookingInfo) {
        // Giả lập xử lý thành công (VNPAY, MOMO, ZALO...)
        return PaymentResponse.builder()
                .bookingCode(bookingInfo.getBookingCode())
                .amount(bookingInfo.getTotalAmount())
                .transactionId("SIM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .paymentTime(LocalDateTime.now())
                .status("SUCCESS")
                .message("Thanh toán giả lập thành công")
                .build();
    }

    @Override
    public Set<PaymentMethod> getSupportedPaymentMethods() {
        // Giai đoạn dev/test: Simulated xử lý tất cả các cổng thanh toán online
        return Set.of(
                PaymentMethod.VNPAY,
                PaymentMethod.MOMO,
                PaymentMethod.ZALO_PAY,
                PaymentMethod.ATM,
                PaymentMethod.VISA);
    }
}
