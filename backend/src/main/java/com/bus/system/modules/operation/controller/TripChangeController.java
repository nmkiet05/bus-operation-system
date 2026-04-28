package com.bus.system.modules.operation.controller;

import com.bus.system.common.constants.AppConstants;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.operation.domain.TripChange;
import com.bus.system.modules.operation.domain.service.DriverDutyService;
import com.bus.system.modules.operation.domain.service.LaborLawResult;
import com.bus.system.modules.operation.dto.request.CreateTripChange;
import com.bus.system.modules.operation.dto.response.DriverTripComplianceResponse;
import com.bus.system.modules.operation.dto.response.TripChangeResponse;
import com.bus.system.modules.operation.mapper.TripChangeMapper;
import com.bus.system.modules.operation.repository.TripChangeRepository;
import com.bus.system.modules.operation.service.TripChangeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller quản lý yêu cầu thay đổi tài xế/xe — 5 Vùng thời gian.
 *
 * Flow: createZonedRequest → (auto-zone) → admin approve/reject/review
 */
@RestController
@RequestMapping("/api/operation/trip-changes")
@RequiredArgsConstructor
@Tag(name = "Operation: Trip Change", description = "Quản lý yêu cầu đổi tài xế/xe (5 Vùng)")
public class TripChangeController {

    private final TripChangeService tripChangeService;
    private final DriverDutyService driverDutyService;
    private final TripChangeRepository tripChangeRepository;
    private final TripChangeMapper tripChangeMapper;

    // ==================== TẠO YÊU CẦU ====================

    @PostMapping
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Tạo yêu cầu (auto-zone)", description = "Tự động phân vùng: STANDARD chờ duyệt, URGENT chờ 10' rồi escalate, "
            +
            "CRITICAL/DEPARTED auto-execute chờ hậu kiểm")
    public ResponseEntity<ApiResponse<TripChangeResponse>> createRequest(
            @Valid @RequestBody CreateTripChange request,
            @AuthenticationPrincipal User currentUser) {
        TripChange entity = tripChangeService.createZonedRequest(request, currentUser.getId());
        String message = entity.getUrgencyZone().isAutoExecute()
                ? "Đã thực thi khẩn cấp (Vùng " + entity.getUrgencyZone() + "), chờ hậu kiểm!"
                : "Tạo yêu cầu thành công (Vùng " + entity.getUrgencyZone() + "), chờ Admin duyệt!";
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(tripChangeMapper.toResponse(entity), message));
    }

    @PostMapping("/incident")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Báo sự cố dọc đường (Vùng 5 MID_ROUTE)", description = "Auto-execute + ghi incident_type/gps, admin cấm reject")
    public ResponseEntity<ApiResponse<TripChangeResponse>> createIncident(
            @Valid @RequestBody CreateTripChange request,
            @RequestParam String incidentType,
            @RequestParam(required = false) String incidentGps,
            @AuthenticationPrincipal User currentUser) {
        TripChange entity = tripChangeService.createIncidentRequest(
                request, incidentType, incidentGps, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(tripChangeMapper.toResponse(entity),
                        "Đã xử lý sự cố dọc đường, chờ hậu kiểm!"));
    }

    // ==================== ADMIN ACTIONS ====================

    @PostMapping("/{id}/approve")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Duyệt yêu cầu", description = "Admin duyệt và thực thi thay đổi")
    public ResponseEntity<ApiResponse<Void>> approveRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        tripChangeService.approveRequest(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Duyệt yêu cầu thành công!"));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Từ chối yêu cầu")
    public ResponseEntity<ApiResponse<Void>> rejectRequest(
            @PathVariable Long id,
            @RequestParam String reason,
            @AuthenticationPrincipal User currentUser) {
        tripChangeService.rejectRequest(id, reason, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Đã từ chối yêu cầu!"));
    }

    @PostMapping("/{id}/review")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Hậu kiểm (Vùng 3-5)", description = "Admin duyệt/từ chối sau auto-execute. Vùng 4+5: CẤM reject")
    public ResponseEntity<ApiResponse<Void>> reviewEmergencyRequest(
            @PathVariable Long id,
            @RequestParam boolean approved,
            @RequestParam(required = false) String notes,
            @AuthenticationPrincipal User currentUser) {
        tripChangeService.reviewEmergencyRequest(id, approved, notes, currentUser.getId());
        String message = approved ? "Hậu kiểm PASSED" : "Hậu kiểm FAILED — vi phạm đã ghi nhận";
        return ResponseEntity.ok(ApiResponse.success(null, message));
    }

    @PostMapping("/{id}/rollback")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Rollback thay đổi", description = "Hoàn tác trong thời gian cho phép")
    public ResponseEntity<ApiResponse<Void>> rollbackRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        tripChangeService.rollbackRequest(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Đã hoàn tác thay đổi!"));
    }

    @PostMapping("/reset-anti-spam/{userId}")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Reset Anti-spam cho nhân viên")
    public ResponseEntity<ApiResponse<Void>> resetAntiSpam(
            @PathVariable Long userId,
            @AuthenticationPrincipal User currentUser) {
        tripChangeService.resetAntiSpamForUser(userId, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Đã reset Anti-spam!"));
    }

    // ==================== QUERY ====================

    @GetMapping
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Lấy danh sách yêu cầu")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<TripChangeResponse>>> getAllRequests() {
        List<TripChangeResponse> list = tripChangeRepository.findAllWithDetails().stream()
                .map(tripChangeMapper::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    // ==================== COMPLIANCE CHECK ====================

    @GetMapping("/compliance/driver/{driverId}")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Lấy chuyến tương lai của tài xế + trạng thái compliance", description = "Frontend hiển thị bảng: canUnassign=true → enable, false → disable + reason")
    public ResponseEntity<ApiResponse<DriverTripComplianceResponse>> getDriverCompliance(
            @PathVariable Long driverId,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate) {
        DriverTripComplianceResponse response = driverDutyService
                .getDriverFutureTripsCompliance(driverId, fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/compliance/check")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Kiểm tra compliance nếu gán driver vào trip", description = "Frontend gọi trước khi submit để kiểm tra luật lao động")
    public ResponseEntity<ApiResponse<LaborLawResult>> checkAssignmentCompliance(
            @RequestParam Long tripId,
            @RequestParam Long newDriverId) {
        LaborLawResult result = driverDutyService.checkAssignmentCompliance(tripId, newDriverId);
        return ResponseEntity.ok(ApiResponse.success(result,
                result.isCompliant() ? "Tuân thủ luật lao động"
                        : "Vi phạm: vượt " + result.getExcessMinutes() + " phút/tuần"));
    }
}
