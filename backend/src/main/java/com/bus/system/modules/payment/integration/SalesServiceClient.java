package com.bus.system.modules.payment.integration;

import com.bus.system.modules.payment.domain.PaymentBookingInfo;

public interface SalesServiceClient {
    PaymentBookingInfo getBookingInfo(String bookingCode);

    void confirmBooking(String bookingCode, String paymentMethod);
}
