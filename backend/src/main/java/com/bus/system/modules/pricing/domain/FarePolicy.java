package com.bus.system.modules.pricing.domain;

import com.bus.system.modules.pricing.contract.PolicyType;
import com.bus.system.common.persistence.BaseSoftDeleteEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "fare_policies")
@Getter
@Setter
public class FarePolicy extends BaseSoftDeleteEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    // [CORE] Văn bản pháp lý
    @Column(name = "legal_reference_doc")
    private String legalReferenceDoc;

    // Enum: REFUND, DISCOUNT, SURCHARGE
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PolicyType type;

    // Phạm vi: GLOBAL, ROUTE_SPECIFIC...
    @Column(length = 20)
    private String scope;

    // [NEW V10.14] Phân loại: HOUSE_RULE vs LAW_FORCE_MAJEURE
    @Column(length = 20)
    private String category;

    // Cấu hình động (JSONB Rule Engine)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> conditions;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> action;

    // Quản trị
    private Integer priority;

    @Column(name = "max_usage")
    private Integer maxUsage;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "is_active")
    private Boolean isActive = true;

    // --- PHẦN AUDIT LOG RIÊNG (Vì BaseEntity không có) ---
    // Khớp với SQL: created_by BIGINT REFERENCES users (id)

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private Long createdBy;

    @LastModifiedBy
    @Column(name = "updated_by")
    private Long updatedBy;

    // Riêng cột deleted_by phải tự xử lý logic (Soft Delete)
    @Column(name = "deleted_by")
    private Long deletedBy;
}