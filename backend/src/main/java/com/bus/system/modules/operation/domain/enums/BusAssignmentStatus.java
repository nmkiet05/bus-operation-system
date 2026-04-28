package com.bus.system.modules.operation.domain.enums;

/**
 * Trạng thái ca xe (BusAssignment).
 * PENDING → CHECKED_IN → DEPARTED → COMPLETED
 * PENDING → CANCELLED (hủy lịch chưa xuất bãi)
 * CHECKED_IN/DEPARTED → ENDED_EARLY (kết thúc sớm, vẫn cho checkout/nhập bãi)
 */
public enum BusAssignmentStatus {
    PENDING,      // Ca đã tạo, xe chưa xuất bãi
    CHECKED_IN,   // Xe đã xuất bãi (ghi ODO, fuel)
    DEPARTED,     // Xe đã chạy chuyến đầu tiên
    COMPLETED,    // Xe đã nhập bãi, ca kết thúc bình thường
    CANCELLED,    // Ca bị hủy (chưa xuất bãi)
    ENDED_EARLY   // Kết thúc sớm (đã xuất bãi, vẫn cho checkout)
}
