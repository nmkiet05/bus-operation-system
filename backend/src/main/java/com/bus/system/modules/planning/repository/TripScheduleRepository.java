package com.bus.system.modules.planning.repository;

import com.bus.system.modules.planning.domain.TripSchedule;
import com.bus.system.modules.planning.contract.ScheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.querydsl.QuerydslPredicateExecutor;

@Repository
public interface TripScheduleRepository extends JpaRepository<TripSchedule, Long>,
                org.springframework.data.jpa.repository.JpaSpecificationExecutor<TripSchedule>,
                QuerydslPredicateExecutor<TripSchedule> {

        List<TripSchedule> findByRouteIdAndStatus(Long routeId, ScheduleStatus status);

        List<TripSchedule> findByRouteIdAndDeletedAtIsNullOrderByDepartureTimeAsc(Long routeId);

        List<TripSchedule> findByRouteIdAndDeletedAtIsNotNullOrderByUpdatedAtDesc(Long routeId);

        @Query(value = """
                            SELECT * FROM trip_schedule ts
                            WHERE ts.route_id = :routeId
                            AND ts.status = 'ACTIVE'
                            AND ts.deleted_at IS NULL
                            AND ts.effective_from <= :queryDate
                            AND (ts.effective_to IS NULL OR ts.effective_to >= :queryDate)
                            AND (ts.operation_days_bitmap & :dayBitMask) > 0
                        """, nativeQuery = true)
        List<TripSchedule> findAvailableSchedules(@Param("routeId") Long routeId,
                        @Param("queryDate") LocalDate queryDate,
                        @Param("dayBitMask") int dayBitMask);

        // [NEW] Validate trùng giờ (Khoảng cách 30 phút)
        // Logic:
        // 1. Cùng tuyến, Active, chưa xóa.
        // 2. ID khác ID hiện tại (để update không check chính nó).
        // 3. Có sự giao nhau về khoảng thời gian hiệu lực (Effective Date Overlap).
        // 4. Giờ chạy (DepartureTime) nằm trong khoảng [minTime, maxTime].
        // Lưu ý: Logic OR ở cuối để xử lý trường hợp qua đêm (VD: min=23:40, max=00:20)
        @Query("SELECT COUNT(ts) > 0 FROM TripSchedule ts " +
                        "WHERE ts.route.id = :routeId " +
                        "AND ts.status = 'ACTIVE' " +
                        "AND ts.deletedAt IS NULL " +
                        "AND ts.id <> :excludeId " +
                        "AND (" +
                        "   (ts.effectiveTo IS NULL OR ts.effectiveTo >= :effectiveFrom) " +
                        "   AND " +
                        "   (:effectiveTo IS NULL OR ts.effectiveFrom <= :effectiveTo) " +
                        ") " +
                        "AND (" +
                        "   (:minTime <= :maxTime AND ts.departureTime >= :minTime AND ts.departureTime <= :maxTime) " +
                        "   OR " +
                        "   (:minTime > :maxTime AND (ts.departureTime >= :minTime OR ts.departureTime <= :maxTime)) " +
                        ")")
        boolean existsOverlap(@Param("routeId") Long routeId,
                        @Param("effectiveFrom") LocalDate effectiveFrom,
                        @Param("effectiveTo") LocalDate effectiveTo,
                        @Param("minTime") LocalTime minTime,
                        @Param("maxTime") LocalTime maxTime,
                        @Param("excludeId") Long excludeId);
}