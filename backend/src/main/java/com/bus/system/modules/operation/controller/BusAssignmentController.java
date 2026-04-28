package com.bus.system.modules.operation.controller;

import com.bus.system.common.constants.AppConstants;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.operation.dto.request.CreateBusAssignmentRequest;
import com.bus.system.modules.operation.dto.request.UpdateBusAssignmentRequest;
import com.bus.system.modules.operation.dto.response.BusAssignmentResponse;
import com.bus.system.modules.operation.service.BusAssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Controller quản lý Ca xe (Bus Assignment).
 * Dùng cho quản bãi (Depot Manager): tạo ca, gán trip, CHECK-IN/OUT xe.
 */
@RestController
@RequestMapping("/api/bus-assignments")
@RequiredArgsConstructor
@Tag(name = "Bus Assignment", description = "API quản lý ca xe")
public class BusAssignmentController {

    private final BusAssignmentService busAssignmentService;

    // ==================== CRUD ====================

    @PostMapping
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Tạo Ca xe", description = "Tạo ca xe thủ công: chọn bus, depot, thời gian")
    public ResponseEntity<ApiResponse<BusAssignmentResponse>> create(
            @RequestBody @Valid CreateBusAssignmentRequest request) {
        BusAssignmentResponse response = busAssignmentService.createBusAssignment(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Tạo ca xe thành công!"));
    }

    @GetMapping
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Danh sách Ca xe", description = "Lọc theo ngày, xe")
    public ResponseEntity<ApiResponse<List<BusAssignmentResponse>>> list(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long busId) {
        List<BusAssignmentResponse> list = busAssignmentService.listBusAssignments(date, busId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PutMapping("/{id}")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Cập nhật Ca xe", description = "Cập nhật thời gian, ghi chú ca xe (chỉ khi PENDING)")
    public ResponseEntity<ApiResponse<BusAssignmentResponse>> update(
            @PathVariable Long id,
            @RequestBody UpdateBusAssignmentRequest request) {
        BusAssignmentResponse response = busAssignmentService.updateBusAssignment(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật ca xe thành công!"));
    }

    // ==================== ASSIGN TRIP ====================

    @PostMapping("/{id}/trips/{tripId}")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Gán trip vào ca xe", description = "Gán trip SCHEDULED vào ca xe cụ thể")
    public ResponseEntity<ApiResponse<BusAssignmentResponse>> assignTrip(
            @PathVariable Long id,
            @PathVariable Long tripId) {
        BusAssignmentResponse response = busAssignmentService.assignTripToAssignment(id, tripId);
        return ResponseEntity.ok(ApiResponse.success(response, "Gán chuyến vào ca xe thành công!"));
    }

    @DeleteMapping("/{id}/trips/{tripId}")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Gỡ trip khỏi ca xe", description = "Gỡ trip SCHEDULED ra khỏi ca xe")
    public ResponseEntity<ApiResponse<BusAssignmentResponse>> unassignTrip(
            @PathVariable Long id,
            @PathVariable Long tripId) {
        BusAssignmentResponse response = busAssignmentService.unassignTripFromAssignment(id, tripId);
        return ResponseEntity.ok(ApiResponse.success(response, "Gỡ chuyến khỏi ca xe thành công!"));
    }

    // ==================== CHECK-IN / CHECK-OUT ====================

    @PatchMapping("/{id}/check-in")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "CHECK-IN xe tại bãi", description = "Quản bãi xác nhận xe xuất bãi, ghi ODO + fuel")
    public ResponseEntity<ApiResponse<Void>> checkIn(
            @PathVariable Long id,
            @RequestParam BigDecimal odometer,
            @RequestParam Integer fuelLevel,
            @RequestParam(required = false) String notes,
            @RequestParam Long byUserId,
            @RequestParam(required = false) Long depotId) {
        busAssignmentService.checkInVehicle(id, odometer, fuelLevel, notes, byUserId, depotId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}/check-out")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "CHECK-OUT xe tại bãi", description = "Quản bãi xác nhận xe nhập bãi, ghi ODO + fuel")
    public ResponseEntity<ApiResponse<Void>> checkOut(
            @PathVariable Long id,
            @RequestParam BigDecimal odometer,
            @RequestParam Integer fuelLevel,
            @RequestParam(required = false) String notes,
            @RequestParam Long byUserId,
            @RequestParam(required = false) Long depotId) {
        busAssignmentService.checkOutVehicle(id, odometer, fuelLevel, notes, byUserId, depotId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}/end-early")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Kết thúc ca xe sớm", description = "Emergency: đổi xe giữa đường")
    public ResponseEntity<ApiResponse<Void>> endEarly(@PathVariable Long id) {
        busAssignmentService.endEarly(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
