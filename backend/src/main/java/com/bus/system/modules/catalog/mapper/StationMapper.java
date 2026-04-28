package com.bus.system.modules.catalog.mapper;

import com.bus.system.modules.catalog.domain.enums.StationStatus;
import com.bus.system.modules.catalog.domain.BusStation;

import com.bus.system.modules.catalog.domain.Province;
import com.bus.system.modules.catalog.dto.request.StationRequest;
import com.bus.system.modules.catalog.dto.response.StationResponse;
import org.springframework.stereotype.Component;

@Component
public class StationMapper {

    public BusStation toEntity(StationRequest request, Province province) {
        if (request == null)
            return null;
        BusStation station = new BusStation();
        station.setGovCode(request.getGovCode());
        station.setName(request.getName());
        station.setAddress(request.getAddress());
        station.setProvince(province);

        // Default to ACTIVE if null
        station.setStatus(
                request.getStatus() != null ? request.getStatus() : StationStatus.ACTIVE);
        return station;
    }

    public StationResponse toResponse(BusStation entity) {
        if (entity == null)
            return null;
        StationResponse response = new StationResponse();
        response.setId(entity.getId());
        response.setGovCode(entity.getGovCode());
        response.setName(entity.getName());
        response.setAddress(entity.getAddress());
        response.setStatus(entity.getStatus());

        // Flatten: Lôi tên Tỉnh ra để Frontend hiển thị cho tiện
        if (entity.getProvince() != null) {
            response.setProvinceId(entity.getProvince().getId());
            response.setProvinceName(entity.getProvince().getName());
        }
        return response;
    }
}