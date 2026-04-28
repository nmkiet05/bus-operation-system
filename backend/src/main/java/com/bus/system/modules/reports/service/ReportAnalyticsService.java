package com.bus.system.modules.reports.service;

import com.bus.system.modules.reports.dto.ReportsFilter;
import com.bus.system.modules.reports.dto.response.LoadFactorReportResponse;
import com.bus.system.modules.reports.dto.response.RevenueReportResponse;

public interface ReportAnalyticsService {
    RevenueReportResponse getRevenueReport(ReportsFilter filter);

    LoadFactorReportResponse getLoadFactorReport(ReportsFilter filter);
}
