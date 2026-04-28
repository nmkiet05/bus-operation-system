package com.bus.system.modules.planning.controller;

import com.bus.system.common.constants.AppConstants;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.planning.dto.request.PickupPointRequest;
import com.bus.system.modules.planning.dto.request.RouteRequest;
import com.bus.system.modules.planning.dto.response.PickupPointResponse;
import com.bus.system.modules.planning.dto.response.RouteResponse;
import com.bus.system.modules.planning.service.PickupPointService;
import com.bus.system.modules.planning.service.RouteService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/planning/routes")
@RequiredArgsConstructor
@Tag(name = "Planning - Tuyến đường", description = "Quản lý lộ trình và các điểm dừng của tuyến xe")
public class RouteController {

    private final RouteService routeService;
    private final PickupPointService pickupPointService;

    @PostMapping
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Tạo tuyến đường mới")
    public ResponseEntity<ApiResponse<RouteResponse>> createRoute(@Valid @RequestBody RouteRequest request) {
        RouteResponse response = routeService.createRoute(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo tuyến đường thành công"));
    }

    @GetMapping
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Lấy danh sách tất cả các tuyến đường")
    public ResponseEntity<ApiResponse<List<RouteResponse>>> getAllRoutes() {
        List<RouteResponse> responses = routeService.getAllRoutes();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Lấy chi tiết một tuyến đường")
    public ResponseEntity<ApiResponse<RouteResponse>> getRouteById(@PathVariable Long id) {
        RouteResponse response = routeService.getRouteById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Cập nhật tuyến đường")
    public ResponseEntity<ApiResponse<RouteResponse>> updateRoute(
            @PathVariable Long id,
            @Valid @RequestBody RouteRequest request) {
        RouteResponse response = routeService.updateRoute(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật tuyến đường thành công"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Xóa mềm tuyến đường")
    public ResponseEntity<ApiResponse<Void>> deleteRoute(@PathVariable Long id) {
        routeService.deleteRoute(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã chuyển tuyến đường vào thùng rác"));
    }

    @GetMapping("/trash")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Danh sách tuyến đường đã xóa", description = "Lấy danh sách tuyến đường trong thùng rác")
    public ResponseEntity<ApiResponse<List<RouteResponse>>> getTrash() {
        List<RouteResponse> deletedRoutes = routeService.getDeletedRoutes();
        return ResponseEntity.ok(ApiResponse.success(deletedRoutes));
    }

    @PostMapping("/{id}/restore")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Khôi phục tuyến đường", description = "Khôi phục tuyến đường từ thùng rác")
    public ResponseEntity<ApiResponse<Void>> restoreRoute(@PathVariable Long id) {
        routeService.restoreRoute(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Khôi phục tuyến đường thành công"));
    }

    // ==========================================
    // QUẢN LÝ ĐIỂM ĐÓN/TRẢ (NẰM TRONG ROUTE)
    // ==========================================

    @PostMapping("/{routeId}/pickup-points")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Thêm điểm đón cho tuyến")
    public ResponseEntity<ApiResponse<PickupPointResponse>> createPickupPoint(
            @PathVariable Long routeId,
            @Valid @RequestBody PickupPointRequest request) {

        PickupPointResponse response = pickupPointService.createPickupPoint(routeId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo điểm đón thành công"));
    }

    @GetMapping("/{routeId}/pickup-points")
    @Operation(summary = "Lấy danh sách điểm đón của tuyến")
    public ResponseEntity<ApiResponse<List<PickupPointResponse>>> getPickupPointsByRoute(
            @PathVariable Long routeId) {

        List<PickupPointResponse> response = pickupPointService.getPickupPointsByRoute(routeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{routeId}/pickup-points/{id}")
    @Operation(summary = "Xem chi tiết điểm đón")
    public ResponseEntity<ApiResponse<PickupPointResponse>> getPickupPointById(
            @PathVariable Long routeId,
            @PathVariable Long id) {

        PickupPointResponse response = pickupPointService.getPickupPointById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{routeId}/pickup-points/{id}")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Cập nhật điểm đón")
    public ResponseEntity<ApiResponse<PickupPointResponse>> updatePickupPoint(
            @PathVariable Long routeId,
            @PathVariable Long id,
            @Valid @RequestBody PickupPointRequest request) {

        PickupPointResponse response = pickupPointService.updatePickupPoint(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật thành công"));
    }

    @DeleteMapping("/{routeId}/pickup-points/{id}")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Xóa điểm đón")
    public ResponseEntity<ApiResponse<Void>> deletePickupPoint(
            @PathVariable Long routeId,
            @PathVariable Long id) {
        pickupPointService.deletePickupPoint(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa thành công"));
    }
}