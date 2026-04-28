package com.bus.system.modules.reports.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/**
 * KHẲNG ĐỊNH KIẾN TRÚC (Layered Architecture):
 * Data Transfer Object (DTO) chuyên gom các tham số Query Params từ URL (vd: ?fromDate=...&toDate=...)
 * Đặt class này ở package 'dto' là CHÍNH XÁC 100%. Nếu đặt ở 'domain' sẽ là ANTI-PATTERN vì Filter 
 * không biểu diễn thực thể lưu trữ dưới Database.
 */
@Data
public class ReportsFilter {
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fromDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate toDate;

    private Long routeId;
    private Long busTypeId;
    
    private String granularity = "day"; // Mặc định defaultValue = "day" để xóa bỏ @RequestParam trong Controller.
}
