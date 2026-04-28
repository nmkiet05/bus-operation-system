package com.bus.system.modules.operation.dto.response;

import com.bus.system.modules.operation.domain.enums.CrewRole;
import lombok.Builder;
import lombok.Data;

/**
 * [Phase 2] DTO phản hồi thông tin nhân sự trong ca xe.
 */
@Data
@Builder
public class CrewMemberResponse {
    private Long assignmentId; // DriverAssignment ID — cần cho cancel/replace
    private Long userId;
    private String employeeCode; // Mã nhân viên công khai (VD: DRV-0001)
    private String fullName;
    private String phone;
    private CrewRole role;
    private String status; // DriverAssignmentStatus
}
