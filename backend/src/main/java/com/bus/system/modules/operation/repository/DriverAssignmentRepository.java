package com.bus.system.modules.operation.repository;

import com.bus.system.modules.operation.domain.DriverAssignment;
import com.bus.system.modules.operation.domain.enums.CrewRole;
import com.bus.system.modules.operation.domain.enums.DriverAssignmentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * [Phase 3] Repository cho DriverAssignment nối Trip trực tiếp.
 */
@Repository
public interface DriverAssignmentRepository extends JpaRepository<DriverAssignment, Long> {

    /**
     * Lấy crew theo trip + status.
     * Load sẵn driver để mapper lấy employeeCode (trên User entity) không bị N+1.
     */
    @EntityGraph(attributePaths = {"driver"})
    List<DriverAssignment> findByTripIdAndStatus(Long tripId, DriverAssignmentStatus status);

    /**
     * Lấy tất cả crew của trip (bao gồm ENDED_EARLY để audit).
     * Load sẵn driver để mapper lấy employeeCode (trên User entity) không bị N+1.
     */
    @EntityGraph(attributePaths = {"driver"})
    List<DriverAssignment> findByTripId(Long tripId);

    /**
     * Kiểm tra tài xế có đang ACTIVE trên bất kỳ trip nào không.
     * NOTE: Hiện chưa được gọi trong luồng nghiệp vụ chính.
     * Reserved — có thể dùng cho resource-availability check trong tương lai.
     */
    boolean existsByDriverIdAndStatus(Long driverId, DriverAssignmentStatus status);

    /**
     * Tìm assignment hiện tại theo trip + role + danh sách status.
     * Dùng khi reassign: kiểm tra đã có MAIN_DRIVER PENDING/ACTIVE chưa.
     */
    Optional<DriverAssignment> findFirstByTripIdAndRoleAndStatusIn(
            Long tripId, CrewRole role, List<DriverAssignmentStatus> statuses);

    /**
     * Kiểm tra tài xế đã được gán vào trip chưa (PENDING hoặc ACTIVE).
     * Dùng để ngăn duplicate khi gán batch.
     */
    boolean existsByTripIdAndDriverIdAndStatusIn(
            Long tripId, Long driverId, List<DriverAssignmentStatus> statuses);

    /**
     * Lấy danh sách trip IDs mà tài xế được gán trong một khoảng thời gian.
     * Dùng để kiểm tra lịch sử làm việc của tài xế.
     */
    @Query(value = """
            SELECT DISTINCT da.trip_id
            FROM driver_assignment da
            JOIN trip t ON da.trip_id = t.id
            WHERE da.driver_id = :driverId
              AND t.departure_date BETWEEN :fromDate AND :toDate
              AND da.status IN ('PENDING', 'ACTIVE', 'ENDED_EARLY', 'COMPLETED')
            """, nativeQuery = true)
    List<Number> findTripIdsByDriverIdAndDateRange(
            @Param("driverId") Long driverId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    /**
     * Kiểm tra trip đã có crew với role cụ thể chưa (PENDING/ACTIVE).
     * Dùng để enforce max 1 MAIN_DRIVER per trip.
     */
    boolean existsByTripIdAndRoleAndStatusIn(
            Long tripId, CrewRole role, List<DriverAssignmentStatus> statuses);

    /**
     * Cập nhật actualStartTime theo ID — tránh double-flush khi dùng save().
     * Dùng trong replaceDriver() sau khi entity đã được persist bởi assignDriver().
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE DriverAssignment da SET da.actualStartTime = :startTime WHERE da.id = :id")
    void updateActualStartTime(@Param("id") Long id, @Param("startTime") LocalDateTime startTime);

}
