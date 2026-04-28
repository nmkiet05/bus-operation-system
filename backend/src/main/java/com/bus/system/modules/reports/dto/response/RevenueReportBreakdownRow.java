package com.bus.system.modules.reports.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class RevenueReportBreakdownRow {
    private Long routeId;
    private String routeName;
    private Long busTypeId;
    private String busTypeName;
    private BigDecimal grossRevenue;
    private BigDecimal refundAmount;
    private BigDecimal netRevenue;
    private Long soldSeats;
    private BigDecimal avgTicketPrice;
}
