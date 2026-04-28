package com.bus.system.modules.pricing.mapper;

import com.bus.system.modules.pricing.domain.FareConfig;
import com.bus.system.modules.pricing.dto.request.FareConfigRequest;
import com.bus.system.modules.pricing.dto.response.FareConfigResponse;
import org.springframework.stereotype.Component;

@Component
public class FareConfigMapper {

    public FareConfig toEntity(FareConfigRequest request) {
        if (request == null)
            return null;
        FareConfig entity = new FareConfig();
        entity.setPrice(request.getPrice());
        entity.setEffectiveFrom(request.getEffectiveFrom());
        entity.setIsHolidaySurcharge(request.getIsHolidaySurcharge());
        return entity;
    }

    public FareConfigResponse toResponse(FareConfig entity) {
        if (entity == null)
            return null;
        FareConfigResponse response = new FareConfigResponse();
        response.setId(entity.getId());

        if (entity.getRoute() != null) {
            response.setRouteId(entity.getRoute().getId());
            response.setRouteName(entity.getRoute().getName());
        }

        if (entity.getBusType() != null) {
            response.setBusTypeId(entity.getBusType().getId());
            response.setBusTypeName(entity.getBusType().getName());
        }

        response.setPrice(entity.getPrice());
        response.setEffectiveFrom(entity.getEffectiveFrom());
        response.setEffectiveTo(entity.getEffectiveTo());
        response.setIsHolidaySurcharge(entity.getIsHolidaySurcharge());
        response.setApprovedBy(entity.getApprovedBy());
        if (entity.getStatus() != null) {
            response.setStatus(entity.getStatus().name());
        }

        return response;
    }
}