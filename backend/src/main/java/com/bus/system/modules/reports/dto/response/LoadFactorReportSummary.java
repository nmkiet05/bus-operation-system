package com.bus.system.modules.reports.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class LoadFactorReportSummary {
    private Long soldSeats;
    private Long availableSeats;
    private BigDecimal loadFactor;
}
