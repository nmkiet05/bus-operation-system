package com.bus.system.modules.operation.repository;

import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.domain.enums.TripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.querydsl.QuerydslPredicateExecutor;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long>,
                JpaSpecificationExecutor<Trip>,
                QuerydslPredicateExecutor<Trip> {

        // [GIỮ NGUYÊN HÀM CŨ] Check trùng chuyến MAIN
        @Query("SELECT COUNT(t) > 0 FROM Trip t " +
                        "WHERE t.tripSchedule.id = :tripScheduleId " +
                        "AND t.departureDate = :departureDate " +
                        "AND t.tripType = 'MAIN' " +
                        "AND t.deletedAt IS NULL")
        boolean existsMainTrip(@Param("tripScheduleId") Long tripScheduleId,
                        @Param("departureDate") LocalDate departureDate);

        // [MỚI] Tìm kiếm chuyến xe
        @Query("SELECT t FROM Trip t " +
                        "JOIN FETCH t.tripSchedule ts " +
                        "JOIN FETCH ts.route r " +
                        "WHERE (:routeId IS NULL OR r.id = :routeId) " +
                        "AND (:fromProvinceId IS NULL OR r.departureStation.province.id = :fromProvinceId) " +
                        "AND (:toProvinceId IS NULL OR r.arrivalStation.province.id = :toProvinceId) " +
                        "AND (t.departureDate >= :fromDate) " +
                        "AND (t.departureDate <= :toDate) " +
                        "AND t.deletedAt IS NULL " +
                        "ORDER BY t.departureDate ASC, t.actualDepartureTime ASC")
        List<Trip> searchTrips(@Param("routeId") Long routeId,
                        @Param("fromProvinceId") Long fromProvinceId,
                        @Param("toProvinceId") Long toProvinceId,
                        @Param("fromDate") LocalDate fromDate,
                        @Param("toDate") LocalDate toDate);

        // [Check Trùng Lịch] Xe
        @Query(value = """
                        SELECT COUNT(*) > 0 FROM trip t
                        JOIN trip_schedule ts ON t.trip_schedule_id = ts.id
                        JOIN route r ON ts.route_id = r.id
                        WHERE t.bus_id = :busId
                        AND t.id != :excludeTripId
                        AND t.deleted_at IS NULL
                        AND t.status IN ('SCHEDULED', 'RUNNING')
                        AND (
                            (t.departure_date + t.actual_departure_time) < :endTime
                            AND
                            COALESCE(t.arrival_time, (t.departure_date + t.actual_departure_time) + (r.duration_hours * INTERVAL '1 hour')) > :startTime
                        )
                        """, nativeQuery = true)
        boolean existsBusOverlap(@Param("busId") Long busId,
                        @Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime,
                        @Param("excludeTripId") Long excludeTripId);

        // [Phase 3] Check Trùng Lịch Tài Xế — JOIN qua driver_assignment.trip_id
        @Query(value = """
                        SELECT COUNT(*) > 0 FROM trip t
                        JOIN trip_schedule ts ON t.trip_schedule_id = ts.id
                        JOIN route r ON ts.route_id = r.id
                        JOIN driver_assignment da ON da.trip_id = t.id
                        WHERE da.driver_id = :driverId
                        AND da.status IN ('PENDING', 'ACTIVE')
                        AND t.id != :excludeTripId
                        AND t.deleted_at IS NULL
                        AND t.status IN ('SCHEDULED', 'RUNNING')
                        AND (
                            (t.departure_date + t.actual_departure_time) < :endTime
                            AND
                            COALESCE(t.arrival_time, (t.departure_date + t.actual_departure_time) + (r.duration_hours * INTERVAL '1 hour')) > :startTime
                        )
                        """, nativeQuery = true)
        boolean existsDriverOverlap(@Param("driverId") Long driverId,
                        @Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime,
                        @Param("excludeTripId") Long excludeTripId);

        // [Phase 3] Lấy chuyến của tài xế trong ngày — JOIN qua trip.crew
        @Query("SELECT t FROM Trip t " +
                        "JOIN t.crew da " +
                        "WHERE da.driver.id = :driverId " +
                        "AND da.status IN (com.bus.system.modules.operation.domain.enums.DriverAssignmentStatus.PENDING, com.bus.system.modules.operation.domain.enums.DriverAssignmentStatus.ACTIVE) "
                        +
                        "AND t.departureDate = :date " +
                        "AND t.status IN (com.bus.system.modules.operation.domain.enums.TripStatus.SCHEDULED, com.bus.system.modules.operation.domain.enums.TripStatus.RUNNING, com.bus.system.modules.operation.domain.enums.TripStatus.COMPLETED) "
                        +
                        "AND t.deletedAt IS NULL " +
                        "ORDER BY t.departureDate ASC, t.actualDepartureTime ASC")
        List<Trip> findTripsByDriverAndDate(@Param("driverId") Long driverId,
                        @Param("date") LocalDate date);

        // [Phase 3] Lấy chuyến tương lai của tài xế — JOIN qua trip.crew
        @Query("SELECT t FROM Trip t " +
                        "JOIN t.crew da " +
                        "WHERE da.driver.id = :driverId " +
                        "AND da.status IN (com.bus.system.modules.operation.domain.enums.DriverAssignmentStatus.PENDING, com.bus.system.modules.operation.domain.enums.DriverAssignmentStatus.ACTIVE) "
                        +
                        "AND t.status IN (com.bus.system.modules.operation.domain.enums.TripStatus.SCHEDULED, com.bus.system.modules.operation.domain.enums.TripStatus.APPROVED) "
                        +
                        "AND (t.departureDate > CURRENT_DATE OR (t.departureDate = CURRENT_DATE AND t.actualDepartureTime > :fromTime)) "
                        +
                        "AND t.deletedAt IS NULL " +
                        "ORDER BY t.departureDate ASC, t.actualDepartureTime ASC")
        List<Trip> findFutureTrips(@Param("driverId") Long driverId,
                        @Param("fromTime") LocalTime fromTime);

        // [Phase 3] Lấy chuyến gần nhất TRƯỚC thời điểm — JOIN qua
        // driver_assignment.trip_id
        @Query(value = """
                        SELECT t.* FROM trip t
                        JOIN driver_assignment da ON da.trip_id = t.id
                        WHERE da.driver_id = :driverId
                        AND da.status IN ('PENDING', 'ACTIVE')
                        AND t.deleted_at IS NULL
                        AND t.status IN ('SCHEDULED', 'APPROVED', 'RUNNING', 'COMPLETED')
                        AND (
                            (t.departure_date + t.actual_departure_time) <= :startTime
                        )
                        ORDER BY t.departure_date DESC, t.actual_departure_time DESC
                        LIMIT 1
                        """, nativeQuery = true)
        Optional<Trip> findLastTripBefore(@Param("driverId") Long driverId,
                        @Param("startTime") LocalDateTime startTime);

        // [Phase 3] Tính tổng phút lái xe trong tuần — JOIN qua
        // driver_assignment.trip_id
        @Query(value = """
                        SELECT COALESCE(SUM(r.duration_hours * 60), 0) FROM trip t
                        JOIN trip_schedule ts ON t.trip_schedule_id = ts.id
                        JOIN route r ON ts.route_id = r.id
                        JOIN driver_assignment da ON da.trip_id = t.id
                        WHERE da.driver_id = :driverId
                        AND da.status IN ('PENDING', 'ACTIVE')
                        AND t.departure_date BETWEEN :weekStart AND :weekEnd
                        AND t.status NOT IN ('CANCELLED')
                        AND t.deleted_at IS NULL
                        AND (:excludeTripId IS NULL OR t.id != :excludeTripId)
                        """, nativeQuery = true)
        long sumDrivingMinutesByDriverAndWeek(
                        @Param("driverId") Long driverId,
                        @Param("weekStart") LocalDate weekStart,
                        @Param("weekEnd") LocalDate weekEnd,
                        @Param("excludeTripId") Long excludeTripId);

        // [Phase 3] Tìm chuyến tương lai cần gỡ tài xế (Emergency Cascade) — JOIN qua
        // trip.crew
        @Query("SELECT t FROM Trip t " +
                        "JOIN t.crew da " +
                        "WHERE da.driver.id = :driverId " +
                        "AND da.status IN (com.bus.system.modules.operation.domain.enums.DriverAssignmentStatus.PENDING, com.bus.system.modules.operation.domain.enums.DriverAssignmentStatus.ACTIVE) "
                        +
                        "AND t.departureDate BETWEEN :weekStart AND :weekEnd " +
                        "AND t.status IN (com.bus.system.modules.operation.domain.enums.TripStatus.SCHEDULED, com.bus.system.modules.operation.domain.enums.TripStatus.APPROVED) "
                        +
                        "AND t.id != :excludeCurrentTripId " +
                        "AND t.deletedAt IS NULL " +
                        "ORDER BY t.departureDate DESC, t.actualDepartureTime DESC")
        List<Trip> findFutureTripsToUnassign(
                        @Param("driverId") Long driverId,
                        @Param("weekStart") LocalDate weekStart,
                        @Param("weekEnd") LocalDate weekEnd,
                        @Param("excludeCurrentTripId") Long excludeCurrentTripId);

        // [Phase 3] Lấy danh sách Driver ID đang bận — JOIN qua
        // driver_assignment.trip_id
        @Query(value = """
                        SELECT DISTINCT da.driver_id FROM driver_assignment da
                        JOIN trip t ON da.trip_id = t.id
                        JOIN trip_schedule ts ON t.trip_schedule_id = ts.id
                        JOIN route r ON ts.route_id = r.id
                        WHERE da.status IN ('PENDING', 'ACTIVE')
                        AND t.deleted_at IS NULL
                        AND t.status IN ('SCHEDULED', 'APPROVED', 'RUNNING')
                        AND (
                            (t.departure_date + t.actual_departure_time) < :endTime
                            AND
                            COALESCE(t.arrival_time, (t.departure_date + t.actual_departure_time) + (r.duration_hours * INTERVAL '1 hour')) > :startTime
                        )
                        """, nativeQuery = true)
        List<Long> findBusyDriverIds(@Param("startTime") LocalDateTime startTime,
                        @Param("endTime") LocalDateTime endTime);

        // [MỚI - AVAILABILITY] Lấy danh sách Bus ID đang bận trong khoảng thời gian
        @Query(value = """
                        SELECT DISTINCT t.bus_id FROM trip t
                        JOIN trip_schedule ts ON t.trip_schedule_id = ts.id
                        JOIN route r ON ts.route_id = r.id
                        WHERE t.bus_id IS NOT NULL
                        AND t.deleted_at IS NULL
                        AND t.status IN ('SCHEDULED', 'APPROVED', 'RUNNING')
                        AND (
                            (t.departure_date + t.actual_departure_time) < :endTime
                            AND
                            COALESCE(t.arrival_time, (t.departure_date + t.actual_departure_time) + (r.duration_hours * INTERVAL '1 hour')) > :startTime
                        )
                        """, nativeQuery = true)
        List<Long> findBusyBusIds(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

        /**
         * [MỚI - INFER LOCATION] Lấy chuyến gần nhất TRƯỚC thời điểm của xe.
         * Dùng cho inferCurrentBusStationId: suy vị trí bến xe gần nhất.
         */
        @Query(value = """
                        SELECT * FROM trip t
                        WHERE t.bus_id = :busId
                        AND t.deleted_at IS NULL
                        AND t.status IN ('SCHEDULED', 'APPROVED', 'RUNNING', 'COMPLETED')
                        AND (
                            (t.departure_date + t.actual_departure_time) <= :beforeTime
                        )
                        ORDER BY t.departure_date DESC, t.actual_departure_time DESC
                        LIMIT 1
                        """, nativeQuery = true)
        Optional<Trip> findLastTripByBusBefore(@Param("busId") Long busId,
                        @Param("beforeTime") LocalDateTime beforeTime);

        // [End Early] Lấy trips SCHEDULED thuộc một BusAssignment để giải phóng khi xe kết thúc sớm
        List<Trip> findByBusAssignmentIdAndStatus(Long busAssignmentId, TripStatus status);

        // [Validation] Lấy tất cả trips thuộc ca xe — dùng để kiểm tra overlap khi update thời gian ca
        List<Trip> findByBusAssignmentId(Long busAssignmentId);

        /**
         * Dashboard: Đếm số chuyến hôm nay (không tính CANCELLED).
         */
        long countByDepartureDateAndStatusNot(LocalDate departureDate, TripStatus status);

        /**
         * [Mới] Tìm các trip MAIN active theo scheduleId + ngày
         */
        @Query("SELECT t FROM Trip t " +
                        "WHERE t.tripSchedule.id = :tripScheduleId " +
                        "AND t.departureDate = :departureDate " +
                        "AND t.tripType = 'MAIN' " +
                        "AND t.deletedAt IS NULL")
        List<Trip> findActiveMainTrips(@Param("tripScheduleId") Long tripScheduleId,
                        @Param("departureDate") LocalDate departureDate);
}
