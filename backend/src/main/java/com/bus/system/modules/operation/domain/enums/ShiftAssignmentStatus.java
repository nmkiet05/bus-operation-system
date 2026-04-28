package com.bus.system.modules.operation.domain.enums;

/**
 * Trạng thái phân công & điểm danh ca làm việc.
 * Dùng cho bảng shift_assignment.status
 */
public enum ShiftAssignmentStatus {
    ASSIGNED, // Đã phân công
    PRESENT, // Có mặt (Đã điểm danh)
    ABSENT, // Vắng mặt
    LATE // Đi muộn
}
