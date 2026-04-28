package com.bus.system.modules.planning.domain;

import com.bus.system.common.persistence.BaseSoftDeleteEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import com.bus.system.common.utils.CodeGeneratorUtils;
import lombok.Getter;
import lombok.Setter;

import com.bus.system.modules.planning.contract.ScheduleStatus;
import com.querydsl.core.annotations.QueryInit;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "trip_schedule")
@Getter
@Setter
public class TripSchedule extends BaseSoftDeleteEntity {

    @Column(name = "code", unique = true)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    @QueryInit({ "departureStation.province", "arrivalStation.province" })
    private Route route;

    @Column(name = "departure_time", nullable = false)
    private LocalTime departureTime;

    @Column(name = "slot_decision_number")
    private String slotDecisionNumber; // Số quyết định nốt tài

    // Bitmask: 127 = 1111111 (Chạy cả 7 ngày)
    @Column(name = "operation_days_bitmap")
    private Short operationDaysBitmap = 127;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ScheduleStatus status; // ACTIVE, INACTIVE, SUSPENDED

    public boolean isActive() {
        return ScheduleStatus.ACTIVE.equals(this.status) && !isDeleted();
    }

    // ===================== CONSTANTS =====================
    public static final int DAYS_IN_WEEK = 7;
    public static final int ISO_SUNDAY = 7;
    public static final int BIT_INDEX_SUNDAY = 0;

    /**
     * Kiểm tra xem lịch trình có chạy vào ngày cụ thể không.
     * Logic dựa trên Bitmask (operationDaysBitmap).
     * 
     * @param date Ngày cần kiểm tra
     * @return true nếu có chạy
     */
    public boolean runsOnDate(LocalDate date) {
        if (this.operationDaysBitmap == null) {
            return false;
        }
        int isoDayOfWeek = date.getDayOfWeek().getValue(); // 1 (Mon) -> 7 (Sun)

        // Quy ước: CN là bit 0, T2 là bit 1... T7 là bit 6
        int bitToCheck = (isoDayOfWeek == ISO_SUNDAY) ? BIT_INDEX_SUNDAY : isoDayOfWeek;

        return (this.operationDaysBitmap & (1 << bitToCheck)) > 0;
    }

    @PrePersist
    public void generateCode() {
        if (this.code == null && this.departureTime != null) {
            String routeCode = this.route != null ? this.route.getCode() : "XXXX";
            this.code = CodeGeneratorUtils.generateTripScheduleCode(routeCode,
                    this.departureTime);
        }
    }
}