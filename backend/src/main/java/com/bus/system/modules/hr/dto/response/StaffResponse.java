package com.bus.system.modules.hr.dto.response;

import com.bus.system.modules.hr.domain.enums.JobTitle;
import lombok.Getter;
import lombok.Setter;
import java.util.Map;

@Getter
@Setter
public class StaffResponse {
    private Long userId;
    private String fullName;
    private String username;
    private String email;
    private String phone;

    private String employeeCode;
    private Long departmentId;
    private JobTitle jobTitle;

    private Long stationId;
    private String stationName;

    private Long assignedOfficeId;
    private String assignedOfficeName;

    private Map<String, Object> attributes;
}
