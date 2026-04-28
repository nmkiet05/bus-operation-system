package com.bus.system.modules.payment.integration.impl;

import com.bus.system.modules.payment.integration.SalesServiceClient;
import com.bus.system.modules.payment.domain.PaymentBookingInfo;
import com.bus.system.modules.sales.dto.response.BookingResponse;
import com.bus.system.modules.sales.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component("paymentSalesServiceClient")
@RequiredArgsConstructor
public class SalesServiceClientImpl implements SalesServiceClient {

    // Inject BookingService directly here as "Local Adapter"
    // In Microservices, this would be a FeignClient or RestTemplate calling another
    // service
    private final BookingService bookingService;

    @Override
    public PaymentBookingInfo getBookingInfo(String bookingCode) {
        BookingResponse response = bookingService.getBookingByCode(bookingCode);
        return PaymentBookingInfo.builder()
                .bookingCode(response.getCode())
                .totalAmount(response.getTotalAmount())
                .status(response.getStatus().name())
                .build();
    }

    @Override
    public void confirmBooking(String bookingCode, String paymentMethod) {
        bookingService.confirmBooking(bookingCode, paymentMethod);
    }
}
