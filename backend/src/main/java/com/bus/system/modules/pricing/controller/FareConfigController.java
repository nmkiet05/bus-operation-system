package com.bus.system.modules.pricing.controller;

import com.bus.system.common.constants.AppConstants;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.pricing.dto.request.FareConfigRequest;
import com.bus.system.modules.pricing.dto.response.FareConfigResponse;
import com.bus.system.modules.pricing.service.FareConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/pricing/fares")
@RequiredArgsConstructor
@Tag(name = "Pricing - Cấu hình giá vé", description = "Định giá vé theo Tuyến & Loại xe")
public class FareConfigController {

    private final FareConfigService fareConfigService;

    @PostMapping("/upsert")
    @PreAuthorize(AppConstants.HAS_ROLE_ADMIN)
    @Operation(summary = "Thiết lập giá vé (SCD Type 2)", description = "Tự động chốt giá cũ và áp dụng giá mới")
    public ResponseEntity<ApiResponse<FareConfigResponse>> upsertFare(@Valid @RequestBody FareConfigRequest request) {
        FareConfigResponse response = fareConfigService.upsertFare(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Cấu hình giá thành công"));
    }

    @GetMapping("/active")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Tra cứu giá vé hiện tại")
    public ResponseEntity<ApiResponse<FareConfigResponse>> getActiveFare(
            @RequestParam Long routeId,
            @RequestParam Long busTypeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        if (date == null)
            date = LocalDate.now();
        FareConfigResponse response = fareConfigService.getActiveFare(routeId, busTypeId, date);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Lấy danh sách tất cả giá vé đang áp dụng")
    public ResponseEntity<ApiResponse<List<FareConfigResponse>>> getAllActiveFares() {
        List<FareConfigResponse> responses = fareConfigService.getAllActiveFares();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}