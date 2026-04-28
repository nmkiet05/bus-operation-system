package com.bus.system.modules.planning.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ScheduleBusTypeResponse {
    private Long id;
    private Long tripScheduleId;
    private Long busTypeId;
    private String busTypeName;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private String status;
    private String reason;
    private LocalDateTime createdAt;
}
