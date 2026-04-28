package com.bus.system.modules.catalog.mapper;

import com.bus.system.modules.catalog.domain.BusStation;
import com.bus.system.modules.catalog.domain.TicketOffice;
import com.bus.system.modules.catalog.dto.request.TicketOfficeRequest;
import com.bus.system.modules.catalog.dto.response.TicketOfficeResponse;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

@Component
public class TicketOfficeMapper {

    public TicketOffice toEntity(TicketOfficeRequest request) {
        if (request == null)
            return null;
        TicketOffice ticketOffice = new TicketOffice();
        ticketOffice.setName(request.getName());
        ticketOffice.setAddress(request.getAddress());
        ticketOffice.setLocationDetail(request.getLocationDetail());
        ticketOffice.setPhone(request.getPhone());
        ticketOffice.setStatus(request.getStatus());
        return ticketOffice;
    }

    public TicketOfficeResponse toResponse(TicketOffice entity) {
        if (entity == null)
            return null;
        TicketOfficeResponse response = new TicketOfficeResponse();
        response.setId(entity.getId());
        response.setName(entity.getName());
        response.setAddress(entity.getAddress());
        response.setLocationDetail(entity.getLocationDetail());
        response.setPhone(entity.getPhone());
        response.setStatus(entity.getStatus());

        if (entity.getStation() != null) {
            response.setStationId(entity.getStation().getId());
            response.setStationName(entity.getStation().getName());
        }
        return response;
    }

    public List<TicketOfficeResponse> toResponseListWithMap(List<TicketOffice> entities,
            Map<Long, BusStation> stationMap) {
        return entities.stream().map(entity -> {
            TicketOfficeResponse response = toResponse(entity);
            if (entity.getStation() != null && stationMap.containsKey(entity.getStation().getId())) {
                response.setStationName(stationMap.get(entity.getStation().getId()).getName());
            }
            return response;
        }).collect(Collectors.toList());
    }

    public void updateEntity(TicketOffice entity, TicketOfficeRequest request) {
        if (request == null || entity == null)
            return;
        entity.setName(request.getName());
        entity.setAddress(request.getAddress());
        entity.setLocationDetail(request.getLocationDetail());
        entity.setPhone(request.getPhone());
        entity.setStatus(request.getStatus());
    }
}
