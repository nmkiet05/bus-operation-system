package com.bus.system.modules.pricing.dto.request;

import com.bus.system.modules.pricing.contract.PolicyType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
public class FarePolicyRequest {

    @NotBlank(message = "Mã chính sách không được để trống")
    private String code;

    @NotBlank(message = "Tên chính sách không được để trống")
    private String name;

    private String description;

    private String legalReferenceDoc;

    @NotNull(message = "Loại chính sách không được để trống")
    private PolicyType type; // REFUND, DISCOUNT, SURCHARGE

    private String scope; // GLOBAL, ROUTE_SPECIFIC

    private String category; // HOUSE_RULE, LAW_FORCE_MAJEURE

    // JSONB - Rule Engine (Frontend gửi JSON object)
    @NotNull(message = "Điều kiện áp dụng không được để trống")
    private Map<String, Object> conditions;

    @NotNull(message = "Hành động (Công thức tính) không được để trống")
    private Map<String, Object> action;

    private Integer priority;

    private Integer maxUsage;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Boolean isActive;
}