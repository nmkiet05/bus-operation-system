package com.bus.system.modules.fleet.domain;

import com.bus.system.common.persistence.BaseSoftDeleteEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode; // <-- THÊM MỚI
import org.hibernate.type.SqlTypes; // <-- THÊM MỚI

import com.bus.system.common.utils.CodeGeneratorUtils;

import java.util.List;
import java.util.Map;

@Entity
@Table(name = "bus_type")
@Getter
@Setter
public class BusType extends BaseSoftDeleteEntity {

    @Column(name = "code", unique = true)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "total_seats", nullable = false)
    private Integer totalSeats;

    // --- CẬP NHẬT CHUẨN HIBERNATE 6 ---
    @JdbcTypeCode(SqlTypes.JSON) // Hibernate tự động map JSONB
    @Column(name = "seat_map", columnDefinition = "jsonb", nullable = false)
    private List<Map<String, Object>> seatMap;

    @PrePersist
    public void generateCode() {
        if (this.code == null && this.totalSeats != null) {
            this.code = CodeGeneratorUtils.generateBusTypeCode(this.totalSeats);
        }
    }
}