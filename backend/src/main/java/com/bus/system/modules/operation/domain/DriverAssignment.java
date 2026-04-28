package com.bus.system.modules.operation.domain;

import com.bus.system.common.persistence.BaseEntity;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.operation.domain.enums.CrewRole;
import com.bus.system.modules.operation.domain.enums.DriverAssignmentStatus;
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

import java.time.LocalDateTime;

/**
 * Phân công tài xế (Driver Assignment).
 * Nối trực tiếp với Trip — mỗi record = 1 tài xế phục vụ 1 chuyến.
 *
 * <h3>Ví dụ bình thường:</h3>
 * Trip#1: [A, MAIN_DRIVER, ACTIVE, start=6:30, end=9:00]
 *
 * <h3>Ví dụ swap giữa chừng:</h3>
 * Trip#1: [A, MAIN_DRIVER, ENDED_EARLY, start=6:30, end=7:45] ← lái 1h15
 * Trip#1: [B, MAIN_DRIVER, ACTIVE, start=7:45, end=9:00] ← lái 1h15
 *
 * → Tính lương chính xác cho từng người dù swap giữa chuyến.
 */
@Entity
@Table(name = "driver_assignment")
@Getter
@Setter
public class DriverAssignment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private User driver;

    /**
     * Vai trò trên chuyến: MAIN_DRIVER, CO_DRIVER, ATTENDANT.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 30)
    private CrewRole role = CrewRole.MAIN_DRIVER;

    /**
     * ID ghế crew trên xe — dùng khi implement Seat Protection.
     */
    @Column(name = "seat_id")
    private Long seatId;

    /**
     * Thời điểm tài xế BẮT ĐẦU lái chuyến này.
     * - Bình thường: = Trip.startDateTime (lái từ đầu)
     * - Swap giữa chừng: = thời điểm nhận lái
     * Nullable: chưa bắt đầu.
     */
    @Column(name = "actual_start_time")
    private LocalDateTime actualStartTime;

    /**
     * Thời điểm tài xế KẾT THÚC lái chuyến này.
     * - Bình thường: = Trip.arrivalTime (lái đến cuối)
     * - Swap giữa chừng: = thời điểm bàn giao cho người khác
     * Nullable: chưa kết thúc / đang lái.
     */
    @Column(name = "actual_end_time")
    private LocalDateTime actualEndTime;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private DriverAssignmentStatus status = DriverAssignmentStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Tính số phút thực tế đã lái.
     * Nếu chưa có actual times → fallback lấy từ Trip.
     */
    public long getActualDrivingMinutes() {
        if (actualStartTime != null && actualEndTime != null) {
            return java.time.Duration.between(actualStartTime, actualEndTime).toMinutes();
        }
        // Fallback: lấy từ Trip (toàn chuyến)
        if (trip != null) {
            return trip.getDurationMinutes();
        }
        return 0L;
    }

    // =========================================================================
    // DOMAIN METHODS — State Transitions
    // =========================================================================

    /**
     * Kết thúc sớm (swap tài xế giữa đường). ACTIVE → ENDED_EARLY.
     */
    public void endEarly(Long replacedByDriverId) {
        if (this.status != DriverAssignmentStatus.ACTIVE) {
            throw new com.bus.system.common.exception.BusinessException("Chỉ có thể thay thế phân công đang ACTIVE.");
        }
        this.status = DriverAssignmentStatus.ENDED_EARLY;
        this.actualEndTime = LocalDateTime.now();
        this.notes = (this.notes != null ? this.notes + " | " : "")
                + "Bị thay thế bởi driver#" + replacedByDriverId;
    }

    /**
     * Hủy phân công. ACTIVE|PENDING → CANCELLED.
     */
    public void cancel() {
        if (this.status != DriverAssignmentStatus.ACTIVE
                && this.status != DriverAssignmentStatus.PENDING) {
            throw new com.bus.system.common.exception.BusinessException(
                    "Chỉ có thể hủy phân công đang ACTIVE hoặc PENDING.");
        }
        this.status = DriverAssignmentStatus.CANCELLED;
    }

    /**
     * Kích hoạt phân công khi chuyến bắt đầu. PENDING → ACTIVE.
     */
    public void activate() {
        if (this.status != DriverAssignmentStatus.PENDING) {
            throw new com.bus.system.common.exception.BusinessException("Chỉ có thể kích hoạt phân công PENDING.");
        }
        this.status = DriverAssignmentStatus.ACTIVE;
        if (this.actualStartTime == null) {
            this.actualStartTime = LocalDateTime.now();
        }
    }

    /**
     * Hoàn thành phân công khi chuyến kết thúc. ACTIVE → COMPLETED.
     */
    public void complete() {
        if (this.status != DriverAssignmentStatus.ACTIVE) {
            return; // Silently skip non-ACTIVE (ENDED_EARLY, CANCELLED...)
        }
        this.status = DriverAssignmentStatus.COMPLETED;
        if (this.actualEndTime == null) {
            this.actualEndTime = LocalDateTime.now();
        }
    }
}
