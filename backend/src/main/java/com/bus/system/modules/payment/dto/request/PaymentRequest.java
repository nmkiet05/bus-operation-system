package com.bus.system.modules.payment.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PaymentRequest {
    @NotBlank(message = "Mã đặt vé không được để trống")
    private String bookingCode;

    @NotBlank(message = "Phương thức thanh toán không được để trống")
    private String method; // VN_PAY, MOMO, ZALO_PAY, CASH
}
