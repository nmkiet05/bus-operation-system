package com.bus.system.modules.identity.mapper;

import com.bus.system.modules.identity.domain.RefreshToken;
import com.bus.system.modules.identity.domain.User;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class RefreshTokenMapper {

    public RefreshToken toEntity(User user, Long durationMs) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiryDate(Instant.now().plusMillis(durationMs));
        refreshToken.setRevoked(false);
        return refreshToken;
    }
}
