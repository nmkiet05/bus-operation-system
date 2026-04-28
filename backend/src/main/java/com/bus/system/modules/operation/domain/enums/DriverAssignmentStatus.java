package com.bus.system.modules.operation.domain.enums;

/**
 * Trạng thái phân công tài xế trên chuyến.
 *
 * Lifecycle:
 * PENDING → ACTIVE (chuyến bắt đầu chạy)
 * ACTIVE → COMPLETED (lái hết chuyến)
 * ACTIVE → ENDED_EARLY (swap giữa chừng / sự cố)
 * PENDING → CANCELLED (hủy trước khi chạy)
 * ACTIVE → CANCELLED (hủy giữa chừng)
 */
public enum DriverAssignmentStatus {
    PENDING, // Đã phân công, chờ chuyến chạy
    ACTIVE, // Đang phục vụ chuyến
    COMPLETED, // Hoàn thành bình thường (lái hết chuyến)
    ENDED_EARLY, // Kết thúc sớm (đổi tài xế giữa chừng, sự cố)
    CANCELLED // Hủy phân công
}
