package com.bus.system.modules.planning.mapper;

import com.bus.system.modules.planning.domain.RouteRegistration;
import com.bus.system.modules.planning.dto.response.RouteRegistrationResponse;
import org.springframework.stereotype.Component;

@Component
public class RouteRegistrationMapper {

    public RouteRegistrationResponse toResponse(RouteRegistration reg) {
        if (reg == null)
            return null;

        RouteRegistrationResponse res = new RouteRegistrationResponse();
        res.setId(reg.getId());
        res.setRouteId(reg.getRoute().getId());
        res.setBusId(reg.getBus().getId());
        res.setBusLicensePlate(reg.getBus().getLicensePlate());
        res.setBusTypeName(reg.getBus().getBusType() != null ? reg.getBus().getBusType().getName() : null);
        res.setBadgeNumber(reg.getBadgeNumber());
        res.setRegisteredAt(reg.getRegisteredAt());
        res.setExpiredAt(reg.getExpiredAt());
        res.setRevokedAt(reg.getRevokedAt());
        res.setRevokeReason(reg.getRevokeReason());
        res.setStatus(reg.getStatus());
        res.setCreatedAt(reg.getCreatedAt());
        return res;
    }
}
