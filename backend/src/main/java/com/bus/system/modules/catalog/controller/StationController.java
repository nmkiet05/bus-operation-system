package com.bus.system.modules.catalog.controller;

import com.bus.system.common.constants.AppConstants;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.catalog.dto.request.StationRequest;
import com.bus.system.modules.catalog.dto.response.StationResponse;
import com.bus.system.modules.catalog.service.StationService;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Station Controller - Master Data
 * 
 * BusStation (Bến xe) là dữ liệu pháp lý do Sở GTVT/Bộ GTVT cấp phép.
 * 
 * Thiết kế CRUD:
 * - CREATE: ✅ Khi có bến xe mới được cấp phép
 * - READ: ✅ Public API cho dropdown
 * - UPDATE: ❌ Không có. Tạo bản ghi mới để giữ lịch sử.
 * - DELETE: ✅ Soft delete khi bến xe đóng cửa/sáp nhập
 */
@RestController
@RequestMapping("/api/catalog/stations")
@RequiredArgsConstructor
@Tag(name = "Catalog - Bến xe", description = "Danh mục Bến xe pháp lý (Master Data)")
public class StationController {

    private final StationService stationService;

    /**
     * Tạo bến xe mới khi có giấy phép từ Sở GTVT.
     * Bản ghi cũ vẫn được giữ nguyên để tham chiếu dữ liệu lịch sử.
     */
    @PostMapping
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Tạo Bến xe mới", description = "Dùng khi có bến xe mới được cấp phép")
    public ResponseEntity<ApiResponse<StationResponse>> createStation(
            @Valid @RequestBody StationRequest request) {
        StationResponse response = stationService.createStation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo bến xe thành công"));
    }

    /**
     * API Public: Lấy danh sách tất cả bến xe đang ACTIVE.
     * Dùng cho dropdown chọn địa điểm trên giao diện.
     */
    @GetMapping
    @Operation(summary = "Lấy danh sách Bến xe", description = "API Public - Dùng cho dropdown chọn địa điểm")
    public ResponseEntity<ApiResponse<List<StationResponse>>> getAllStations() {
        List<StationResponse> response = stationService.getAllStations();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Soft delete: Đánh dấu bến xe không còn hoạt động (đóng cửa/sáp nhập).
     * Dữ liệu lịch sử (chuyến xe thuộc bến cũ) vẫn được giữ nguyên.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Vô hiệu hóa Bến xe", description = "Soft delete khi bến xe đóng cửa hoặc sáp nhập")
    public ResponseEntity<ApiResponse<Void>> deactivateStation(@PathVariable Long id) {
        stationService.deactivateStation(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã vô hiệu hóa bến xe"));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Kích hoạt lại Bến xe", description = "Enable lại bến xe đã vô hiệu hóa")
    public ResponseEntity<ApiResponse<Void>> activateStation(@PathVariable Long id) {
        stationService.activateStation(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã kích hoạt lại bến xe"));
    }

    // ❌ KHÔNG có PUT /stations/{id}
    // Lý do: Khi đổi tên/thay đổi bến xe, tạo bản ghi mới thay vì update
    // Dữ liệu lịch sử (chuyến xe cũ) vẫn tham chiếu đúng bến cũ
}