package com.bus.system.modules.sales.repository;

import com.bus.system.modules.sales.domain.enums.BookingStatus;
import com.bus.system.modules.sales.domain.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

        /**
         * Tìm booking theo mã (PNR)
         */
        Optional<Booking> findByCode(String code);

        /**
         * Tìm booking theo mã (PNR) — Eager Fetch toàn bộ dữ liệu để hiển thị vé
         * JOIN FETCH tránh N+1: Booking → Tickets → Trip → TripSchedule → Route →
         * BusStations
         */
        @Query("""
                        SELECT DISTINCT b FROM Booking b
                        LEFT JOIN FETCH b.tickets t
                        LEFT JOIN FETCH t.trip trip
                        LEFT JOIN FETCH trip.bus bus
                        LEFT JOIN FETCH bus.busType
                        LEFT JOIN FETCH trip.tripSchedule ts
                        LEFT JOIN FETCH ts.route r
                        LEFT JOIN FETCH r.departureStation
                        LEFT JOIN FETCH r.arrivalStation
                        LEFT JOIN FETCH t.pickupPoint
                        LEFT JOIN FETCH t.dropoffPoint
                        WHERE b.code = :code
                        """)
        Optional<Booking> findByCodeWithFullDetails(@Param("code") String code);

        /**
         * Tìm tất cả booking của user
         */
        @Query("SELECT b FROM Booking b WHERE b.user.id = :userId ORDER BY b.createdAt DESC")
        List<Booking> findByUserId(@Param("userId") Long userId);

        /**
         * Tìm booking sắp hết hạn (để auto-cancel)
         */
        @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.expiredAt < :expiryTime")
        List<Booking> findExpiringBookings(@Param("status") BookingStatus status,
                        @Param("expiryTime") LocalDateTime expiryTime);

        /**
         * Eager fetch 1 booking by ID — dùng cho cancel/confirm/update
         * JOIN FETCH tránh N+1: Booking → Tickets → Trip → Bus → BusType → Route →
         * BusStations
         */
        @Query("""
                        SELECT DISTINCT b FROM Booking b
                        LEFT JOIN FETCH b.tickets t
                        LEFT JOIN FETCH t.trip trip
                        LEFT JOIN FETCH trip.bus bus
                        LEFT JOIN FETCH bus.busType
                        LEFT JOIN FETCH trip.tripSchedule ts
                        LEFT JOIN FETCH ts.route r
                        LEFT JOIN FETCH r.departureStation
                        LEFT JOIN FETCH r.arrivalStation
                        LEFT JOIN FETCH t.pickupPoint
                        LEFT JOIN FETCH t.dropoffPoint
                        WHERE b.id = :id
                        """)
        Optional<Booking> findByIdWithFullDetails(@Param("id") Long id);

        /**
         * Eager fetch ALL bookings — dùng cho admin list
         */
        @Query("""
                        SELECT DISTINCT b FROM Booking b
                        LEFT JOIN FETCH b.tickets t
                        LEFT JOIN FETCH t.trip trip
                        LEFT JOIN FETCH trip.bus bus
                        LEFT JOIN FETCH bus.busType
                        LEFT JOIN FETCH trip.tripSchedule ts
                        LEFT JOIN FETCH ts.route r
                        LEFT JOIN FETCH r.departureStation
                        LEFT JOIN FETCH r.arrivalStation
                        ORDER BY b.createdAt DESC
                        """)
        List<Booking> findAllWithFullDetails();

        /**
         * Eager fetch bookings by user — dùng cho user history
         */
        @Query("""
                        SELECT DISTINCT b FROM Booking b
                        LEFT JOIN FETCH b.tickets t
                        LEFT JOIN FETCH t.trip trip
                        LEFT JOIN FETCH trip.bus bus
                        LEFT JOIN FETCH bus.busType
                        LEFT JOIN FETCH trip.tripSchedule ts
                        LEFT JOIN FETCH ts.route r
                        LEFT JOIN FETCH r.departureStation
                        LEFT JOIN FETCH r.arrivalStation
                        WHERE b.user.id = :userId
                        ORDER BY b.createdAt DESC
                        """)
        List<Booking> findByUserIdWithFullDetails(@Param("userId") Long userId);

        /**
         * Eager fetch 1 booking theo code + user hiện tại
         */
        @Query("""
                        SELECT DISTINCT b FROM Booking b
                        LEFT JOIN FETCH b.tickets t
                        LEFT JOIN FETCH t.trip trip
                        LEFT JOIN FETCH trip.bus bus
                        LEFT JOIN FETCH bus.busType
                        LEFT JOIN FETCH trip.tripSchedule ts
                        LEFT JOIN FETCH ts.route r
                        LEFT JOIN FETCH r.departureStation
                        LEFT JOIN FETCH r.arrivalStation
                        LEFT JOIN FETCH t.pickupPoint
                        LEFT JOIN FETCH t.dropoffPoint
                        WHERE b.code = :code AND b.user.id = :userId
                        """)
        Optional<Booking> findByCodeAndUserIdWithFullDetails(@Param("code") String code, @Param("userId") Long userId);

        /**
         * Kiểm tra booking code đã tồn tại chưa
         */
        boolean existsByCode(String code);
}
