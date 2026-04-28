package com.bus.system.modules.planning.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalTime;

@Data
public class PickupPointResponse {
    private Long id;
    private String code;
    private Long routeId;
    private String name;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer sequenceOrder;
    private Integer estimatedMinutesFromDeparture;
    private String status;

    /**
     * Helper: Tính giờ đón dự kiến dựa trên giờ xuất bến.
     * 
     * @param departureTime Giờ xe xuất bến
     * @return Giờ đón dự kiến tại điểm này
     */
    public LocalTime calculateEstimatedPickupTime(LocalTime departureTime) {
        if (departureTime == null || estimatedMinutesFromDeparture == null) {
            return null;
        }
        return departureTime.plusMinutes(estimatedMinutesFromDeparture);
    }
}
