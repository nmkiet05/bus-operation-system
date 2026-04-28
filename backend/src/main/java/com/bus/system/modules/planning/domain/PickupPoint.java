package com.bus.system.modules.planning.domain;

import com.bus.system.common.persistence.BaseSoftDeleteEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import com.bus.system.common.utils.CodeGeneratorUtils;

import java.math.BigDecimal;

/**
 * Entity đại diện cho điểm đón/trả khách dọc đường.
 * Mỗi điểm đón thuộc về 1 tuyến cụ thể (Route).
 * Hỗ trợ xóa mềm (soft delete) qua deletedAt.
 */
@Entity
@Table(name = "pickup_point")
@Getter
@Setter
public class PickupPoint extends BaseSoftDeleteEntity {

    @Column(name = "code", unique = true)
    private String code;

    @Column(name = "route_id", nullable = false)
    private Long routeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", insertable = false, updatable = false)
    private Route route;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "latitude", precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 11, scale = 8)
    private BigDecimal longitude;

    /**
     * Thứ tự điểm dừng trên lộ trình (1, 2, 3...).
     * Unique trong phạm vi 1 route.
     */
    @Column(name = "sequence_order", nullable = false)
    private Integer sequenceOrder;

    /**
     * Thời gian ước tính từ bến xuất phát (đơn vị: phút).
     * VD: 30 phút = đón sau 30 phút kể từ khi xe xuất bến.
     */
    @Column(name = "estimated_minutes_from_departure", nullable = false)
    private Integer estimatedMinutesFromDeparture;

    @Column(name = "status", length = 20)
    private String status = "ACTIVE";

    public boolean isActive() {
        return "ACTIVE".equalsIgnoreCase(this.status);
    }

    @PrePersist
    public void generateCode() {
        if (this.code == null && this.sequenceOrder != null) {
            String routeCode = this.route != null ? this.route.getCode() : "XXXX";
            this.code = CodeGeneratorUtils.generatePickupPointCode(routeCode,
                    this.sequenceOrder);
        }
    }
}
