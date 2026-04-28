package com.bus.system.modules.planning.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateRouteRegistrationRequest {
    @NotNull(message = "Bus ID không được để trống")
    private Long busId;

    private String badgeNumber;

    private LocalDate expiredAt;
}
