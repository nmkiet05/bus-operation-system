package com.bus.system.modules.fleet.mapper;

import com.bus.system.modules.fleet.domain.BusType;
import com.bus.system.modules.fleet.dto.request.BusTypeRequest;
import com.bus.system.modules.fleet.dto.response.BusTypeResponse;
import org.springframework.stereotype.Component;

@Component
public class BusTypeMapper {

    public BusType toEntity(BusTypeRequest request) {
        BusType entity = new BusType();
        entity.setName(request.getName());
        entity.setTotalSeats(request.getTotalSeats());
        entity.setSeatMap(request.getSeatMap());
        return entity;
    }

    public BusTypeResponse toResponse(BusType entity) {
        return BusTypeResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .totalSeats(entity.getTotalSeats())
                .seatMap(entity.getSeatMap())
                .build();
    }

    public void updateEntity(BusType entity, BusTypeRequest request) {
        entity.setName(request.getName());
        entity.setTotalSeats(request.getTotalSeats());
        if (request.getSeatMap() != null) {
            entity.setSeatMap(request.getSeatMap());
        }
    }
}
