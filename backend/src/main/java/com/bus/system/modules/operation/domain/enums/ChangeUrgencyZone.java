package com.bus.system.modules.operation.domain.enums;

/**
 * 5 Vùng thời gian cho quy trình đổi ca tài xế.
 *
 * Phân vùng dựa trên khoảng cách so với giờ khởi hành (T):
 * - STANDARD : > T-60' → Admin duyệt bình thường
 * - URGENT : T-60' → T-15' → Chờ admin 10', timeout → auto-execute
 * - CRITICAL : T-15' → T → Bypass ngay, hậu kiểm, reject OK
 * - DEPARTED : Sau T (RUNNING) → Bypass, CẤM reject
 * - MID_ROUTE : Sự cố dọc đường → Bypass + incident_type/gps, CẤM reject
 */
public enum ChangeUrgencyZone {

    /** > 60 phút trước khởi hành — flow bình thường */
    STANDARD,

    /** 60'–15' trước khởi hành — chờ admin 10', timeout auto-escalate */
    URGENT,

    /** < 15' trước khởi hành — bypass ngay, admin hậu kiểm */
    CRITICAL,

    /** Xe đã rời bến (trip RUNNING) — bypass, admin KHÔNG thể reject */
    DEPARTED,

    /** Sự cố dọc đường — bypass + ghi incident, admin KHÔNG thể reject */
    MID_ROUTE;

    /**
     * Vùng này có cho phép Admin reject khi hậu kiểm không?
     */
    public boolean isRejectAllowed() {
        return this == STANDARD || this == URGENT || this == CRITICAL;
    }

    /**
     * Vùng này có auto-execute không? (bypass admin approval)
     */
    public boolean isAutoExecute() {
        return this == CRITICAL || this == DEPARTED || this == MID_ROUTE;
    }

    /**
     * Vùng này có yêu cầu thông tin incident không?
     */
    public boolean requiresIncidentInfo() {
        return this == MID_ROUTE;
    }
}
