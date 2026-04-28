package com.bus.system.modules.planning.repository;

import com.bus.system.modules.planning.contract.ScheduleBusTypeStatus;
import com.bus.system.modules.planning.domain.ScheduleBusType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ScheduleBusTypeRepository extends JpaRepository<ScheduleBusType, Long> {

        // Loại xe đang hiệu lực cho lịch chạy
        List<ScheduleBusType> findByTripScheduleIdAndStatus(Long tripScheduleId, ScheduleBusTypeStatus status);

        // Lịch sử thay đổi loại xe
        List<ScheduleBusType> findByTripScheduleIdOrderByEffectiveFromDesc(Long tripScheduleId);

        // Kiểm tra bus_type có được phép cho schedule không (đang hiệu lực)
        boolean existsByTripScheduleIdAndBusTypeIdAndStatus(Long tripScheduleId, Long busTypeId,
                        ScheduleBusTypeStatus status);

        // Lấy danh sách bus_type IDs hiệu lực cho schedule
        @Query("SELECT sbt.busType.id FROM ScheduleBusType sbt " +
                        "WHERE sbt.tripSchedule.id = :scheduleId AND sbt.status = 'ACTIVE'")
        List<Long> findEffectiveBusTypeIdsByScheduleId(@Param("scheduleId") Long scheduleId);

        // [BATCH] Lấy tất cả ScheduleBusType ACTIVE cho nhiều schedule cùng lúc (tránh
        // N+1)
        @Query("SELECT sbt FROM ScheduleBusType sbt JOIN FETCH sbt.busType " +
                        "WHERE sbt.tripSchedule.id IN :scheduleIds AND sbt.status = 'ACTIVE'")
        List<ScheduleBusType> findByTripScheduleIdInAndStatusActive(
                        @Param("scheduleIds") java.util.Collection<Long> scheduleIds);

        // Lấy danh sách BusType entities hiệu lực cho schedule (kèm totalSeats cho
        // check bằng lái)
        @Query("SELECT sbt.busType FROM ScheduleBusType sbt " +
                        "WHERE sbt.tripSchedule.id = :scheduleId AND sbt.status = 'ACTIVE'")
        List<com.bus.system.modules.fleet.domain.BusType> findEffectiveBusTypesByScheduleId(
                        @Param("scheduleId") Long scheduleId);
}
