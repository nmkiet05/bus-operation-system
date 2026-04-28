package com.bus.system.modules.catalog.controller;

import com.bus.system.common.constants.AppConstants;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.catalog.dto.request.ProvinceRequest;
import com.bus.system.modules.catalog.dto.response.ProvinceResponse;
import com.bus.system.modules.catalog.service.ProvinceService;
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
 * Province Controller
 * 
 * Thiết kế CRUD đặc biệt cho Master Data:
 * - CREATE: ✅ Khi nhà nước chia tách/sáp nhập/đổi tên tỉnh (ADMIN only)
 * - READ: ✅ Public API cho dropdown
 * - UPDATE: ❌ Không có. Tạo bản ghi mới thay vì sửa để giữ lịch sử.
 * - DELETE: ✅ Soft delete (deactivate) khi tỉnh bị sáp nhập/xóa bỏ
 */
@RestController
@RequestMapping("/api/catalog/provinces")
@RequiredArgsConstructor
@Tag(name = "Catalog - Tỉnh/Thành phố", description = "Danh mục Tỉnh thành Việt Nam")
public class ProvinceController {

    private final ProvinceService provinceService;

    /**
     * Tạo tỉnh mới khi nhà nước chia tách/sáp nhập/đổi tên.
     * Bản ghi cũ vẫn được giữ nguyên để tham chiếu dữ liệu lịch sử.
     */
    @PostMapping
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Tạo Tỉnh mới", description = "Dùng khi nhà nước chia tách/sáp nhập/đổi tên tỉnh")
    public ResponseEntity<ApiResponse<ProvinceResponse>> createProvince(
            @Valid @RequestBody ProvinceRequest request) {
        ProvinceResponse response = provinceService.createProvince(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo tỉnh thành công"));
    }

    /**
     * API Public: Lấy danh sách tất cả tỉnh thành đang ACTIVE.
     * Dùng cho dropdown chọn địa điểm trên giao diện.
     */
    @GetMapping
    @Operation(summary = "Lấy danh sách Tỉnh/Thành", description = "API Public - Dùng cho dropdown chọn địa điểm")
    public ResponseEntity<ApiResponse<List<ProvinceResponse>>> getAllProvinces() {
        List<ProvinceResponse> response = provinceService.getAllProvinces();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Soft delete: Đánh dấu tỉnh không còn tồn tại (do sáp nhập/xóa bỏ).
     * Dữ liệu lịch sử (chuyến xe, bến xe thuộc tỉnh cũ) vẫn được giữ nguyên.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Vô hiệu hóa Tỉnh", description = "Soft delete khi tỉnh bị sáp nhập hoặc xóa bỏ")
    public ResponseEntity<ApiResponse<Void>> deactivateProvince(@PathVariable Long id) {
        provinceService.deactivateProvince(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã vô hiệu hóa tỉnh"));
    }

    // ❌ KHÔNG có PUT /provinces/{id}
    // Lý do: Khi đổi tên tỉnh, tạo bản ghi mới thay vì update
    // Dữ liệu lịch sử (chuyến xe cũ) vẫn tham chiếu đúng tỉnh cũ
}