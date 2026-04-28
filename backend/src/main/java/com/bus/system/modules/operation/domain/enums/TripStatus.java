package com.bus.system.modules.operation.domain.enums;

/**
 * Trạng thái chuyến xe
 */
public enum TripStatus {
    SCHEDULED, // Đã lên lịch (chưa khởi hành, chưa duyệt)
    APPROVED, // Đã duyệt (xe/ghế đã khóa, mở bán vé)
    BOARDING, // Đang đón khách
    RUNNING, // Đang chạy
    COMPLETED, // Đã hoàn thành
    CANCELLED, // Đã hủy chuyến
    DELAYED // Bị trễ.
}
