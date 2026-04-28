package com.bus.system.modules.pricing.mapper;

import com.bus.system.modules.pricing.domain.FarePolicy;
import com.bus.system.modules.pricing.dto.request.FarePolicyRequest;
import com.bus.system.modules.pricing.dto.response.FarePolicyResponse;
import org.springframework.stereotype.Component;

@Component
public class FarePolicyMapper {

    public FarePolicy toEntity(FarePolicyRequest request) {
        if (request == null) return null;
        FarePolicy entity = new FarePolicy();
        // Không set ID
        entity.setCode(request.getCode());
        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setLegalReferenceDoc(request.getLegalReferenceDoc());
        entity.setType(request.getType());
        entity.setScope(request.getScope());
        entity.setCategory(request.getCategory());
        entity.setConditions(request.getConditions());
        entity.setAction(request.getAction());
        entity.setPriority(request.getPriority());
        entity.setMaxUsage(request.getMaxUsage());
        entity.setStartTime(request.getStartTime());
        entity.setEndTime(request.getEndTime());
        entity.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        return entity;
    }

    public FarePolicyResponse toResponse(FarePolicy entity) {
        if (entity == null) return null;
        FarePolicyResponse response = new FarePolicyResponse();
        response.setId(entity.getId());
        response.setCode(entity.getCode());
        response.setName(entity.getName());
        response.setDescription(entity.getDescription());
        response.setLegalReferenceDoc(entity.getLegalReferenceDoc());
        response.setType(entity.getType());
        response.setScope(entity.getScope());
        response.setCategory(entity.getCategory());
        response.setConditions(entity.getConditions());
        response.setAction(entity.getAction());
        response.setPriority(entity.getPriority());
        response.setMaxUsage(entity.getMaxUsage());
        response.setStartTime(entity.getStartTime());
        response.setEndTime(entity.getEndTime());
        response.setIsActive(entity.getIsActive());

        response.setCreatedBy(entity.getCreatedBy());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }

    public void updateEntity(FarePolicy entity, FarePolicyRequest request) {
        if (request == null || entity == null) return;
        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setLegalReferenceDoc(request.getLegalReferenceDoc());
        entity.setConditions(request.getConditions());
        entity.setAction(request.getAction());
        entity.setPriority(request.getPriority());
        entity.setMaxUsage(request.getMaxUsage());
        entity.setStartTime(request.getStartTime());
        entity.setEndTime(request.getEndTime());
        // Lưu ý: Không update Code và Type để đảm bảo toàn vẹn
        if(request.getIsActive() != null) entity.setIsActive(request.getIsActive());
    }
}