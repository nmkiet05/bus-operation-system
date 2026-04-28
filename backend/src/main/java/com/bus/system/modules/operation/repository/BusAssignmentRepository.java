package com.bus.system.modules.operation.repository;

import com.bus.system.modules.operation.domain.BusAssignment;
import com.bus.system.modules.operation.domain.enums.BusAssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BusAssignmentRepository extends JpaRepository<BusAssignment, Long> {

    /**
     * Tìm ca xe đang hoạt động cho 1 xe trong khoảng thời gian.
     * Dùng khi approve trip: xem xe đã có ca chưa → gắn vào ca có sẵn.
     */
    Optional<BusAssignment> findByBusIdAndStatusInAndScheduledStartLessThanEqualAndScheduledEndGreaterThanEqual(
            Long busId, List<BusAssignmentStatus> statuses,
            LocalDateTime scheduledStart, LocalDateTime scheduledEnd);

    /**
     * Tìm ca xe COMPLETED hoặc ENDED_EARLY gần nhất có endDepot → suy vị trí Depot hiện tại.
     * Bỏ qua CANCELLED (xe không di chuyển).
     */
    @Query("""
            SELECT ba FROM BusAssignment ba
            LEFT JOIN FETCH ba.endDepot
            WHERE ba.bus.id = :busId
            AND ba.status IN (com.bus.system.modules.operation.domain.enums.BusAssignmentStatus.COMPLETED,
                              com.bus.system.modules.operation.domain.enums.BusAssignmentStatus.ENDED_EARLY)
            AND ba.endDepot IS NOT NULL
            ORDER BY ba.checkOutTime DESC
            LIMIT 1
            """)
    Optional<BusAssignment> findLastCompletedWithDepot(@Param("busId") Long busId);

    /**
     * Kiểm tra xe có đang trong ca nào không (chưa COMPLETED/CANCELLED).
     */
    boolean existsByBusIdAndStatusIn(Long busId, List<BusAssignmentStatus> statuses);

    /**
     * List ca xe theo ngày (overlap thời gian).
     */
    @Query("""
            SELECT ba FROM BusAssignment ba
            LEFT JOIN FETCH ba.bus b
            LEFT JOIN FETCH ba.startDepot
            LEFT JOIN FETCH ba.endDepot
            WHERE ba.scheduledStart < :endOfDay
            AND ba.scheduledEnd > :startOfDay
            ORDER BY ba.scheduledStart ASC
            """)
    List<BusAssignment> findByDateRange(
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay);

    /**
     * List ca xe theo ngày + xe cụ thể.
     */
    @Query("""
            SELECT ba FROM BusAssignment ba
            LEFT JOIN FETCH ba.bus b
            LEFT JOIN FETCH ba.startDepot
            LEFT JOIN FETCH ba.endDepot
            WHERE ba.bus.id = :busId
            AND ba.scheduledStart < :endOfDay
            AND ba.scheduledEnd > :startOfDay
            ORDER BY ba.scheduledStart ASC
            """)
    List<BusAssignment> findByBusIdAndDateRange(
            @Param("busId") Long busId,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay);

    /**
     * Batch: Lấy assignment COMPLETED cuối cùng cho MỖI xe → suy depot hiện tại.
     * Trả về list (busId, depotId, depotName) — mỗi bus 1 row.
     */
    @Query("""
            SELECT ba FROM BusAssignment ba
            LEFT JOIN FETCH ba.endDepot
            LEFT JOIN FETCH ba.bus
            WHERE ba.status IN (com.bus.system.modules.operation.domain.enums.BusAssignmentStatus.COMPLETED,
                                com.bus.system.modules.operation.domain.enums.BusAssignmentStatus.ENDED_EARLY)
            AND ba.endDepot IS NOT NULL
            AND ba.checkOutTime = (
                SELECT MAX(ba2.checkOutTime) FROM BusAssignment ba2
                WHERE ba2.bus.id = ba.bus.id
                AND ba2.status IN (com.bus.system.modules.operation.domain.enums.BusAssignmentStatus.COMPLETED,
                                   com.bus.system.modules.operation.domain.enums.BusAssignmentStatus.ENDED_EARLY)
                AND ba2.endDepot IS NOT NULL
            )
            """)
    List<BusAssignment> findLastCompletedPerBus();
}
