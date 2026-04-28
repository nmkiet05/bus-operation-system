package com.bus.system.modules.sales.scheduler;

import com.bus.system.modules.sales.domain.Booking;
import com.bus.system.modules.sales.domain.enums.BookingStatus;
import com.bus.system.modules.sales.domain.enums.TicketStatus;
import com.bus.system.modules.sales.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled Job: Tự động expire các booking PENDING đã quá thời hạn giữ chỗ.
 *
 * Nguyên tắc thiết kế:
 * - Mọi @Scheduled method nằm trong package scheduler/, không lẫn với service.
 * - Job chạy mỗi phút, quét booking PENDING có expiredAt < now().
 * - Set status EXPIRED cho cả booking + tất cả tickets.
 * - Ghế sẽ được giải phóng (isSeatBooked filter EXPIRED status).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class BookingExpiryJob {

    private final BookingRepository bookingRepository;

    /**
     * Mỗi phút quét booking PENDING đã quá expiredAt → set EXPIRED.
     * Giải phóng ghế cho khách khác đặt.
     */
    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void expirePendingBookings() {
        List<Booking> expired = bookingRepository
                .findExpiringBookings(BookingStatus.PENDING, LocalDateTime.now());

        for (Booking booking : expired) {
            booking.setStatus(BookingStatus.EXPIRED);
            booking.getTickets().forEach(ticket -> ticket.setStatus(TicketStatus.EXPIRED));
            log.info("Auto-expired booking: {}", booking.getCode());
        }

        if (!expired.isEmpty()) {
            bookingRepository.saveAll(expired);
            log.info("Auto-expired {} bookings", expired.size());
        }
    }
}
