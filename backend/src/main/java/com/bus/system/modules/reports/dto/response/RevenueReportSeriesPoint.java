package com.bus.system.modules.reports.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class RevenueReportSeriesPoint {
    private LocalDate reportDate;
    private BigDecimal grossRevenue;
    private BigDecimal refundAmount;
    private BigDecimal netRevenue;
    private Long soldSeats;
}
