package com.bus.system.modules.payment.domain.enums;

public enum PaymentMethod {
    CASH,         // Tiền mặt tại quầy
    COUNTER,      // Tại quầy nhà xe
    VNPAY,        // VNPAY
    MOMO,         // MOMO
    ZALO_PAY,     // ZaloPay
    ATM,          // Thẻ ATM nội địa
    VISA,         // Thẻ quốc tế (Visa/Master)
    BANK_TRANSFER; // Chuyển khoản ngân hàng (mock QR)

    public static PaymentMethod fromString(String method) {
        try {
            return PaymentMethod.valueOf(method.toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Unknown payment method: " + method);
        }
    }
}
