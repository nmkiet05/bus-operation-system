package com.bus.system.modules.operation.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TripReassignmentRequest {

    @NotNull(message = "ID tài xế mới không được để trống")
    private Long newDriverId;

    private boolean resolveDeadlock = false;

    private String reason;

    private boolean isEmergency = false;
}
