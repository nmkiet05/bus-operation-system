package com.bus.system.modules.reports.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class RevenueReportSummary {
    private BigDecimal grossRevenue;
    private BigDecimal refundAmount;
    private BigDecimal netRevenue;
    private Long soldSeats;
    private Long bookingCount;
    private BigDecimal avgTicketPrice;
}
