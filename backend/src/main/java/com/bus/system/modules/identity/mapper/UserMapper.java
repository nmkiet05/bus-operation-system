package com.bus.system.modules.identity.mapper;

import com.bus.system.modules.identity.contract.UserRole;

import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.identity.dto.request.CreateUserRequest;
import com.bus.system.modules.identity.dto.request.SignupRequest;
import com.bus.system.modules.identity.dto.response.JwtResponse;
import com.bus.system.modules.identity.dto.response.UserResponse;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

@Component
public class UserMapper {

    // ======================== Entity Mapping ========================

    public User toEntity(SignupRequest request) {
        if (request == null)
            return null;
        User user = new User();
        user.setUsername(request.getUsername());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        return user;
    }

    /**
     * Map CreateUserRequest to User entity
     * Sử dụng cho Admin tạo Nhân viên
     */
    public User toEntity(CreateUserRequest request) {
        if (request == null)
            return null;
        User user = new User();
        user.setUsername(request.getUsername());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        return user;
    }

    // ======================== Response Mapping ========================

    public UserResponse toResponse(User entity) {
        if (entity == null)
            return null;
        UserResponse response = new UserResponse();
        response.setId(entity.getId());
        response.setUsername(entity.getUsername());
        response.setEmployeeCode(entity.getEmployeeCode()); // Mã nhân viên công khai
        response.setFullName(entity.getFullName());
        response.setEmail(entity.getEmail());
        response.setPhone(entity.getPhone());
        response.setRoles(entity.getRoles());
        response.setAvatarUrl(entity.getAvatarUrl());
        response.setStatus(entity.getStatus());
        return response;
    }

    /**
     * Build JwtResponse từ User entity + access/refresh token
     * Dùng cho login và refresh-token endpoints
     */
    public JwtResponse toJwtResponse(User user, String accessToken, String refreshToken) {
        Set<String> roles = user.getRoles().stream()
                .map(role -> "ROLE_" + role.name())
                .collect(Collectors.toSet());
        return new JwtResponse(accessToken, refreshToken, user.getId(),
                user.getUsername(), user.getEmail(), user.getFullName(), user.getPhone(), roles);
    }
}
