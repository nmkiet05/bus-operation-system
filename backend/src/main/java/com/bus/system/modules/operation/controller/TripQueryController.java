package com.bus.system.modules.operation.controller;

import com.bus.system.common.constants.AppConstants;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.operation.dto.request.TripSearchRequest;
import com.bus.system.modules.operation.dto.response.TripResponse;
import com.bus.system.modules.operation.service.TripQueryService;
import com.bus.system.modules.sales.dto.response.SeatMapResponse;
import com.bus.system.modules.sales.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller truy vấn chuyến xe — chỉ GET, không thay đổi dữ liệu.
 */
@RestController
@RequestMapping("/api/operation/trips")
@RequiredArgsConstructor
@Tag(name = "Trip - Truy vấn", description = "Xem danh sách, chi tiết, tìm kiếm chuyến xe")
public class TripQueryController {

    private final TripQueryService tripQueryService;
    private final BookingService bookingService;

    @GetMapping
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Lấy danh sách chuyến", description = "Tìm kiếm chuyến theo tuyến, khoảng ngày và trạng thái")
    public ResponseEntity<ApiResponse<List<TripResponse>>> getTrips(
            @RequestParam(required = false) Long routeId,
            @RequestParam(required = false) Long fromProvinceId,
            @RequestParam(required = false) Long toProvinceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String tripType) {
        List<TripResponse> response = tripQueryService.getTrips(routeId, fromProvinceId, toProvinceId, fromDate,
                toDate, status, tripType);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm chuyến xe (Khách hàng)", description = "Tìm kiếm chuyến theo Điểm đi, Điểm đến, Ngày, Giá, Loại xe...")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<TripResponse>>> searchTrips(
            @ParameterObject TripSearchRequest request) {
        org.springframework.data.domain.Page<TripResponse> response = tripQueryService.searchTrips(request);
        return ResponseEntity
                .ok(ApiResponse.success(response, "Tìm thấy " + response.getTotalElements() + " chuyến phù hợp"));
    }

    @GetMapping("/{id}")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Xem chi tiết chuyến", description = "Lấy thông tin chi tiết một chuyến xe")
    public ResponseEntity<ApiResponse<TripResponse>> getTripById(@PathVariable Long id) {
        TripResponse response = tripQueryService.getTripById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/seat-map")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Lấy sơ đồ ghế chuyến", description = "Xem ghế trống/đã đặt cho một chuyến (dành cho khách hàng)")
    public ResponseEntity<ApiResponse<SeatMapResponse>> getSeatMap(@PathVariable Long id) {
        SeatMapResponse response = bookingService.getSeatMap(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
