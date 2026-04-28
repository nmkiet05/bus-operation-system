package com.bus.system.modules.operation.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

/**
 * Response cho API check compliance của tài xế.
 * Frontend dùng để hiển thị bảng chuyến: available (gỡ được) / disabled (không
 * gỡ được + lý do).
 */
@Getter
@Builder
public class DriverTripComplianceResponse {

    private Long driverId;
    private long weeklyDrivenMinutes;
    private long maxWeeklyMinutes;
    private long remainingMinutes;

    private List<TripComplianceItem> trips;

    @Getter
    @Builder
    public static class TripComplianceItem {
        private Long tripId;
        private LocalDate departureDate;
        private String routeName;
        private long durationMinutes;
        /** true = frontend enable nút gỡ, false = disable + hiện reason */
        private boolean canUnassign;
        /** Lý do không thể gỡ (null nếu canUnassign = true) */
        private String reason;
    }
}
