package com.bus.system.modules.operation.controller;

import com.bus.system.common.constants.AppConstants;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.operation.dto.request.TripAssignmentRequest;
import com.bus.system.modules.operation.dto.response.TripResponse;
import com.bus.system.modules.operation.service.TripDispatchService;
import com.bus.system.modules.operation.service.TripLifecycleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller điều độ chuyến xe — gán xe, duyệt, bắt đầu, kết thúc.
 */
@RestController
@RequestMapping("/api/operation/trips")
@RequiredArgsConstructor
@Tag(name = "Trip - Điều độ & Vòng đời", description = "Gán xe, duyệt, bắt đầu, kết thúc chuyến")
public class TripDispatchController {

    private final TripDispatchService tripDispatchService;
    private final TripLifecycleService tripLifecycleService;

    // ==================== DISPATCH (Điều độ) ====================

    @PatchMapping("/{id}/assignment")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Điều độ: Gán Xe", description = "Gán xe cho chuyến. Hệ thống sẽ kiểm tra trùng lịch.")
    public ResponseEntity<ApiResponse<TripResponse>> assignResources(
            @PathVariable Long id,
            @RequestBody @Valid TripAssignmentRequest request) {
        TripResponse response = tripDispatchService.assignResources(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Điều độ thành công!"));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Duyệt chuyến (Mở bán)", description = "Chốt phương tiện, chuyển trạng thái sang APPROVED để mở bán vé.")
    public ResponseEntity<ApiResponse<Void>> approveTrip(@PathVariable Long id) {
        tripDispatchService.approveTrip(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Duyệt chuyến thành công, đã mở bán vé!"));
    }

    // ==================== LIFECYCLE (Vòng đời) ====================

    @PostMapping("/{id}/start")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Bắt đầu chuyến đi", description = "Chuyển trạng thái sang RUNNING, cập nhật giờ khởi hành thực tế.")
    public ResponseEntity<ApiResponse<TripResponse>> startTrip(@PathVariable Long id) {
        TripResponse response = tripLifecycleService.startTrip(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Chuyến xe đã bắt đầu khởi hành!"));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Kết thúc chuyến đi", description = "Chuyển trạng thái sang COMPLETED, cập nhật giờ đến thực tế.")
    public ResponseEntity<ApiResponse<TripResponse>> completeTrip(@PathVariable Long id) {
        TripResponse response = tripLifecycleService.completeTrip(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Chuyến xe đã hoàn thành!"));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Hủy chuyến", description = "Hủy chuyến SCHEDULED hoặc APPROVED → CANCELLED.")
    public ResponseEntity<ApiResponse<Void>> cancelTrip(@PathVariable Long id) {
        tripLifecycleService.cancelTrip(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã hủy chuyến thành công!"));
    }
}
