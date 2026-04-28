package com.bus.system.modules.reports.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * CẤU TRÚC PHẢN HỒI JSON (Phục vụ vẽ Chart Frontend):
 * Được thiết kế theo chuẩn "3 Rễ" để Frontend chỉ cần 1 API duy nhất là vẽ được cả màn hình:
 * 1. Summary: Chứa số liệu tổng để vẽ các khối KPI Cards (Khối vuông ngoài cùng).
 * 2. Series: Chứa danh sách mảng ngày tháng để vẽ Biểu đồ Đường (Line/Area Chart) theo xu hướng.
 * 3. Breakdown: Chứa cấu trúc theo cụm (loại xe, tuyến) để vẽ Biểu đồ Cột hoặc Bảng Chi tiết.
 */
@Data
@Builder
public class RevenueReportResponse {
    private RevenueReportSummary summary;
    private List<RevenueReportSeriesPoint> series;
    private List<RevenueReportBreakdownRow> breakdown;
    private Map<String, Object> filtersApplied;
}
