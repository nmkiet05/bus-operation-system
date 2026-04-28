package com.bus.system.modules.operation.controller;

import com.bus.system.common.constants.AppConstants;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.operation.service.ResourceAvailabilityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Controller kiểm tra tài nguyên khả dụng (tài xế, xe).
 */
@RestController
@RequestMapping("/api/operation/trips")
@RequiredArgsConstructor
@Tag(name = "Trip - Tài nguyên khả dụng", description = "Kiểm tra tài xế, xe khả dụng cho điều độ")
public class ResourceAvailabilityController {

    private final ResourceAvailabilityService resourceAvailabilityService;

    @GetMapping("/resources/drivers/available")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Lấy DS tài xế khả dụng", description = "Lấy danh sách tài xế không trùng lịch trong khoảng thời gian")
    public ResponseEntity<ApiResponse<List<User>>> getAvailableDrivers(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        List<User> drivers = resourceAvailabilityService.getAvailableDrivers(startTime, endTime);
        return ResponseEntity.ok(ApiResponse.success(drivers));
    }

    @GetMapping("/resources/buses/available")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Lấy DS xe khả dụng", description = "Lấy danh sách xe không trùng lịch trong khoảng thời gian")
    public ResponseEntity<ApiResponse<List<Bus>>> getAvailableBuses(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        List<Bus> buses = resourceAvailabilityService.getAvailableBuses(startTime, endTime);
        return ResponseEntity.ok(ApiResponse.success(buses));
    }

    @GetMapping("/{tripId}/resources/drivers/available")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Lấy DS tài xế khả dụng cho chuyến", description = "Filter theo bằng lái, vị trí, thời gian trùng lịch")
    public ResponseEntity<ApiResponse<List<User>>> getAvailableDriversForTrip(
            @PathVariable Long tripId) {
        List<User> drivers = resourceAvailabilityService.getAvailableDriversForTrip(tripId);
        return ResponseEntity.ok(ApiResponse.success(drivers));
    }

    @GetMapping("/{tripId}/resources/buses/available")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Lấy DS xe khả dụng cho chuyến", description = "Filter theo vị trí, thời gian trùng lịch")
    public ResponseEntity<ApiResponse<List<Bus>>> getAvailableBusesForTrip(
            @PathVariable Long tripId) {
        List<Bus> buses = resourceAvailabilityService.getAvailableBusesForTrip(tripId);
        return ResponseEntity.ok(ApiResponse.success(buses));
    }
}
