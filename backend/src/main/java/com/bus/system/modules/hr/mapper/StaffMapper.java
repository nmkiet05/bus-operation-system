package com.bus.system.modules.hr.mapper;

import com.bus.system.modules.hr.domain.StaffDetail;
import com.bus.system.modules.hr.dto.response.StaffResponse;
import org.springframework.stereotype.Component;

@Component
public class StaffMapper {
    public StaffResponse toResponse(StaffDetail entity) {
        if (entity == null)
            return null;
        StaffResponse response = new StaffResponse();

        if (entity.getUser() != null) {
            response.setUserId(entity.getUser().getId());
            response.setFullName(entity.getUser().getFullName());
            response.setUsername(entity.getUser().getUsername());
            response.setEmail(entity.getUser().getEmail());
            response.setPhone(entity.getUser().getPhone());
        }

        response.setEmployeeCode(entity.getEmployeeCode());
        response.setDepartmentId(entity.getDepartmentId());
        response.setJobTitle(entity.getJobTitle());

        if (entity.getStation() != null) {
            // BusStation typically has name, verifying inheritance or field
            // Assuming BusStation extends BaseEntity (id) and has Name.
            // Previous Check of StationServiceImpl showed StationResponse using
            // stationMapper.
            // I'll assume getId() works. For name, BusStation often inherits or has it.
            // Wait, BusStation might not have 'getName()' if it's specific.
            // StationMapper uses toResponse mapping.
            // I'll use entity.getStation().getId().
            // Safe bet: entity.getStation().getId(). Does it have name?
            // I'll check BusStation.java to be sure about getName().
            response.setStationId(entity.getStation().getId());
            response.setStationName(entity.getStation().getName());
        }

        if (entity.getAssignedOffice() != null) {
            response.setAssignedOfficeId(entity.getAssignedOffice().getId());
            response.setAssignedOfficeName(entity.getAssignedOffice().getName());
        }

        response.setAttributes(entity.getAttributes());

        return response;
    }
}
