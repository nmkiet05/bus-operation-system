package com.bus.system.modules.operation.domain.enums;

public enum ChangeRequestStatus {
    PENDING,
    /** Auto-execute do timeout (Vùng URGENT — admin không kịp duyệt trong 10') */
    ESCALATED,
    APPROVED,
    REJECTED,
    CANCELLED
}
