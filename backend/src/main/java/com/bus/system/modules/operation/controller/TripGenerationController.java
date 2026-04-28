package com.bus.system.modules.operation.controller;

import com.bus.system.common.constants.AppConstants;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.operation.dto.request.CreateTripRequest;
import com.bus.system.modules.operation.dto.request.TripGenerationRequest;
import com.bus.system.modules.operation.dto.response.TripGenerationResponse;
import com.bus.system.modules.operation.dto.response.TripResponse;
import com.bus.system.modules.operation.service.TripGenerationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller tạo chuyến xe — sinh tự động hoặc tạo thủ công.
 */
@RestController
@RequestMapping("/api/operation/trips")
@RequiredArgsConstructor
@Tag(name = "Trip - Tạo chuyến", description = "Sinh chuyến tự động hoặc tạo thủ công")
public class TripGenerationController {

    private final TripGenerationService tripGenerationService;

    @PostMapping("/generate")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Sinh chuyến tự động", description = "Sinh Trip từ Schedule cho khoảng thời gian")
    public ResponseEntity<ApiResponse<TripGenerationResponse>> generateTrips(
            @Valid @RequestBody TripGenerationRequest request) {
        TripGenerationResponse response = tripGenerationService.generateTrips(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @PostMapping
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
    @Operation(summary = "Tạo chuyến thủ công", description = "Tạo chuyến MAIN hoặc REINFORCEMENT")
    public ResponseEntity<ApiResponse<TripResponse>> createTrip(
            @Valid @RequestBody CreateTripRequest request) {
        TripResponse response = tripGenerationService.createTrip(request);
        String message = "REINFORCEMENT".equals(request.getTripType())
                ? "Tạo chuyến tăng cường thành công!"
                : "Tạo chuyến chính thành công!";
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, message));
    }
}
