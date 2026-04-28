package com.bus.system.modules.operation.domain.enums;

/**
 * Mức độ vi phạm trong biên bản bàn giao xe.
 * Sử dụng Enum thay vì String để đảm bảo Type Safety.
 */
public enum ViolationLevel {
    /** Cảnh báo nhẹ (Vd: Khấn cấp từ đồng ghi nhận) */
    WARNING,

    /** Nghiêm trọng (Vd: Hư hỏng, vi phạm quy trình, bị từ chối hậu kiểm) */
    CRITICAL
}
