package com.bus.system.modules.operation.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties cho Operation Module
 * Chứa các config liên quan đến vận hành: trip generation, driver duty...
 */
@Configuration
@ConfigurationProperties(prefix = "operation")
@Data
public class OperationProperties {

    /**
     * Cấu hình Trip Generation & Scheduling
     */
    private TripGenerationConfig tripGeneration = new TripGenerationConfig();

    /**
     * Cấu hình Trip Change & Handover
     */
    private TripChangeConfig tripChange = new TripChangeConfig();

    /**
     * Cấu hình Driver Duty (Nghị định 10/2020/NĐ-CP)
     */
    private DriverDutyConfig driverDuty = new DriverDutyConfig();

    /**
     * Cấu hình Dispatch Scoring
     */
    private DispatchConfig dispatch = new DispatchConfig();

    @Data
    public static class TripGenerationConfig {
        /**
         * Số ngày tối đa khi generate trips
         */
        private int maxGenerationDays = 31;

        /**
         * Giãn cách tối thiểu giữa các chuyến (phút)
         */
        private long minScheduleGapMinutes = 60;

        /**
         * Giãn cách an toàn khi gán xe/tài xế (phút)
         */
        private long minSafeGapMinutes = 30;
    }

    @Data
    public static class TripChangeConfig {
        /**
         * Cooldown anti-spam khi thay đổi chuyến (phút)
         */
        private int antiSpamCooldownMinutes = 15;

        /**
         * Thời gian cho phép rollback (phút)
         */
        private int rollbackWindowMinutes = 30;

        /**
         * Vùng URGENT bắt đầu từ bao nhiêu phút trước khởi hành
         */
        private int urgentWindowMinutes = 60;

        /**
         * Vùng CRITICAL bắt đầu từ bao nhiêu phút trước khởi hành (= handover gap)
         */
        private int handoverGapMinutes = 15;

        /**
         * Timeout chờ admin duyệt ở Vùng URGENT (phút) — quá hạn → auto-escalate
         */
        private int escalationTimeoutMinutes = 10;
    }

    @Data
    public static class DriverDutyConfig {
        /**
         * Thời gian lái xe tối đa/ngày (phút) - Nghị định 10/2020
         */
        private long maxDailyDrivingMinutes = 600; // 10h

        /**
         * Thời gian lái liên tục tối đa (phút)
         */
        private long maxContinuousDrivingMinutes = 240; // 4h

        /**
         * Thời gian nghỉ tối thiểu (phút)
         */
        private long restTimeThresholdMinutes = 15;

        /**
         * Thời gian lái tối đa/tuần (phút) - Nghị định 10/2020
         */
        private long maxWeeklyDrivingMinutes = 2880; // 48h
    }

    @Data
    public static class DispatchConfig {
        /**
         * Trọng số vị trí (dominant factor)
         */
        private int locationWeight = 100;

        /**
         * Trọng số bảo dưỡng (phá hòa)
         */
        private int maintenanceWeight = 10;

        /**
         * Trọng số idle/fair rotation (phá hòa tiếp)
         */
        private int idleWeight = 1;

        /**
         * Xe cách kỳ bảo dưỡng > N ngày → ưu tiên cao (score = 0)
         */
        private int maintenanceSafeDays = 30;

        /**
         * Xe cách kỳ bảo dưỡng ≤ N ngày → ít ưu tiên (score = 2)
         */
        private int maintenanceWarnDays = 7;
    }
}
