package com.bus.system.modules.sales.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties cho Booking module
 * Các giá trị business logic có thể thay đổi theo môi trường/chính sách
 */
@Configuration
@ConfigurationProperties(prefix = "booking")
@Data
public class BookingProperties {

    /**
     * Thời gian giữ chỗ (phút) - có thể điều chỉnh theo:
     * - Giờ cao điểm: giảm để tăng tính cạnh tranh
     * - Giờ thấp điểm: tăng để tăng conversion rate
     * - Khách VIP: có thể set riêng
     */
    private int expiryMinutes = 15;

    /**
     * Cấu hình cho Distributed Lock (Redisson)
     */
    private LockConfig lock = new LockConfig();

    /**
     * Cấu hình cho Redis Cache
     */
    private CacheConfig cache = new CacheConfig();

    @Data
    public static class LockConfig {
        /**
         * Timeout để acquire lock (giây)
         * Tăng nếu server chậm, giảm nếu cần fail-fast
         */
        private int waitTimeoutSeconds = 10;

        /**
         * Lock lease time (giây) - thời gian tự động unlock
         * Cần tune theo thời gian xử lý thực tế
         */
        private int leaseTimeSeconds = 300; // 5 phút
    }

    @Data
    public static class CacheConfig {
        /**
         * TTL của idempotency key cache (giờ)
         * Tăng nếu khách retry nhiều, giảm để tiết kiệm memory
         */
        private int idempotencyTtlHours = 1;
    }
}
