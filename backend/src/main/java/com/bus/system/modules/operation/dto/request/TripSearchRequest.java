package com.bus.system.modules.operation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Schema(description = "Yêu cầu tìm kiếm chuyến xe (Advanced Search)")
public class TripSearchRequest {

    @Schema(description = "ID Tỉnh/Thành phố đi", example = "1")
    private Long fromProvinceId;

    @Schema(description = "ID Tỉnh/Thành phố đến", example = "2")
    private Long toProvinceId;

    @Schema(description = "Ngày khởi hành (yyyy-MM-dd)", example = "2026-02-15")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate departureDate;

    @Schema(description = "ID Tuyến đường (Optional - Nếu muốn tìm cụ thể)", example = "10")
    private Long routeId;

    @Schema(description = "ID Loại xe (Optional - Lọc theo loại ghế/giường)", example = "1")
    private Long busTypeId;

    @Schema(description = "Giá vé thấp nhất (Optional)", example = "100000")
    private Double minPrice;

    @Schema(description = "Giá vé cao nhất (Optional)", example = "500000")
    private Double maxPrice;

    @Schema(description = "Giờ khởi hành từ (HH:mm)", example = "06:00")
    @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
    private LocalTime minTime;

    @Schema(description = "Giờ khởi hành đến (HH:mm)", example = "22:00")
    @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
    private LocalTime maxTime;

    // Pagination
    @Schema(description = "Số trang (bắt đầu từ 0)", example = "0")
    private int page = 0;

    @Schema(description = "Số lượng kết quả mỗi trang", example = "20")
    private int size = 20;

    // [ADMIN SUPPORT] Range Search
    @Schema(hidden = true)
    private LocalDate fromDate;

    @Schema(hidden = true)
    private LocalDate toDate;
}
