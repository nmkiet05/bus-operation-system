package com.bus.system.modules.fleet.controller;

import com.bus.system.common.constants.AppConstants;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.fleet.dto.request.BusTypeRequest;
import com.bus.system.modules.fleet.dto.response.BusTypeResponse;
import com.bus.system.modules.fleet.service.BusTypeService;
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
@RequestMapping("/api/fleet/bus-types")
@RequiredArgsConstructor
@Tag(name = "Fleet - Loại xe", description = "Quản lý loại xe và sơ đồ ghế")
public class BusTypeController {

    private final BusTypeService busTypeService;

    @PostMapping
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Tạo loại xe mới", description = "Định nghĩa loại xe với sơ đồ ghế (VD: Giường nằm 40 chỗ)")
    public ResponseEntity<ApiResponse<BusTypeResponse>> createBusType(@Valid @RequestBody BusTypeRequest request) {
        BusTypeResponse response = busTypeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo loại xe thành công"));
    }

    @GetMapping
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Lấy danh sách loại xe")
    public ResponseEntity<ApiResponse<List<BusTypeResponse>>> getAllBusTypes() {
        List<BusTypeResponse> response = busTypeService.getAll();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Lấy chi tiết loại xe")
    public ResponseEntity<ApiResponse<BusTypeResponse>> getBusTypeById(@PathVariable Long id) {
        BusTypeResponse response = busTypeService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Cập nhật loại xe")
    public ResponseEntity<ApiResponse<BusTypeResponse>> updateBusType(
            @PathVariable Long id,
            @Valid @RequestBody BusTypeRequest request) {
        BusTypeResponse response = busTypeService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật loại xe thành công"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Xóa loại xe", description = "Soft delete - chuyển vào thùng rác")
    public ResponseEntity<ApiResponse<Void>> deleteBusType(@PathVariable Long id) {
        busTypeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã chuyển loại xe vào thùng rác"));
    }

    @GetMapping("/trash")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Danh sách loại xe đã xóa", description = "Lấy danh sách loại xe trong thùng rác")
    public ResponseEntity<ApiResponse<List<BusTypeResponse>>> getTrash() {
        List<BusTypeResponse> deleted = busTypeService.getDeletedBusTypes();
        return ResponseEntity.ok(ApiResponse.success(deleted));
    }

    @PostMapping("/{id}/restore")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Khôi phục loại xe", description = "Khôi phục loại xe từ thùng rác")
    public ResponseEntity<ApiResponse<Void>> restoreBusType(@PathVariable Long id) {
        busTypeService.restore(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Khôi phục loại xe thành công"));
    }
}
