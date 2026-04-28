package com.bus.system.modules.sales.domain.enums;

/**
 * Trạng thái đơn đặt vé (Booking)
 */
public enum BookingStatus {
    PENDING, // Đang giữ ghế (chờ thanh toán)
    CONFIRMED, // Đã xác nhận (thanh toán thành công)
    CANCELLED, // Đã hủy
    EXPIRED, // Hết hạn (không thanh toán kịp)
    REFUNDED // Đã hoàn tiền
}
