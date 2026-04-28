package com.bus.system.modules.pricing.dto.response;

import com.bus.system.modules.pricing.contract.PolicyType;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
public class FarePolicyResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String legalReferenceDoc;
    private PolicyType type;
    private String scope;
    private String category;

    private Map<String, Object> conditions;
    private Map<String, Object> action;

    private Integer priority;
    private Integer maxUsage;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Boolean isActive;

    private Long createdBy; // Chỉ trả về ID, FE sẽ map tên user sau nếu cần
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}