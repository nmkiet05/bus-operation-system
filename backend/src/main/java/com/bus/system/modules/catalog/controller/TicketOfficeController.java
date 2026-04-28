package com.bus.system.modules.catalog.controller;

import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.catalog.dto.request.TicketOfficeRequest;
import com.bus.system.modules.catalog.dto.response.TicketOfficeResponse;
import com.bus.system.modules.catalog.service.TicketOfficeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/ticket-offices")
@RequiredArgsConstructor
@Tag(name = "Ticket Office Management", description = "API quản lý văn phòng bán vé")
public class TicketOfficeController {

    private final TicketOfficeService ticketOfficeService;

    @PostMapping
    @Operation(summary = "Tạo văn phòng mới")
    public ResponseEntity<ApiResponse<TicketOfficeResponse>> createTicketOffice(
            @Valid @RequestBody TicketOfficeRequest request) {
        TicketOfficeResponse response = ticketOfficeService.createTicketOffice(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật văn phòng")
    public ResponseEntity<ApiResponse<TicketOfficeResponse>> updateTicketOffice(
            @PathVariable Long id,
            @Valid @RequestBody TicketOfficeRequest request) {
        TicketOfficeResponse response = ticketOfficeService.updateTicketOffice(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa văn phòng (Soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteTicketOffice(@PathVariable Long id) {
        ticketOfficeService.deleteTicketOffice(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết văn phòng")
    public ResponseEntity<ApiResponse<TicketOfficeResponse>> getTicketOfficeById(@PathVariable Long id) {
        TicketOfficeResponse response = ticketOfficeService.getTicketOfficeById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả văn phòng")
    public ResponseEntity<ApiResponse<List<TicketOfficeResponse>>> getAllTicketOffices() {
        List<TicketOfficeResponse> responses = ticketOfficeService.getAllTicketOffices();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}
