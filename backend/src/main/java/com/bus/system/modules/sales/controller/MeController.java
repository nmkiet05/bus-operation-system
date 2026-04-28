package com.bus.system.modules.sales.controller;

import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.identity.domain.User;

import com.bus.system.modules.sales.dto.response.BookingResponse;
import com.bus.system.modules.sales.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller cho các API liên quan đến "Tôi" (User hiện tại) trong ngữ cảnh
 * Sales
 */
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Sales - Cá nhân", description = "Quản lý vé & lịch sử của tôi")
public class MeController {

    private final BookingService bookingService;

    /**
     * Lấy lịch sử đặt vé của tôi
     * GET /api/me/bookings
     */
    @GetMapping("/bookings")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lịch sử đặt vé", description = "Lấy danh sách vé đã đặt của user hiện tại")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getMyBookings(
            @AuthenticationPrincipal User currentUser) {
        log.info("Getting bookings for user: {}", currentUser.getUsername());
        List<BookingResponse> responses = bookingService.getBookingsByUser(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    /**
     * Lấy chi tiết 1 booking của tôi theo mã booking
     * GET /api/me/bookings/{code}
     */
    @GetMapping("/bookings/{code}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Chi tiết booking của tôi", description = "Lấy chi tiết booking theo mã, có kiểm tra quyền sở hữu")
    public ResponseEntity<ApiResponse<BookingResponse>> getMyBookingByCode(
            @PathVariable String code,
            @AuthenticationPrincipal User currentUser) {
        log.info("Getting booking {} for user {}", code, currentUser.getUsername());
        BookingResponse response = bookingService.getBookingByCodeForUser(code, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * User hiện tại hủy toàn bộ booking của chính mình
     * POST /api/me/bookings/{code}/cancel
     */
    @PostMapping("/bookings/{code}/cancel")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Hủy booking của tôi", description = "User hiện tại hủy toàn bộ booking của chính mình theo mã booking")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelMyBooking(
            @PathVariable String code,
            @AuthenticationPrincipal User currentUser) {
        log.info("Cancelling booking {} for user {}", code, currentUser.getUsername());
        BookingResponse response = bookingService.cancelBookingForUser(code, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Hủy vé thành công"));
    }

    /**
     * User hiện tại hủy 1 vé trong booking của chính mình
     * POST /api/me/bookings/{code}/tickets/{ticketId}/cancel
     */
    @PostMapping("/bookings/{code}/tickets/{ticketId}/cancel")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Hủy vé của tôi", description = "User hiện tại hủy 1 vé đơn lẻ trong booking của chính mình")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelMyTicket(
            @PathVariable String code,
            @PathVariable Long ticketId,
            @AuthenticationPrincipal User currentUser) {
        log.info("Cancelling ticket {} of booking {} for user {}", ticketId, code, currentUser.getUsername());
        BookingResponse response = bookingService.cancelTicketForUser(code, ticketId, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Hủy vé thành công"));
    }
}
