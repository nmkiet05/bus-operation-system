package com.bus.system.modules.sales.mapper;

import com.bus.system.modules.sales.config.BookingProperties;
import com.bus.system.modules.sales.domain.enums.BookingStatus;
import com.bus.system.modules.sales.domain.Booking;
import com.bus.system.modules.sales.dto.request.CreateBookingRequest;
import com.bus.system.modules.sales.dto.response.BookingResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

/**
 * Mapper cho Booking Entity <-> DTO
 */
@Component
@RequiredArgsConstructor
public class BookingMapper {

    private final TicketMapper ticketMapper;
    private final BookingProperties bookingProperties;

    /**
     * Convert CreateBookingRequest → Booking entity (chưa có tickets)
     * Service sẽ add tickets và set user sau
     */
    public Booking toEntity(CreateBookingRequest request, String bookingCode) {
        Booking booking = new Booking();

        // Basic info
        booking.setCode(bookingCode);
        booking.setGuestName(request.getGuestName());
        booking.setGuestPhone(request.getGuestPhone());
        booking.setGuestEmail(request.getGuestEmail());

        // Business logic
        booking.setChannel("WEB");
        booking.setPaymentMethod(request.getPaymentMethod());
        booking.setStatus(BookingStatus.PENDING);
        booking.setExpiredAt(LocalDateTime.now().plusMinutes(bookingProperties.getExpiryMinutes()));

        // Calculate total from tickets
        BigDecimal totalAmount = request.getTickets().stream()
                .map(CreateBookingRequest.TicketRequest::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        booking.setTotalAmount(totalAmount);

        return booking;
    }

    /**
     * Convert Booking entity → BookingResponse DTO
     */
    public BookingResponse toResponse(Booking booking) {
        if (booking == null) {
            return null;
        }

        return BookingResponse.builder()
                .id(booking.getId())
                .code(booking.getCode())
                .userId(booking.getUser() != null ? booking.getUser().getId() : null)
                .guestName(booking.getGuestName())
                .guestPhone(booking.getGuestPhone())
                .guestEmail(booking.getGuestEmail())
                .totalAmount(booking.getTotalAmount())
                .channel(booking.getChannel())
                .paymentMethod(booking.getPaymentMethod())
                .status(booking.getStatus())
                .tickets(booking.getTickets().stream()
                        .map(ticketMapper::toResponse)
                        .collect(Collectors.toList()))
                .confirmedByName(booking.getConfirmedBy() != null
                        ? booking.getConfirmedBy().getFullName()
                        : null)
                .expiredAt(booking.getExpiredAt())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }
}
