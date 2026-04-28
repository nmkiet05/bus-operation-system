package com.bus.system.modules.reports.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class LoadFactorReportSeriesPoint {
    private LocalDate reportDate;
    private Long soldSeats;
    private Long availableSeats;
    private BigDecimal loadFactor;
}
