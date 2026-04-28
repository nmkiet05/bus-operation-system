package com.bus.system.modules.identity.mapper;

import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.identity.domain.UserDevice;
import com.bus.system.modules.identity.dto.request.FcmTokenRequest;
import com.bus.system.modules.identity.dto.response.JwtResponse;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class AuthMapper {

    public JwtResponse toJwtResponse(String jwt, String refreshToken, User user) {
        Set<String> roles = user.getRoles().stream()
                .map(role -> role.getAuthority().getAuthority())
                .collect(Collectors.toSet());

        return new JwtResponse(
                jwt,
                refreshToken,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                roles);
    }

    public void updateUserDevice(UserDevice device, User user, FcmTokenRequest request) {
        device.setUser(user);
        device.setFcmToken(request.getFcmToken());
        device.setDeviceType(request.getDeviceType());
        device.setLastLoginAt(LocalDateTime.now());
    }
}
