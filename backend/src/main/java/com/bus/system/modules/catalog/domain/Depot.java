package com.bus.system.modules.catalog.domain;

import com.bus.system.modules.catalog.domain.enums.DepotStatus;
import com.bus.system.common.persistence.BaseSoftDeleteEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Bãi đỗ xe (Depot) — Master data catalog.
 * Độc lập với bến xe (bus_station) theo Luật Đường bộ 2024.
 */
@Entity
@Table(name = "depot")
@Getter
@Setter
public class Depot extends BaseSoftDeleteEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String address;

    private Integer capacity;

    @Column(precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitude;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private DepotStatus status;

    public boolean isActive() {
        return DepotStatus.ACTIVE.equals(this.status);
    }
}
