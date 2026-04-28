package com.bus.system.modules.planning.domain;

import com.bus.system.common.persistence.BaseEntity;
import com.bus.system.modules.fleet.domain.BusType;
import com.bus.system.modules.planning.contract.ScheduleBusTypeStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Loại xe cho lịch chạy (Schedule ↔ BusType, many-to-many).
 *
 * 1 lịch chạy có thể khai thác nhiều loại xe.
 * Lưu lịch sử thay đổi: status = ENDED → đã kết thúc hiệu lực.
 *
 * Partial unique index: chỉ 1 bản ghi ACTIVE per (schedule, busType).
 */
@Entity
@Table(name = "schedule_bus_type")
@Getter
@Setter
public class ScheduleBusType extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_schedule_id", nullable = false)
    private TripSchedule tripSchedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_type_id", nullable = false)
    private BusType busType;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private ScheduleBusTypeStatus status = ScheduleBusTypeStatus.ACTIVE;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason; // Lý do cho trạng thái hiện tại

    // ==================== DOMAIN METHODS ====================

    public boolean isEffective() {
        return status == ScheduleBusTypeStatus.ACTIVE;
    }

    /**
     * Kết thúc hiệu lực loại xe cho lịch chạy.
     * Cập nhật status → ENDED, ghi lý do kết thúc vào reason.
     */
    public void end(String reason) {
        this.effectiveTo = LocalDate.now();
        this.status = ScheduleBusTypeStatus.ENDED;
        this.reason = reason;
    }

    // ==================== FACTORY ====================

    public static ScheduleBusType create(TripSchedule schedule, BusType busType, String reason) {
        ScheduleBusType sbt = new ScheduleBusType();
        sbt.setTripSchedule(schedule);
        sbt.setBusType(busType);
        sbt.setEffectiveFrom(LocalDate.now());
        sbt.setStatus(ScheduleBusTypeStatus.ACTIVE);
        sbt.setReason(reason);
        return sbt;
    }
}
