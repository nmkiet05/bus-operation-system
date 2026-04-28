package com.bus.system.modules.payment.controller;

import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.payment.dto.request.PaymentRequest;
import com.bus.system.modules.payment.dto.response.PaymentResponse;
import com.bus.system.modules.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payment - Thanh toán", description = "Mô phỏng thanh toán & Tích hợp cổng thanh toán")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/process")
    @Operation(summary = "Xử lý thanh toán", description = "API xử lý thanh toán booking theo phương thức được chọn")
    public ResponseEntity<ApiResponse<PaymentResponse>> processPayment(@Valid @RequestBody PaymentRequest request) {
        log.info("Processing payment for booking: {}", request.getBookingCode());
        PaymentResponse response = paymentService.processPayment(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Xử lý thanh toán thành công"));
    }

    @PostMapping("/simulate")
    @Operation(summary = "Mô phỏng thanh toán", description = "API giả lập thanh toán thành công (Test Only)")
    public ResponseEntity<ApiResponse<PaymentResponse>> simulatePayment(@Valid @RequestBody PaymentRequest request) {
        log.info("Simulating payment for booking: {}", request.getBookingCode());
        PaymentResponse response = paymentService.simulatePayment(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Thanh toán (mô phỏng) thành công"));
    }
}
