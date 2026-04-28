package com.bus.system.modules.payment.domain;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PaymentBookingInfo {
    private String bookingCode;
    private BigDecimal totalAmount;
    private String status;
}
