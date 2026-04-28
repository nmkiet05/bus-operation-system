package com.bus.system.modules.catalog.dto.response;

import com.bus.system.modules.catalog.domain.enums.DepotStatus;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class DepotResponse {
    private Long id;
    private String name;
    private String address;
    private Integer capacity;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private DepotStatus status;
}
