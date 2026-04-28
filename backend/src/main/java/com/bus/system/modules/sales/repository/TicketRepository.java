package com.bus.system.modules.sales.repository;

import com.bus.system.modules.sales.domain.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

        /**
         * Tìm tất cả vé của một booking
         */
        @Query("SELECT t FROM Ticket t WHERE t.booking.id = :bookingId")
        List<Ticket> findByBookingId(@Param("bookingId") Long bookingId);

        /**
         * Tìm tất cả vé của một chuyến
         */
        @Query("SELECT t FROM Ticket t WHERE t.trip.id = :tripId")
        List<Ticket> findByTripId(@Param("tripId") Long tripId);

        /**
         * Tối ưu hóa: Tìm vé của chuyến và FETCH luôn các điểm đón/trả + booking tránh lỗi N+1 Query
         */
        @Query("SELECT t FROM Ticket t " +
               "LEFT JOIN FETCH t.pickupPoint " +
               "LEFT JOIN FETCH t.dropoffPoint " +
               "LEFT JOIN FETCH t.booking " +
               "WHERE t.trip.id = :tripId")
        List<Ticket> findByTripIdWithPoints(@Param("tripId") Long tripId);

        /**
         * Kiểm tra ghế đã được book chưa
         */
        @Query("SELECT t FROM Ticket t WHERE t.trip.id = :tripId AND t.seatNumber = :seatNumber")
        Optional<Ticket> findByTripIdAndSeatNumber(@Param("tripId") Long tripId,
                        @Param("seatNumber") String seatNumber);

        /**
         * Kiểm tra ghế đã bán chưa (status khác CANCELLED)
         */
        @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END FROM Ticket t " +
                        "WHERE t.trip.id = :tripId AND t.seatNumber = :seatNumber " +
                        "AND t.status NOT IN ('CANCELLED', 'EXPIRED') " +
                        "AND t.booking.expiredAt > CURRENT_TIMESTAMP")
        boolean isSeatBooked(@Param("tripId") Long tripId, @Param("seatNumber") String seatNumber);

        /**
         * Đếm số lượng vé đã đặt của danh sách chuyến đi (theo batch)
         */
        @Query("SELECT t.trip.id, COUNT(t) FROM Ticket t " +
                        "WHERE t.trip.id IN :tripIds " +
                        "AND t.status NOT IN ('CANCELLED', 'EXPIRED') " +
                        "AND (t.booking.status = 'CONFIRMED' OR t.booking.expiredAt > CURRENT_TIMESTAMP) " +
                        "GROUP BY t.trip.id")
        List<Object[]> countBookedSeatsByTripIds(@Param("tripIds") List<Long> tripIds);

}
