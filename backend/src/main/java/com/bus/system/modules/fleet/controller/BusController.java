package com.bus.system.modules.fleet.controller;

import com.bus.system.common.constants.AppConstants;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.fleet.dto.request.BusRequest;
import com.bus.system.modules.fleet.dto.response.BusResponse;
import com.bus.system.modules.fleet.service.BusService;
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
@RequestMapping("/api/fleet/buses")
@RequiredArgsConstructor
@Tag(name = "Fleet - Quản lý xe", description = "APIs quản lý phương tiện")
public class BusController {

    private final BusService busService;

    @GetMapping
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Lấy danh sách xe", description = "Trả về danh sách tất cả xe trong đội xe")
    public ResponseEntity<ApiResponse<List<BusResponse>>> getAllBuses() {
        List<BusResponse> buses = busService.getAllBuses();
        return ResponseEntity.ok(ApiResponse.success(buses));
    }

    @PostMapping
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Thêm xe mới", description = "Thêm phương tiện vào đội xe (Yêu cầu quyền ADMIN)")
    public ResponseEntity<ApiResponse<BusResponse>> createBus(@Valid @RequestBody BusRequest request) {
        BusResponse newBus = busService.createBus(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(newBus, "Thêm xe mới thành công!"));
    }

    @PutMapping("/{id}")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Cập nhật thông tin xe", description = "Cập nhật thông số kỹ thuật xe (Yêu cầu quyền ADMIN)")
    public ResponseEntity<ApiResponse<BusResponse>> updateBus(
            @PathVariable Long id,
            @Valid @RequestBody BusRequest request) {
        BusResponse updatedBus = busService.updateBus(id, request);
        return ResponseEntity.ok(ApiResponse.success(updatedBus, "Cập nhật thông tin xe thành công!"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Xóa xe", description = "Đánh dấu xe là ngưng hoạt động (RETIRED)")
    public ResponseEntity<ApiResponse<Void>> deleteBus(@PathVariable Long id) {
        busService.deleteBus(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa xe thành công!"));
    }
}