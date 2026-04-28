package com.bus.system.modules.operation.controller;

import com.bus.system.common.constants.AppConstants;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.operation.domain.DriverAssignment;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.domain.enums.CrewRole;
import com.bus.system.modules.operation.dto.response.CrewMemberResponse;
import com.bus.system.modules.operation.mapper.DriverAssignmentMapper;
import com.bus.system.modules.operation.repository.DriverAssignmentRepository;
import com.bus.system.modules.operation.repository.TripRepository;
import com.bus.system.modules.operation.service.DriverAssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller quản lý Phân công tài xế (Driver Assignment).
 * [Phase 3] Gán crew với role, swap tài xế, lấy crew.
 */
@RestController
@RequestMapping("/api/driver-assignments")
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Tag(name = "Driver Assignment", description = "API quản lý phân công tài xế")
public class DriverAssignmentController {

    private final DriverAssignmentService driverAssignmentService;
    private final DriverAssignmentMapper driverAssignmentMapper;
    private final TripRepository tripRepository;
    private final DriverAssignmentRepository driverAssignmentRepository;

    // ==================== CREW ASSIGNMENT ====================

    @PostMapping("/trip/{tripId}/crew")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Transactional
    @Operation(summary = "Gán nhân sự vào chuyến", description = "Gán tài xế/phụ xe vào chuyến với role cụ thể")
    public ResponseEntity<ApiResponse<CrewMemberResponse>> assignCrewMember(
            @PathVariable Long tripId,
            @RequestBody @Valid CrewAssignRequest request) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Chuyến xe", "id", tripId));
        DriverAssignment da = driverAssignmentService.assignDriver(trip, request.getDriverId(), request.getRole());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(driverAssignmentMapper.toCrewMemberResponse(da), "Gán nhân sự thành công!"));
    }

    @PostMapping("/trip/{tripId}/crew/batch")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Transactional
    @Operation(summary = "Gán nhiều nhân sự vào chuyến (batch)", description = "Gán danh sách nhân sự vào chuyến cùng lúc. Optimistic lock để ngăn race condition.")
    public ResponseEntity<ApiResponse<List<CrewMemberResponse>>> assignCrewBatch(
            @PathVariable Long tripId,
            @RequestBody @Valid BatchCrewAssignRequest request) {

        // Map DTO → Service record
        List<DriverAssignmentService.CrewAssignItem> items = request.getAssignments().stream()
                .map(r -> new DriverAssignmentService.CrewAssignItem(r.getDriverId(), r.getRole()))
                .toList();

        // Service xử lý: lock trip → validate → batch insert
        List<DriverAssignment> assignments = driverAssignmentService.assignBatchCrew(tripId, items);
        List<CrewMemberResponse> results = driverAssignmentMapper.toCrewMemberResponseList(assignments);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(results,
                        "Gán thành công " + results.size() + " nhân sự!"));
    }

    @GetMapping("/trip/{tripId}/crew")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Lấy crew chuyến", description = "Lấy tất cả crew (PENDING + ACTIVE + COMPLETED) trên chuyến")
    public ResponseEntity<ApiResponse<List<CrewMemberResponse>>> getTripCrew(@PathVariable Long tripId) {
        List<DriverAssignment> crew = driverAssignmentRepository.findByTripId(tripId);
        return ResponseEntity.ok(ApiResponse.success(driverAssignmentMapper.toCrewMemberResponseList(crew)));
    }

    // ==================== SWAP & CANCEL ====================

    @PatchMapping("/{id}/replace")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Transactional
    @Operation(summary = "Swap tài xế", description = "Thay thế tài xế giữa đường (Emergency)")
    public ResponseEntity<ApiResponse<Void>> replaceDriver(
            @PathVariable Long id,
            @RequestParam Long newDriverId) {
        driverAssignmentService.replaceDriver(id, newDriverId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Transactional
    @Operation(summary = "Hủy phân công", description = "Hủy phân công tài xế")
    public ResponseEntity<ApiResponse<Void>> cancelAssignment(@PathVariable Long id) {
        driverAssignmentService.cancelAssignment(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ==================== REQUEST DTOs ====================

    @Getter
    @Setter
    public static class CrewAssignRequest {
        @NotNull(message = "Vui lòng chọn nhân sự")
        private Long driverId;

        @NotNull(message = "Vui lòng chọn vai trò")
        private CrewRole role;
    }

    @Getter
    @Setter
    public static class BatchCrewAssignRequest {
        @NotNull(message = "Danh sách nhân sự không được để trống")
        @jakarta.validation.constraints.Size(min = 1, message = "Cần ít nhất 1 nhân sự")
        private List<@Valid CrewAssignRequest> assignments;
    }
}
