package com.bus.system.modules.planning.controller;

import com.bus.system.common.constants.AppConstants;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.planning.dto.request.TripScheduleRequest;
import com.bus.system.modules.planning.dto.response.TripScheduleResponse;
import com.bus.system.modules.planning.service.TripScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/planning/schedules")
@RequiredArgsConstructor
@Tag(name = "Planning - Lịch trình mẫu", description = "Quản lý lịch chạy cố định (Template để sinh Trip)")
public class TripScheduleController {

    private final TripScheduleService tripScheduleService;

    // =====================================================================
    // 1. TẠO LỊCH TRÌNH MẪU
    // =====================================================================
    @PostMapping
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Tạo lịch trình mẫu", description = "Tạo mới lịch khởi hành cố định. Dùng để sinh chuyến tự động.")
    public ResponseEntity<ApiResponse<TripScheduleResponse>> createTripSchedule(
            @Valid @RequestBody TripScheduleRequest request) {
        TripScheduleResponse response = tripScheduleService.create(request);
        // HTTP 201 Created theo chuẩn RESTful
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo lịch trình thành công"));
    }

    // =====================================================================
    // 2. LẤY DANH SÁCH LỊCH TRÌNH THEO TUYẾN
    // =====================================================================
    @GetMapping
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF) // Bảo mật: Chỉ nội bộ xem
    @Operation(summary = "Lấy lịch trình theo tuyến", description = "Trả về danh sách lịch trình ACTIVE của một tuyến đường. TODO: Thêm Pageable nếu dữ liệu lớn.")
    public ResponseEntity<ApiResponse<List<TripScheduleResponse>>> getSchedulesByRoute(
            @RequestParam Long routeId) {
        List<TripScheduleResponse> response = tripScheduleService.getSchedulesByRoute(routeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/trash")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Lấy lịch trình đã xóa mềm theo tuyến")
    public ResponseEntity<ApiResponse<List<TripScheduleResponse>>> getDeletedSchedulesByRoute(
            @RequestParam Long routeId) {
        List<TripScheduleResponse> response = tripScheduleService.getDeletedSchedulesByRoute(routeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // =====================================================================
    // 3. CẬP NHẬT LỊCH TRÌNH
    // =====================================================================
    @PutMapping("/{id}")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Cập nhật lịch trình", description = "Sửa giờ khởi hành, ngày hoạt động...")
    public ResponseEntity<ApiResponse<TripScheduleResponse>> updateTripSchedule(
            @PathVariable Long id,
            @Valid @RequestBody TripScheduleRequest request) {
        TripScheduleResponse response = tripScheduleService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật lịch trình thành công"));
    }

    // =====================================================================
    // 4. XÓA LỊCH TRÌNH
    // =====================================================================
    @DeleteMapping("/{id}")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Xóa lịch trình", description = "Xóa lịch trình mẫu (Yêu cầu quyền ADMIN)")
    public ResponseEntity<ApiResponse<Void>> deleteTripSchedule(@PathVariable Long id) {
        tripScheduleService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa lịch trình thành công"));
    }

    @PostMapping("/{id}/restore")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Khôi phục lịch trình đã xóa mềm")
    public ResponseEntity<ApiResponse<Void>> restoreTripSchedule(@PathVariable Long id) {
        tripScheduleService.restore(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Khôi phục lịch trình thành công"));
    }
}
