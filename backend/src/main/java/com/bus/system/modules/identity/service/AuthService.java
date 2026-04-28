package com.bus.system.modules.identity.service;

import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.identity.dto.request.FcmTokenRequest;
import com.bus.system.modules.identity.dto.request.LoginRequest;
import com.bus.system.modules.identity.dto.request.SignupRequest;
import com.bus.system.modules.identity.dto.response.JwtResponse;

public interface AuthService {
    JwtResponse authenticateUser(LoginRequest loginRequest);

    User registerUser(SignupRequest signUpRequest);

    void saveFcmToken(Long userId, FcmTokenRequest request);

    User findByUsername(String username);

    boolean verifyPassword(String rawPassword, String encodedPassword);
}
