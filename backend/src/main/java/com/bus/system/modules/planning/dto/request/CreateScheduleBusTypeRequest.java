package com.bus.system.modules.planning.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateScheduleBusTypeRequest {
    @NotNull(message = "Bus Type ID không được để trống")
    private Long busTypeId;

    private String reason;
}
