package com.bus.system.modules.catalog.domain;

import com.bus.system.modules.catalog.domain.enums.StationStatus;
import com.bus.system.common.persistence.BaseMasterDataEntity;
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

/**
 * BusStation (Bến xe) - Master Data
 * 
 * Bến xe pháp lý do nhà nước cấp phép.
 * Extends BaseMasterDataEntity (không có updated_at, version).
 */
@Entity
@Table(name = "bus_station")
@Getter
@Setter
public class BusStation extends BaseMasterDataEntity {

    @Column(name = "gov_code", nullable = false, unique = true, length = 20)
    private String govCode; // Mã bến do nhà nước cấp (VD: BX-MIEN-DONG)

    @Column(nullable = false, length = 100)
    private String name; // VD: Bến Xe Miền Đông Mới

    @Column(columnDefinition = "TEXT")
    private String address;

    // Quan hệ ManyToOne với Tỉnh
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "province_id")
    private Province province;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private StationStatus status = StationStatus.ACTIVE;
}