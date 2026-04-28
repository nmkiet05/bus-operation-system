package com.bus.system.modules.planning.mapper;

import com.bus.system.modules.planning.domain.PickupPoint;
import com.bus.system.modules.planning.dto.request.PickupPointRequest;
import com.bus.system.modules.planning.dto.response.PickupPointResponse;
import org.springframework.stereotype.Component;

@Component
public class PickupPointMapper {

    public PickupPoint toEntity(PickupPointRequest request, Long routeId) {
        PickupPoint entity = new PickupPoint();
        entity.setRouteId(routeId);
        entity.setName(request.getName());
        entity.setAddress(request.getAddress());
        entity.setLatitude(request.getLatitude());
        entity.setLongitude(request.getLongitude());
        entity.setSequenceOrder(request.getSequenceOrder());
        entity.setEstimatedMinutesFromDeparture(request.getEstimatedMinutesFromDeparture());
        entity.setStatus("ACTIVE");
        return entity;
    }

    public PickupPointResponse toResponse(PickupPoint entity) {
        PickupPointResponse response = new PickupPointResponse();
        response.setId(entity.getId());
        response.setRouteId(entity.getRouteId());
        response.setName(entity.getName());
        response.setAddress(entity.getAddress());
        response.setLatitude(entity.getLatitude());
        response.setLongitude(entity.getLongitude());
        response.setSequenceOrder(entity.getSequenceOrder());
        response.setEstimatedMinutesFromDeparture(entity.getEstimatedMinutesFromDeparture());
        response.setStatus(entity.getStatus());
        return response;
    }
}
