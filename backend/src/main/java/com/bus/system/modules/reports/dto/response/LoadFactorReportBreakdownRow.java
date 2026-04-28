package com.bus.system.modules.reports.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class LoadFactorReportBreakdownRow {
    private Long routeId;
    private String routeName;
    private Long busTypeId;
    private String busTypeName;
    private Long soldSeats;
    private Long availableSeats;
    private BigDecimal loadFactor;
}
