package com.bus.system.modules.operation.domain;

import com.bus.system.modules.operation.domain.enums.HandoverStatus;
import com.bus.system.common.persistence.BaseEntity;
import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.identity.domain.User;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle_handover")
@Getter
@Setter
public class VehicleHandover extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_id", nullable = false)
    private Bus bus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private User driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @Enumerated(EnumType.STRING)
    @Column(name = "handover_type", nullable = false)
    private com.bus.system.modules.operation.domain.enums.HandoverType handoverType;

    @Column(name = "odometer", precision = 10, scale = 2)
    private BigDecimal odometer;

    @Column(name = "fuel_level")
    private Integer fuelLevel; // 0-100%

    @Column(name = "notes")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private HandoverStatus status = HandoverStatus.PENDING_HANDOVER;

    @Column(name = "status_reason")
    private String statusReason;

    @Column(name = "is_emergency")
    private Boolean isEmergency = false;

    @Column(name = "emergency_request_by")
    private Long emergencyRequestBy;

    @Column(name = "emergency_reviewed_by")
    private Long emergencyReviewedBy;

    @Column(name = "emergency_reviewed_at")
    private LocalDateTime emergencyReviewedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "violation_level")
    private com.bus.system.modules.operation.domain.enums.ViolationLevel violationLevel;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "handover_time", nullable = false)
    private LocalDateTime handoverTime;

    @Column(name = "scheduled_return_time")
    private LocalDateTime scheduledReturnTime;

    @Column(name = "actual_return_time")
    private LocalDateTime actualReturnTime;
}
