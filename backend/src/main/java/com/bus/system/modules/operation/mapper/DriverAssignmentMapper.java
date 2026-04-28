package com.bus.system.modules.operation.mapper;

import com.bus.system.modules.operation.domain.DriverAssignment;
import com.bus.system.modules.operation.dto.response.CrewMemberResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper cho DriverAssignment entity ↔ DTO.
 */
@Component
public class DriverAssignmentMapper {

    public CrewMemberResponse toCrewMemberResponse(DriverAssignment da) {
        if (da == null)
            return null;

        return CrewMemberResponse.builder()
                .assignmentId(da.getId())
                .userId(da.getDriver().getId())
                // employeeCode nằm trên User entity (global unique, không phân biệt role)
                .employeeCode(da.getDriver().getEmployeeCode())
                .fullName(da.getDriver().getFullName())
                .phone(da.getDriver().getPhone())
                .role(da.getRole())
                .status(da.getStatus().name())
                .build();
    }

    public List<CrewMemberResponse> toCrewMemberResponseList(List<DriverAssignment> assignments) {
        if (assignments == null)
            return List.of();
        return assignments.stream()
                .map(this::toCrewMemberResponse)
                .collect(Collectors.toList());
    }
}
