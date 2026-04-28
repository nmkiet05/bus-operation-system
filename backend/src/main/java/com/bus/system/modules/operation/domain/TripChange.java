package com.bus.system.modules.operation.domain;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.persistence.BaseEntity;
import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.operation.domain.enums.ChangeRequestStatus;
import com.bus.system.modules.operation.domain.enums.ChangeUrgencyZone;
import com.bus.system.modules.operation.domain.enums.TripChangeType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Yêu cầu thay đổi tài xế/xe — 5 Vùng thời gian.
 *
 * State: PENDING → APPROVED/REJECTED/ESCALATED/CANCELLED
 */
@Entity
@Table(name = "trip_change_request")
@Getter
@Setter
public class TripChange extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    // ==================== LOẠI THAY ĐỔI ====================
    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false)
    private TripChangeType changeType = TripChangeType.REPLACE_DRIVER;

    // ==================== TÀI XẾ ====================
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "old_driver_id")
    private User oldDriver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "new_driver_id")
    private User newDriver;

    // ==================== XE ====================
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "old_bus_id")
    private Bus oldBus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "new_bus_id")
    private Bus newBus;

    // ==================== LÝ DO & TRẠNG THÁI ====================
    @Column(name = "request_reason")
    private String requestReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ChangeRequestStatus status = ChangeRequestStatus.PENDING;

    @Column(name = "is_emergency")
    private Boolean isEmergency = false;

    // ==================== 5 VÙNG THỜI GIAN ====================

    @Enumerated(EnumType.STRING)
    @Column(name = "urgency_zone", length = 20)
    private ChangeUrgencyZone urgencyZone;

    /** Vùng 5: Loại sự cố (FATIGUE, ACCIDENT, BREAKDOWN, LICENSE_SEIZED) */
    @Column(name = "incident_type", length = 30)
    private String incidentType;

    /** Vùng 5: Tọa độ GPS nơi xảy ra sự cố */
    @Column(name = "incident_gps", length = 50)
    private String incidentGps;

    // ==================== AUDIT ====================
    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "rejected_reason")
    private String rejectedReason;

    // ==================== FACTORY METHODS ====================

    /**
     * Tạo request thay đổi thường (zone-based).
     */
    public static TripChange create(Trip trip, TripChangeType changeType, String reason,
            ChangeUrgencyZone zone, Long createdByUserId) {
        TripChange req = new TripChange();
        req.trip = trip;
        req.changeType = changeType;
        req.requestReason = reason;
        req.status = ChangeRequestStatus.PENDING;
        req.urgencyZone = zone;
        req.isEmergency = zone.isAutoExecute();
        req.createdBy = createdByUserId;
        return req;
    }

    /**
     * Tạo request sự cố dọc đường (Vùng 5 MID_ROUTE).
     */
    public static TripChange createIncident(Trip trip, TripChangeType changeType, String reason, String incidentType,
            String incidentGps, Long createdByUserId) {
        TripChange req = new TripChange();
        req.trip = trip;
        req.changeType = changeType != null ? changeType : TripChangeType.INCIDENT_SWAP;
        req.requestReason = reason;
        req.status = ChangeRequestStatus.PENDING;
        req.urgencyZone = ChangeUrgencyZone.MID_ROUTE;
        req.isEmergency = true;
        req.incidentType = incidentType;
        req.incidentGps = incidentGps;
        req.createdBy = createdByUserId;
        return req;
    }

    // ==================== STATE TRANSITIONS ====================

    /** Admin duyệt yêu cầu PENDING. */
    public void approve(Long approvedByUserId) {
        requireStatus(ChangeRequestStatus.PENDING);
        this.status = ChangeRequestStatus.APPROVED;
        this.approvedBy = approvedByUserId;
    }

    /** Admin từ chối yêu cầu PENDING. */
    public void reject(String reason, Long rejectedByUserId) {
        requireStatus(ChangeRequestStatus.PENDING);
        this.status = ChangeRequestStatus.REJECTED;
        this.rejectedReason = reason;
        this.approvedBy = rejectedByUserId;
    }

    /** Hậu kiểm Emergency (PENDING/ESCALATED). Vùng 4+5 cấm reject. */
    public void review(boolean approved, String notes, Long reviewedByUserId) {
        if (this.status != ChangeRequestStatus.PENDING
                && this.status != ChangeRequestStatus.ESCALATED) {
            throw new BusinessException("ALREADY_REVIEWED", "Yêu cầu đã được hậu kiểm.");
        }

        if (!approved && urgencyZone != null && !urgencyZone.isRejectAllowed()) {
            throw new BusinessException("CANNOT_REJECT_DEPARTED",
                    String.format("Không thể từ chối ở vùng %s — chỉ được duyệt.", urgencyZone));
        }

        this.status = approved ? ChangeRequestStatus.APPROVED : ChangeRequestStatus.REJECTED;
        this.approvedBy = reviewedByUserId;
        if (!approved) {
            this.rejectedReason = notes;
        }
    }

    /** Auto-escalate (URGENT quá timeout). */
    public void escalate() {
        requireStatus(ChangeRequestStatus.PENDING);
        this.status = ChangeRequestStatus.ESCALATED;
    }

    /** Rollback → CANCELLED. */
    public void cancel() {
        this.status = ChangeRequestStatus.CANCELLED;
    }

    // ==================== HELPERS ====================

    public void assignOldDriver(User driver) {
        this.oldDriver = driver;
    }

    public void assignNewDriver(User driver) {
        this.newDriver = driver;
    }

    public void assignOldBus(Bus bus) {
        this.oldBus = bus;
    }

    public void assignNewBus(Bus bus) {
        this.newBus = bus;
    }

    public boolean isCrewChange() {
        return changeType == TripChangeType.REPLACE_DRIVER
                || changeType == TripChangeType.REPLACE_CO_DRIVER
                || changeType == TripChangeType.REPLACE_ATTENDANT
                || changeType == TripChangeType.INCIDENT_SWAP;
    }

    private void requireStatus(ChangeRequestStatus expected) {
        if (this.status != expected) {
            throw new BusinessException("INVALID_STATE",
                    "Yêu cầu không ở trạng thái " + expected);
        }
    }
}
