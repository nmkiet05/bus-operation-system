package com.bus.system.modules.identity.dto.response;

import com.bus.system.modules.identity.contract.UserStatus;
import com.bus.system.modules.identity.contract.UserRole;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
public class UserResponse {
    private Long id;
    private String username;
    private String employeeCode; // Mã nhân viên công khai (VD: DRV-0007, EMP-0002)
    private String fullName;
    private String email;
    private String phone;
    private Set<UserRole> roles;
    private String avatarUrl;
    private UserStatus status;
}
