package com.bus.system.modules.pricing.domain;

import com.bus.system.modules.pricing.contract.FareConfigStatus;
import com.bus.system.common.persistence.BaseSoftDeleteEntity;
import com.bus.system.modules.fleet.domain.BusType;
import com.bus.system.modules.planning.domain.Route;
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

@Entity
@Table(name = "fare_config")
@Getter
@Setter
public class FareConfig extends BaseSoftDeleteEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id")
    private Route route;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_type_id")
    private BusType busType;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "is_holiday_surcharge")
    private Boolean isHolidaySurcharge = false;

    // [BỔ SUNG V10.14] Người duyệt giá
    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private FareConfigStatus status; // ACTIVE, DRAFT, EXPIRED, CANCELLED
}