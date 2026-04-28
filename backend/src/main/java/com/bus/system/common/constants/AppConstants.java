package com.bus.system.common.constants;

/**
 * =====================================================================
 * TECHNICAL CONSTANTS - Chỉ chứa cấu hình kỹ thuật
 * =====================================================================
 * QUY TẮC: KHÔNG đặt business data (status, type...) ở đây!
 * → Dùng Enum trong: com.bus.system.common.enums.*
 *
 * ⚠️ MIGRATION NOTE:
 * - Pagination, Date Formats, Validation Regex → AppProperties
 * (application.yml)
 * - Seat Lock, Booking Expiry → BookingProperties (application.yml)
 * - Trip Generation, Driver Duty → OperationProperties (application.yml)
 *
 * @see com.bus.system.common.enums
 * @see com.bus.system.common.config.AppProperties
 * @see com.bus.system.modules.sales.config.BookingProperties
 * @see com.bus.system.modules.operation.config.OperationProperties
 */
public final class AppConstants {

    private AppConstants() {
        // Utility class - prevent instantiation
    }

    // =====================================================================
    // 1. SECURITY: SpEL Expressions for @PreAuthorize
    // =====================================================================
    public static final String HAS_ROLE_ADMIN = "hasRole('ADMIN')";
    public static final String HAS_ROLE_STAFF = "hasRole('STAFF')";
    public static final String HAS_ROLE_DRIVER = "hasRole('DRIVER')";
    public static final String HAS_ROLE_CUSTOMER = "hasRole('CUSTOMER')";
    public static final String HAS_ANY_ROLE_ADMIN_STAFF = "hasAnyRole('ADMIN', 'STAFF')";
    public static final String HAS_ANY_ROLE_ADMIN_STAFF_DRIVER = "hasAnyRole('ADMIN', 'STAFF', 'DRIVER')";

    // =====================================================================
    // 2. API PATH PREFIX (Technical - không thay đổi)
    // =====================================================================
    public static final String API_PREFIX = "/api";
    public static final String API_V1_PREFIX = "/api/v1";

    // =====================================================================
    // 3. PAGINATION - Vẫn dùng trong TripQueryServiceImpl
    // =====================================================================
    public static final int DEFAULT_PAGE = 0;
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;
}
