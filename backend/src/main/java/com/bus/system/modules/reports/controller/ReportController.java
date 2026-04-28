package com.bus.system.modules.reports.controller;

import com.bus.system.common.constants.AppConstants;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.reports.dto.ReportsFilter;
import com.bus.system.modules.reports.dto.response.LoadFactorReportResponse;
import com.bus.system.modules.reports.dto.response.RevenueReportResponse;
import com.bus.system.modules.reports.service.ReportAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * KIẾN TRÚC CONTROLLER (Tầng giao tiếp HTTP):
 * Controller này cực kỳ mỏng (Skinny Controller), hoàn toàn không chứa bất kỳ logic tính toán toán học nào.
 * Nhiệm vụ duy nhất của nó là nhận các Query String từ URL Frontend (như /api/reports/revenue?fromDate=...),
 * bắt validate kiểu dữ liệu (vd: ép kiểu String thành LocalDate), và nhét tất cả vào cái "Túi xách" ReportsFilter.
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Báo cáo kinh doanh")
public class ReportController {

    private final ReportAnalyticsService reportAnalyticsService;

    @GetMapping("/revenue")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Báo cáo doanh thu tổng hợp")
    public ResponseEntity<ApiResponse<RevenueReportResponse>> getRevenue(
            @org.springdoc.core.annotations.ParameterObject @org.springframework.web.bind.annotation.ModelAttribute ReportsFilter filter) {

        // Siêu mỏng (Skinny Controller): Toàn bộ thao tác bắt RequestParam, ép kiểu Date, defaultValue "day"
        // đã được giao lại cho Spring Boot tự động móc nối trực tiếp vào Object (Data Binding).
        return ResponseEntity.ok(ApiResponse.success(reportAnalyticsService.getRevenueReport(filter)));
    }

    @GetMapping("/load-factor")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Báo cáo tỷ lệ lấp đầy")
    public ResponseEntity<ApiResponse<LoadFactorReportResponse>> getLoadFactor(
            @org.springdoc.core.annotations.ParameterObject @org.springframework.web.bind.annotation.ModelAttribute ReportsFilter filter) {

        // Siêu mỏng (Skinny Controller): Toàn bộ thao tác bắt RequestParam, ép kiểu Date, defaultValue "day"
        // đã được giao lại cho Spring Boot tự động móc nối trực tiếp vào Object (Data Binding).
        return ResponseEntity.ok(ApiResponse.success(reportAnalyticsService.getLoadFactorReport(filter)));
    }

}
