package com.bus.system.modules.operation.domain;

import com.bus.system.common.persistence.BaseEntity;
import com.bus.system.modules.catalog.domain.Depot;
import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.operation.domain.enums.BusAssignmentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Ca xe (Bus Assignment).
 * Theo dõi vòng đời xe trong 1 ca: xuất bãi → chạy N chuyến → nhập bãi.
 * Xử lý: ODO, fuel, depot xuất/nhập.
 */
@Entity
@Table(name = "bus_assignment")
@Getter
@Setter
public class BusAssignment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_id", nullable = false)
    private Bus bus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "start_depot_id")
    private Depot startDepot; // Bãi xuất (NULL nếu nhận giữa đường)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "end_depot_id")
    private Depot endDepot; // Bãi nhập (NULL nếu rời giữa đường)

    @Column(name = "scheduled_start", nullable = false)
    private LocalDateTime scheduledStart;

    @Column(name = "scheduled_end")
    private LocalDateTime scheduledEnd;

    // --- CHECK-IN (Xuất bãi) ---

    @Column(name = "check_in_time")
    private LocalDateTime checkInTime;

    @Column(name = "check_in_odometer", precision = 10, scale = 2)
    private BigDecimal checkInOdometer;

    @Column(name = "check_in_fuel")
    private Integer checkInFuel; // 0-100%

    @Column(name = "check_in_notes", columnDefinition = "TEXT")
    private String checkInNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "check_in_by")
    private User checkInBy; // Quản bãi xác nhận xuất

    // --- CHECK-OUT (Nhập bãi) ---

    @Column(name = "check_out_time")
    private LocalDateTime checkOutTime;

    @Column(name = "check_out_odometer", precision = 10, scale = 2)
    private BigDecimal checkOutOdometer;

    @Column(name = "check_out_fuel")
    private Integer checkOutFuel; // 0-100%

    @Column(name = "check_out_notes", columnDefinition = "TEXT")
    private String checkOutNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "check_out_by")
    private User checkOutBy; // Quản bãi xác nhận nhập

    // --- STATUS ---

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private BusAssignmentStatus status;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // --- RELATIONSHIPS ---

    @OneToMany(mappedBy = "busAssignment")
    private List<Trip> trips = new ArrayList<>();

    // [Phase 3] drivers đã chuyển sang Trip.crew (DriverAssignment nối Trip trực
    // tiếp)

    // =========================================================================
    // DOMAIN METHODS — State Transitions
    // =========================================================================

    /**
     * CHECK-IN: Xe xuất bãi. PENDING → CHECKED_IN.
     */
    public void checkIn(BigDecimal odometer, Integer fuelLevel, String notes, User checkedBy) {
        if (this.status != BusAssignmentStatus.PENDING) {
            throw new com.bus.system.common.exception.BusinessException(
                    "Ca xe không ở trạng thái PENDING để check-in.");
        }
        this.checkInTime = LocalDateTime.now();
        this.checkInOdometer = odometer;
        this.checkInFuel = fuelLevel;
        this.checkInNotes = notes;
        this.checkInBy = checkedBy;
        this.status = BusAssignmentStatus.CHECKED_IN;
    }

    /**
     * CHECK-OUT: Xe nhập bãi.
     * CHECKED_IN|DEPARTED → COMPLETED.
     * ENDED_EARLY → giữ ENDED_EARLY (vẫn ghi ODO, fuel, depot).
     */
    public void checkOut(BigDecimal odometer, Integer fuelLevel, String notes, User checkedBy) {
        if (this.status != BusAssignmentStatus.CHECKED_IN
                && this.status != BusAssignmentStatus.DEPARTED
                && this.status != BusAssignmentStatus.ENDED_EARLY) {
            throw new com.bus.system.common.exception.BusinessException(
                    "Ca xe phải ở trạng thái CHECKED_IN, DEPARTED hoặc ENDED_EARLY để check-out.");
        }
        this.checkOutTime = LocalDateTime.now();
        this.checkOutOdometer = odometer;
        this.checkOutFuel = fuelLevel;
        this.checkOutNotes = notes;
        this.checkOutBy = checkedBy;
        // ENDED_EARLY giữ nguyên status, còn lại → COMPLETED
        if (this.status != BusAssignmentStatus.ENDED_EARLY) {
            this.status = BusAssignmentStatus.COMPLETED;
        }
    }

    /**
     * END EARLY: Kết thúc ca sớm.
     * - PENDING → CANCELLED (chưa xuất bãi → hủy lịch).
     * - CHECKED_IN / DEPARTED → ENDED_EARLY (vẫn cho checkout/nhập bãi sau).
     */
    public void endEarly() {
        if (this.status == BusAssignmentStatus.COMPLETED
                || this.status == BusAssignmentStatus.CANCELLED
                || this.status == BusAssignmentStatus.ENDED_EARLY) {
            throw new com.bus.system.common.exception.BusinessException("Ca xe đã kết thúc hoặc đã kết thúc sớm.");
        }

        if (this.status == BusAssignmentStatus.PENDING) {
            // Chưa xuất bãi → hủy hoàn toàn
            this.status = BusAssignmentStatus.CANCELLED;
            this.notes = (this.notes != null ? this.notes + " | " : "") + "Hủy ca xe (chưa xuất bãi)";
        } else {
            // Đã xuất bãi (CHECKED_IN/DEPARTED) → ENDED_EARLY, rút ngắn ca
            this.status = BusAssignmentStatus.ENDED_EARLY;
            this.scheduledEnd = LocalDateTime.now();
            this.notes = (this.notes != null ? this.notes + " | " : "") + "Kết thúc sớm (giải phóng chuyến chưa chạy)";
        }
    }

    /**
     * UNASSIGN TRIP: Gỡ trip khỏi ca xe.
     * Chỉ cho phép gỡ trip SCHEDULED (chưa APPROVED/RUNNING).
     */
    public void unassignTrip(Trip trip) {
        if (!this.trips.contains(trip)) {
            throw new com.bus.system.common.exception.BusinessException(
                    "Chuyến " + trip.getCode() + " không thuộc ca xe này.");
        }
        if (trip.getStatus() != com.bus.system.modules.operation.domain.enums.TripStatus.SCHEDULED) {
            throw new com.bus.system.common.exception.BusinessException(
                    "Chỉ có thể gỡ chuyến ở trạng thái ĐÃ LÊN LỊCH.");
        }
        trip.setBusAssignment(null);
        trip.unassignResources(); // Gỡ bus khỏi trip
    }
}
