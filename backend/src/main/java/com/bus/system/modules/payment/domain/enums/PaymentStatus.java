package com.bus.system.modules.payment.domain.enums;

/**
 * Trạng thái thanh toán
 */
public enum PaymentStatus {
    PENDING, // Đang chờ thanh toán
    PROCESSING, // Đang xử lý (redirect to gateway)
    SUCCESS, // Thanh toán thành công
    FAILED, // Thanh toán thất bại
    CANCELLED, // Đã hủy thanh toán
    REFUNDED // Đã hoàn tiền
}
