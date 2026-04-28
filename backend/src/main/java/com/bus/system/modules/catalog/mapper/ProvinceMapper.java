package com.bus.system.modules.catalog.mapper;

import com.bus.system.modules.catalog.domain.Province;
import com.bus.system.modules.catalog.dto.request.ProvinceRequest;
import com.bus.system.modules.catalog.dto.response.ProvinceResponse;
import org.springframework.stereotype.Component;

@Component
public class ProvinceMapper {

    public Province toEntity(ProvinceRequest request) {
        if (request == null)
            return null;
        Province province = new Province();
        province.setName(request.getName());
        province.setGovCode(request.getGovCode());
        return province;
    }

    public ProvinceResponse toResponse(Province entity) {
        if (entity == null)
            return null;
        ProvinceResponse response = new ProvinceResponse();
        response.setId(entity.getId());
        response.setName(entity.getName());
        response.setGovCode(entity.getGovCode());
        return response;
    }
}