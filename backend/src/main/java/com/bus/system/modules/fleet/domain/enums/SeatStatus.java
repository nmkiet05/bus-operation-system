package com.bus.system.modules.fleet.domain.enums;

/**
 * Trạng thái ghế ngồi trên xe
 */
public enum SeatStatus {
    AVAILABLE, // Còn trống
    LOCKED, // Đang được giữ (chờ thanh toán)
    BOOKED, // Đã được đặt
    BLOCKED // Bị khóa (ghế hỏng, không bán)
}
