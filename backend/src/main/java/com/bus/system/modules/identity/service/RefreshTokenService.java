package com.bus.system.modules.identity.service;

import com.bus.system.modules.identity.domain.RefreshToken;

import java.util.Optional;

public interface RefreshTokenService {

    RefreshToken createRefreshToken(Long userId);

    RefreshToken verifyExpiration(RefreshToken token);

    Optional<RefreshToken> findByToken(String token);

    void revokeToken(RefreshToken token);
}
