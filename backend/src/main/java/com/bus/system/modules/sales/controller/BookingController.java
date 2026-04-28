package com.bus.system.modules.sales.controller;

import com.bus.system.common.response.ApiResponse;
import com.bus.system.common.exception.BadRequestException;
import com.bus.system.modules.sales.dto.request.CreateBookingRequest;
import com.bus.system.modules.sales.dto.response.BookingResponse;
import com.bus.system.modules.sales.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

/**
 * Controller cho Booking (Đặt vé)
 */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Sales - Booking", description = "Quản lý đặt vé")
public class BookingController {

    private final BookingService bookingService;

    /**
     * Tạo đơn đặt vé mới
     * POST /api/bookings
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("permitAll()") // Force Public Access
    @Operation(summary = "Đặt vé", description = "Tạo booking mới (guest hoặc user)")
    public ApiResponse<BookingResponse> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        log.info("Creating booking for guest: {}", request.getGuestName());
        BookingResponse response = bookingService.createBooking(request);
        return ApiResponse.success(response, "Đặt vé thành công");
    }

    /**
     * Tra cứu booking theo mã
     * GET /api/bookings/{code}
     */
    @GetMapping("/{code}")
    @Operation(summary = "Xem booking", description = "Lấy chi tiết booking theo mã PNR")
    public ApiResponse<BookingResponse> getBookingByCode(@PathVariable String code) {
        log.info("Getting booking by code: {}", code);
        BookingResponse response = bookingService.getBookingByCode(code);
        return ApiResponse.success(response);
    }

    /**
     * Hủy booking
     * POST /api/bookings/{id}/cancel
     */
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Hủy vé", description = "Hủy booking (PENDING hoặc CONFIRMED)")
    public ApiResponse<BookingResponse> cancelBooking(@PathVariable Long id) {
        log.info("Cancelling booking: {}", id);
        BookingResponse response = bookingService.cancelBooking(id);
        return ApiResponse.success(response, "Hủy vé thành công");
    }

    /**
     * Xác nhận thanh toán booking
     * POST /api/bookings/{code}/confirm
     */
    @PostMapping("/{code}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Xác nhận thanh toán", description = "Chuyển booking từ PENDING → CONFIRMED")
    public ApiResponse<BookingResponse> confirmBooking(
            @PathVariable String code,
            @RequestParam(defaultValue = "CASH") String paymentMethod) {
        log.info("Confirming booking: {} via {}", code, paymentMethod);
        BookingResponse response = bookingService.confirmBooking(code, paymentMethod);
        return ApiResponse.success(response, "Xác nhận thanh toán thành công");
    }

    /**
     * Tra cứu vé public (mã PNR + SĐT)
     * GET /api/bookings/search?code=XXX&phone=YYY
     */
    @GetMapping("/search")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Tra cứu vé", description = "Khách tra cứu vé bằng mã PNR + SĐT")
    public ApiResponse<BookingResponse> searchBooking(
            @RequestParam String code,
            @RequestParam String phone) {
        log.info("Searching booking: code={}, phone={}", code, phone);
        BookingResponse response = bookingService.searchBooking(code, phone);
        return ApiResponse.success(response);
    }

    /**
     * Admin: Danh sách tất cả bookings
     * GET /api/bookings
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Admin - DS Booking", description = "Lấy tất cả bookings (Admin/Staff)")
    public ApiResponse<List<BookingResponse>> getAllBookings() {
        log.info("Admin: getting all bookings");
        List<BookingResponse> responses = bookingService.getAllBookings();
        return ApiResponse.success(responses);
    }

    /**
     * Hủy 1 vé đơn lẻ
     * POST /api/bookings/tickets/{ticketId}/cancel
     */
    @PostMapping("/tickets/{ticketId}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Hủy vé", description = "Hủy 1 vé đơn lẻ (giữ booking active nếu còn vé khác)")
    public ApiResponse<BookingResponse> cancelTicket(@PathVariable Long ticketId) {
        log.info("Cancelling ticket: {}", ticketId);
        BookingResponse response = bookingService.cancelTicket(ticketId);
        return ApiResponse.success(response, "Hủy vé thành công");
    }

    /**
     * Hủy nhiều vé chọn lọc
     * POST /api/bookings/{bookingId}/cancel-tickets
     */
    @PostMapping("/{bookingId}/cancel-tickets")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Hủy nhiều vé", description = "Hủy nhiều vé chọn lọc trong 1 booking")
    public ApiResponse<BookingResponse> cancelTickets(
            @PathVariable Long bookingId,
            @RequestBody List<Long> ticketIds) {
        log.info("Cancelling {} tickets from booking: {}", ticketIds.size(), bookingId);
        BookingResponse response = bookingService.cancelTickets(bookingId, ticketIds);
        return ApiResponse.success(response, "Hủy vé thành công");
    }

    /**
     * Public: Hủy booking bằng mã + SĐT (khách vãng lai)
     * POST /api/bookings/public/{code}/cancel?phone=xxx
     */
    @PostMapping("/public/{code}/cancel")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Public - Hủy vé", description = "Khách hủy booking bằng mã PNR + SĐT")
    public ApiResponse<BookingResponse> cancelBookingPublic(
            @PathVariable String code,
            @RequestParam String phone) {
        BookingResponse booking = bookingService.searchBooking(code, phone);
        BookingResponse response = bookingService.cancelBooking(booking.getId());
        return ApiResponse.success(response, "Hủy vé thành công");
    }

    /**
     * Public: Hủy 1 vé trong booking bằng mã + SĐT (khách vãng lai)
     * POST /api/bookings/public/{code}/tickets/{ticketId}/cancel?phone=xxx
     */
    @PostMapping("/public/{code}/tickets/{ticketId}/cancel")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Public - Hủy vé lẻ", description = "Khách hủy 1 vé bằng mã PNR + SĐT")
    public ApiResponse<BookingResponse> cancelTicketPublic(
            @PathVariable String code,
            @PathVariable Long ticketId,
            @RequestParam String phone) {
        BookingResponse booking = bookingService.searchBooking(code, phone);
        boolean ticketBelongsToBooking = booking.getTickets().stream().anyMatch(t -> t.getId().equals(ticketId));
        if (!ticketBelongsToBooking) {
            throw new BadRequestException("Vé không thuộc booking đang tra cứu");
        }

        BookingResponse response = bookingService.cancelTicket(ticketId);
        return ApiResponse.success(response, "Hủy vé thành công");
    }
}
