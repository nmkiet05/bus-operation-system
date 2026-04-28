package com.bus.system.modules.operation.controller;

import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.operation.dto.response.VehicleHandoverResponse;
import com.bus.system.modules.operation.service.VehicleHandoverService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Controller quản lý biên bản bàn giao xe.
 * 
 * Lưu ý: Không có endpoint POST/PUT vì biên bản được tạo tự động
 * thông qua luồng Approve Trip và TripChangeRequest.
 */
@RestController
@RequestMapping("/api/operation/handovers")
@Tag(name = "Operation: Vehicle Handover", description = "Quản lý Bàn giao xe (Chỉ đọc)")
@RequiredArgsConstructor
public class VehicleHandoverController {

    private final VehicleHandoverService handoverService;

    @GetMapping("/history")
    @Operation(summary = "Xem lịch sử bàn giao xe")
    public ResponseEntity<ApiResponse<List<VehicleHandoverResponse>>> getHandoverHistory(
            @RequestParam(required = false) Long driverId,
            @RequestParam(required = false) Long busId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate) {
        List<VehicleHandoverResponse> history = handoverService.getHandoverHistory(driverId, busId, fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/trips/{tripId}")
    @Operation(summary = "Xem toàn bộ handover của 1 chuyến", description = "Trả về tất cả biên bản bàn giao (mọi trạng thái) thuộc trip")
    public ResponseEntity<ApiResponse<List<VehicleHandoverResponse>>> getHandoversByTrip(
            @PathVariable Long tripId) {
        List<VehicleHandoverResponse> handovers = handoverService.getHandoversByTripId(tripId);
        return ResponseEntity.ok(ApiResponse.success(handovers));
    }
}
