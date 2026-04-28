package com.bus.system.modules.sales.constant;

/**
 * Technical constants cho Booking module
 * CHỈ chứa constants kỹ thuật (prefix, key format...), KHÔNG chứa business
 * logic
 * Business logic → BookingProperties (application.yml)
 */
public final class BookingConstants {

    private BookingConstants() {
        // Private constructor to prevent instantiation
    }

    // Redis Key Prefixes (Technical - không thay đổi)
    public static final String SEAT_LOCK_PREFIX = "seat-lock:";
    public static final String IDEMPOTENCY_KEY_PREFIX = "idempotency:";
}
