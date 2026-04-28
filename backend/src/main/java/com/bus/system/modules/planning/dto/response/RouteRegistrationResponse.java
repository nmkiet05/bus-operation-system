package com.bus.system.modules.planning.dto.response;

import com.bus.system.modules.planning.contract.RegistrationStatus;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class RouteRegistrationResponse {
    private Long id;
    private Long routeId;
    private Long busId;
    private String busLicensePlate;
    private String busTypeName;
    private String badgeNumber;
    private LocalDate registeredAt;
    private LocalDate expiredAt;
    private LocalDate revokedAt;
    private String revokeReason;
    private RegistrationStatus status;
    private LocalDateTime createdAt;
}
