package com.bus.system.modules.payment.service;

import com.bus.system.modules.payment.dto.request.PaymentRequest;
import com.bus.system.modules.payment.dto.response.PaymentResponse;

public interface PaymentService {
    PaymentResponse processPayment(PaymentRequest request);

    /**
     * Backward compatibility cho endpoint cũ /simulate.
     */
    PaymentResponse simulatePayment(PaymentRequest request);
}
