package com.bus.system.modules.catalog.domain;

import com.bus.system.common.persistence.BaseMasterDataEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Province (Tỉnh/Thành phố) - Master Data
 * 
 * Dữ liệu tĩnh theo quy định của Tổng cục Thống kê (GSO).
 * Extends BaseMasterDataEntity (không có updated_at, version).
 */
@Entity
@Table(name = "province")
@Getter
@Setter
public class Province extends BaseMasterDataEntity {

    @Column(nullable = false, length = 100)
    private String name; // VD: Lâm Đồng, TP.HCM

    @Column(name = "gov_code", nullable = false, unique = true, length = 10)
    private String govCode; // Mã tỉnh theo GSO (Tổng cục Thống kê) VD: 49, 50
}