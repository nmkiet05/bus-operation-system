package com.bus.system.modules.reports.service.impl;

import com.bus.system.modules.reports.dto.ReportsFilter;
import com.bus.system.modules.reports.dto.response.*;
import com.bus.system.modules.reports.repository.ReportAnalyticsRepository;
import com.bus.system.modules.reports.service.ReportAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * KIẾN TRÚC LỚP SERVICE (Tầng trung gian xử lý):
 * Nhiệm vụ của Service này là "Nhào nặn" kết quả thô (List<Map<String, Object>>) từ Native SQL Repository 
 * thành những Class có cấu trúc hình cây cực kỳ chặt chẽ (Ví dụ: RevenueReportResponse).
 * Nó bảo vệ hệ thống khỏi các lỗi sai định dạng kiểu dữ liệu (Type Mismatch) trước khi trả JSON về UI.
 */
@Service
@RequiredArgsConstructor
public class ReportAnalyticsServiceImpl implements ReportAnalyticsService {

    private final ReportAnalyticsRepository repository;

    @Override
    public RevenueReportResponse getRevenueReport(ReportsFilter filter) {
        Map<String, Object> summary = repository.revenueSummary(filter);
        List<Map<String, Object>> seriesRows = repository.revenueSeries(filter);
        List<Map<String, Object>> breakdownRows = repository.revenueBreakdown(filter);
        Map<String, Object> filters = buildFilters(filter);

        // Sử dụng Builder Pattern (Lombok) để xây dựng cây dữ liệu 3 chân (Summary, Series, Breakdown).
        // Các hàm helper dec(), longVal(), str() có nhiệm vụ chuyển đổi an toàn từ Object thô của JDBC 
        // sang kiểu số nguyên (Long), số thực (BigDecimal) hoặc văn bản (String) để né lỗi Null Pointer Exception.
        return RevenueReportResponse.builder()
                .summary(RevenueReportSummary.builder()
                        .grossRevenue(dec(summary.get("gross_revenue")))
                        .refundAmount(dec(summary.get("refund_amount")))
                        .netRevenue(dec(summary.get("net_revenue")))
                        .soldSeats(longVal(summary.get("sold_seats")))
                        .bookingCount(longVal(summary.get("booking_count")))
                        .avgTicketPrice(dec(summary.get("avg_ticket_price")))
                        .build())
                .series(seriesRows.stream().map(r -> RevenueReportSeriesPoint.builder()
                    .reportDate(dateVal(r.get("report_date")))
                        .grossRevenue(dec(r.get("gross_revenue")))
                        .refundAmount(dec(r.get("refund_amount")))
                        .netRevenue(dec(r.get("net_revenue")))
                        .soldSeats(longVal(r.get("sold_seats")))
                        .build()).toList())
                .breakdown(breakdownRows.stream().map(r -> RevenueReportBreakdownRow.builder()
                        .routeId(longVal(r.get("route_id")))
                        .routeName(str(r.get("route_name")))
                        .busTypeId(longVal(r.get("bus_type_id")))
                        .busTypeName(str(r.get("bus_type_name")))
                        .grossRevenue(dec(r.get("gross_revenue")))
                        .refundAmount(dec(r.get("refund_amount")))
                        .netRevenue(dec(r.get("net_revenue")))
                        .soldSeats(longVal(r.get("sold_seats")))
                        .avgTicketPrice(dec(r.get("avg_ticket_price")))
                        .build()).toList())
                    .filtersApplied(filters)
                .build();
    }

    @Override
    public LoadFactorReportResponse getLoadFactorReport(ReportsFilter filter) {
        Map<String, Object> summary = repository.loadFactorSummary(filter);
        List<Map<String, Object>> seriesRows = repository.loadFactorSeries(filter);
        List<Map<String, Object>> breakdownRows = repository.loadFactorBreakdown(filter);
        Map<String, Object> filters = buildFilters(filter);

        return LoadFactorReportResponse.builder()
                .summary(LoadFactorReportSummary.builder()
                        .soldSeats(longVal(summary.get("sold_seats")))
                        .availableSeats(longVal(summary.get("available_seats")))
                        .loadFactor(dec(summary.get("load_factor")))
                        .build())
                .series(seriesRows.stream().map(r -> LoadFactorReportSeriesPoint.builder()
                    .reportDate(dateVal(r.get("report_date")))
                        .soldSeats(longVal(r.get("sold_seats")))
                        .availableSeats(longVal(r.get("available_seats")))
                        .loadFactor(dec(r.get("load_factor")))
                        .build()).toList())
                .breakdown(breakdownRows.stream().map(r -> LoadFactorReportBreakdownRow.builder()
                        .routeId(longVal(r.get("route_id")))
                        .routeName(str(r.get("route_name")))
                        .busTypeId(longVal(r.get("bus_type_id")))
                        .busTypeName(str(r.get("bus_type_name")))
                        .soldSeats(longVal(r.get("sold_seats")))
                        .availableSeats(longVal(r.get("available_seats")))
                        .loadFactor(dec(r.get("load_factor")))
                        .build()).toList())
                    .filtersApplied(filters)
                .build();
    }

                private Map<String, Object> buildFilters(ReportsFilter filter) {
                Map<String, Object> filters = new HashMap<>();
                filters.put("fromDate", filter.getFromDate());
                filters.put("toDate", filter.getToDate());
                filters.put("routeId", filter.getRouteId());
                filters.put("busTypeId", filter.getBusTypeId());
                filters.put("granularity", filter.getGranularity());
                return filters;
                }

    private BigDecimal dec(Object v) {
        if (v == null) {
            return BigDecimal.ZERO;
        }
        if (v instanceof BigDecimal b) {
            return b;
        }
        return new BigDecimal(v.toString());
    }

    private Long longVal(Object v) {
        if (v == null) {
            return 0L;
        }
        if (v instanceof Number n) {
            return n.longValue();
        }
        return Long.parseLong(v.toString());
    }

    private String str(Object v) {
        return v == null ? null : v.toString();
    }

    private LocalDate dateVal(Object v) {
        if (v == null) {
            return null;
        }
        if (v instanceof LocalDate ld) {
            return ld;
        }
        if (v instanceof java.sql.Date d) {
            return d.toLocalDate();
        }
        return LocalDate.parse(v.toString());
    }
}
