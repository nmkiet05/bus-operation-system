package com.bus.system.modules.planning.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class RouteResponse {
    private Long id;
    private String code;
    private String name;
    private Long departureStationId;
    private Long arrivalStationId;
    private BigDecimal distance;
    private BigDecimal durationHours;
    private String itineraryDetail;

    private String hotline;
    private Long defaultRefundPolicyId;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}