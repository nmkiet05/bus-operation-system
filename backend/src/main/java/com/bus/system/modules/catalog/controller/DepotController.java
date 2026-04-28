package com.bus.system.modules.catalog.controller;

import com.bus.system.common.constants.AppConstants;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.catalog.dto.request.DepotRequest;
import com.bus.system.modules.catalog.dto.response.DepotResponse;
import com.bus.system.modules.catalog.service.DepotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Depot Controller — Operational Data (Full CRUD)
 *
 * Depot (Bãi đỗ xe) do công ty tự quản lý, khác với Station (pháp lý).
 * → Có đầy đủ CREATE, READ, UPDATE, DELETE.
 */
@RestController
@RequestMapping("/api/depots")
@RequiredArgsConstructor
@Tag(name = "Depot", description = "API quản lý Bãi đỗ xe")
public class DepotController {

    private final DepotService depotService;

    @GetMapping
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Danh sách Bãi đỗ xe", description = "Lấy tất cả bãi đỗ xe")
    public ResponseEntity<ApiResponse<List<DepotResponse>>> list() {
        List<DepotResponse> depots = depotService.getAllDepots();
        return ResponseEntity.ok(ApiResponse.success(depots));
    }

    @PostMapping
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Tạo Bãi xe mới", description = "Thêm bãi đỗ xe mới vào hệ thống")
    public ResponseEntity<ApiResponse<DepotResponse>> createDepot(
            @Valid @RequestBody DepotRequest request) {
        DepotResponse response = depotService.createDepot(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo bãi xe thành công"));
    }

    @PutMapping("/{id}")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Cập nhật Bãi xe", description = "Sửa thông tin bãi đỗ xe")
    public ResponseEntity<ApiResponse<DepotResponse>> updateDepot(
            @PathVariable Long id,
            @Valid @RequestBody DepotRequest request) {
        DepotResponse response = depotService.updateDepot(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật bãi xe thành công"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Xóa Bãi xe", description = "Xóa bãi đỗ xe khỏi hệ thống")
    public ResponseEntity<ApiResponse<Void>> deleteDepot(@PathVariable Long id) {
        depotService.deleteDepot(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã chuyển bãi xe vào thùng rác"));
    }

    @GetMapping("/trash")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Danh sách bãi xe đã xóa", description = "Lấy danh sách bãi xe trong thùng rác")
    public ResponseEntity<ApiResponse<List<DepotResponse>>> getTrash() {
        List<DepotResponse> deletedDepots = depotService.getDeletedDepots();
        return ResponseEntity.ok(ApiResponse.success(deletedDepots));
    }

    @PostMapping("/{id}/restore")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Khôi phục bãi xe", description = "Khôi phục bãi xe từ thùng rác")
    public ResponseEntity<ApiResponse<Void>> restoreDepot(@PathVariable Long id) {
        depotService.restoreDepot(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Khôi phục bãi xe thành công"));
    }
}
