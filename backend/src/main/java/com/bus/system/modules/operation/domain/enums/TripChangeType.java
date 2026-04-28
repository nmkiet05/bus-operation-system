package com.bus.system.modules.operation.domain.enums;

/**
 * Loại thay đổi trong yêu cầu TripChangeRequest.
 *
 * Lưu ý: Mỗi request chỉ được đổi MỘT thành viên crew hoặc xe.
 * Điều này đảm bảo tuân thủ quy định Anti-spam (cooldown giữa các lần đổi).
 */
public enum TripChangeType {
    /** Thay thế tài xế chính */
    REPLACE_DRIVER,
    /** Thay thế tài xế phụ */
    REPLACE_CO_DRIVER,
    /** Thay thế nhân viên phục vụ */
    REPLACE_ATTENDANT,
    /** Thay thế xe */
    REPLACE_BUS,
    /** Sự cố dọc đường — swap tài xế khẩn cấp (Vùng 5 MID_ROUTE) */
    INCIDENT_SWAP;

    /**
     * Mapping TripChangeType → CrewRole tương ứng.
     * Dùng chung cho Executor (swap) và Resolver (tìm old crew).
     */
    public CrewRole toCrewRole() {
        return switch (this) {
            case REPLACE_CO_DRIVER -> CrewRole.CO_DRIVER;
            case REPLACE_ATTENDANT -> CrewRole.ATTENDANT;
            default -> CrewRole.MAIN_DRIVER;
        };
    }
}
