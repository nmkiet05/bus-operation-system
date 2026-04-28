package com.bus.system.modules.catalog.dto.request;

import com.bus.system.modules.catalog.domain.enums.DepotStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class DepotRequest {

    @NotBlank(message = "Tên bãi xe không được để trống")
    private String name;

    private String address;

    private Integer capacity;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private DepotStatus status; // Default ACTIVE nếu null
}
