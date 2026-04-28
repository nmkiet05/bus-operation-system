package com.bus.system.modules.reports.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * CẤU TRÚC PHẢN HỒI JSON (Phục vụ vẽ Chart Frontend):
 * Phản chiếu tương tự kiến trúc 3 thành phần của Doanh Thu (Summary + Series + Breakdown).
 * Sự đồng nhất về cấu trúc Response này giúp team Frontend dễ dàng tái sử dụng (Re-use) 
 * lại các Component React hiển thị biểu đồ mà không cần code lại logic xoay dữ liệu.
 */
@Data
@Builder
public class LoadFactorReportResponse {
    private LoadFactorReportSummary summary;
    private List<LoadFactorReportSeriesPoint> series;
    private List<LoadFactorReportBreakdownRow> breakdown;
    private Map<String, Object> filtersApplied;
}
