package com.bus.system.modules.catalog.mapper;

import com.bus.system.modules.catalog.domain.Depot;
import com.bus.system.modules.catalog.domain.enums.DepotStatus;
import com.bus.system.modules.catalog.dto.request.DepotRequest;
import com.bus.system.modules.catalog.dto.response.DepotResponse;
import org.springframework.stereotype.Component;

@Component
public class DepotMapper {

    public Depot toEntity(DepotRequest request) {
        if (request == null)
            return null;
        Depot depot = new Depot();
        depot.setName(request.getName());
        depot.setAddress(request.getAddress());
        depot.setCapacity(request.getCapacity());
        depot.setLatitude(request.getLatitude());
        depot.setLongitude(request.getLongitude());
        depot.setStatus(request.getStatus() != null ? request.getStatus() : DepotStatus.ACTIVE);
        return depot;
    }

    public void updateEntity(Depot depot, DepotRequest request) {
        if (request == null)
            return;
        depot.setName(request.getName());
        depot.setAddress(request.getAddress());
        depot.setCapacity(request.getCapacity());
        depot.setLatitude(request.getLatitude());
        depot.setLongitude(request.getLongitude());
        if (request.getStatus() != null) {
            depot.setStatus(request.getStatus());
        }
    }

    public DepotResponse toResponse(Depot entity) {
        if (entity == null)
            return null;
        DepotResponse response = new DepotResponse();
        response.setId(entity.getId());
        response.setName(entity.getName());
        response.setAddress(entity.getAddress());
        response.setCapacity(entity.getCapacity());
        response.setLatitude(entity.getLatitude());
        response.setLongitude(entity.getLongitude());
        response.setStatus(entity.getStatus());
        return response;
    }
}
