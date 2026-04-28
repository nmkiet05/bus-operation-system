package com.bus.system.modules.fleet.domain;

import com.bus.system.modules.fleet.domain.enums.BusStatus;
import com.bus.system.common.persistence.BaseSoftDeleteEntity;
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
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bus")
@Getter
@Setter
public class Bus extends BaseSoftDeleteEntity {

    @Column(name = "license_plate", nullable = false, unique = true, length = 20)
    private String licensePlate; // Biển số

    // Liên kết với bảng bus_type — LAZY để tránh load không cần thiết, dùng JOIN
    // FETCH khi cần
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_type_id", nullable = false)
    private BusType busType;

    @Column(name = "transport_badge_number", length = 50)
    private String transportBadgeNumber; // Số phù hiệu

    @Column(name = "badge_expiry_date")
    private LocalDate badgeExpiryDate;

    @Column(name = "gps_device_id", length = 50)
    private String gpsDeviceId;

    @Column(name = "vin_number", length = 50, unique = true)
    private String vinNumber; // Số khung

    @Column(name = "engine_number", length = 50, unique = true)
    private String engineNumber; // Số máy

    @Column(name = "manufacturing_year")
    private Integer manufacturingYear;

    @Column(name = "current_odometer", precision = 10, scale = 2)
    private BigDecimal currentOdometer;

    @Column(name = "insurance_expiry_date", nullable = false)
    private LocalDate insuranceExpiryDate;

    @Column(name = "registration_expiry_date", nullable = false)
    private LocalDate registrationExpiryDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private BusStatus status; // ACTIVE, MAINTENANCE, RETIRED, BROKEN

    @Column(name = "last_assigned_at")
    private LocalDateTime lastAssignedAt; // Fair rotation — cập nhật khi dispatch

    @Column(name = "next_maintenance_due_at")
    private LocalDate nextMaintenanceDueAt; // Ưu tiên dispatch + hard block nếu quá hạn

    public void updateOdometer(BigDecimal newOdometer) {
        if (newOdometer == null) {
            return; // Ignore null updates (or throw exception depending on strictness, but here we
                    // match flow)
        }
        if (newOdometer.compareTo(BigDecimal.ZERO) <= 0) {
            return; // Ignore non-positive values
        }
        if (this.currentOdometer != null && newOdometer.compareTo(this.currentOdometer) <= 0) {
            throw new IllegalArgumentException("New odometer value must be greater than current value.");
        }
        this.currentOdometer = newOdometer;
    }

    public boolean isActive() {
        return BusStatus.ACTIVE.equals(this.status) && !isDeleted();
    }
}