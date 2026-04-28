package com.bus.system.modules.pricing.controller;

import com.bus.system.common.constants.AppConstants;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.pricing.dto.request.FarePolicyRequest;
import com.bus.system.modules.pricing.dto.response.FarePolicyResponse;
import com.bus.system.modules.pricing.service.FarePolicyService;
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
@RequestMapping("/api/pricing/policies")
@RequiredArgsConstructor
@Tag(name = "Pricing - Chính sách giá", description = "Quản lý quy tắc hoàn vé, phụ thu")
public class FarePolicyController {

    private final FarePolicyService farePolicyService;

    @PostMapping
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Tạo chính sách mới")
    public ResponseEntity<ApiResponse<FarePolicyResponse>> createFarePolicy(
            @Valid @RequestBody FarePolicyRequest request) {
        FarePolicyResponse response = farePolicyService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo chính sách thành công"));
    }

    @PutMapping("/{id}")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Cập nhật chính sách")
    public ResponseEntity<ApiResponse<FarePolicyResponse>> updateFarePolicy(@PathVariable Long id,
            @Valid @RequestBody FarePolicyRequest request) {
        FarePolicyResponse response = farePolicyService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật thành công"));
    }

    @GetMapping
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Lấy danh sách chính sách")
    public ResponseEntity<ApiResponse<List<FarePolicyResponse>>> getAllFarePolicies() {
        return ResponseEntity.ok(ApiResponse.success(farePolicyService.getAll()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Xóa chính sách")
    public ResponseEntity<ApiResponse<Void>> deleteFarePolicy(@PathVariable Long id) {
        farePolicyService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa thành công"));
    }
}