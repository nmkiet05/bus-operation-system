package com.bus.system.modules.sales.service;

import com.bus.system.modules.sales.dto.request.CreateBookingRequest;
import com.bus.system.modules.sales.dto.response.BookingResponse;
import com.bus.system.modules.sales.dto.response.SeatMapResponse;

/**
 * Service interface cho Booking
 */
public interface BookingService {

    /**
     * Tạo đơn đặt vé mới
     * 
     * @param request thông tin booking
     * @return BookingResponse
     */
    BookingResponse createBooking(CreateBookingRequest request);

    /**
     * Lấy thông tin booking theo mã
     * 
     * @param code mã booking (PNR)
     * @return BookingResponse
     */
    BookingResponse getBookingByCode(String code);

    /**
     * Hủy booking
     * 
     * @param bookingId ID booking
     * @return BookingResponse (sau khi hủy)
     */
    BookingResponse cancelBooking(Long bookingId);

    /**
     * Lấy danh sách booking của user
     * 
     * @param userId ID user
     * @return List<BookingResponse>
     */
    java.util.List<BookingResponse> getBookingsByUser(Long userId);

    /**
     * Lấy chi tiết booking theo mã nhưng phải thuộc về user hiện tại
     */
    BookingResponse getBookingByCodeForUser(String code, Long userId);

    /**
     * Xác nhận thanh toán booking
     * 
     * @param bookingCode   Mã booking
     * @param paymentMethod Phương thức thanh toán
     * @return BookingResponse
     */
    BookingResponse confirmBooking(String bookingCode, String paymentMethod);

    /**
     * Lấy sơ đồ ghế cho chuyến (seat map)
     * 
     * @param tripId ID chuyến
     * @return SeatMapResponse
     */
    SeatMapResponse getSeatMap(Long tripId);

    /**
     * Admin: Lấy tất cả bookings (phân trang sau)
     */
    java.util.List<BookingResponse> getAllBookings();

    /**
     * Tra cứu booking theo mã + SĐT (public)
     */
    BookingResponse searchBooking(String code, String phone);

    /**
     * Hủy 1 vé đơn lẻ (giữ booking active nếu còn vé khác)
     *
     * @param ticketId ID vé cần hủy
     * @return BookingResponse (sau khi hủy vé)
     */
    BookingResponse cancelTicket(Long ticketId);

    /**
     * User hiện tại hủy booking của chính mình theo mã booking
     */
    BookingResponse cancelBookingForUser(String code, Long userId);

    /**
     * User hiện tại hủy 1 vé trong booking của chính mình
     */
    BookingResponse cancelTicketForUser(String code, Long ticketId, Long userId);

    /**
     * Hủy nhiều vé chọn lọc trong 1 booking
     *
     * @param bookingId ID booking
     * @param ticketIds Danh sách ID vé cần hủy
     * @return BookingResponse (sau khi hủy)
     */
    BookingResponse cancelTickets(Long bookingId, java.util.List<Long> ticketIds);
}
