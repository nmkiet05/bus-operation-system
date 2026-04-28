package com.bus.system.modules.identity.service.impl;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.identity.domain.RefreshToken;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.identity.mapper.RefreshTokenMapper;
import com.bus.system.modules.identity.repository.RefreshTokenRepository;
import com.bus.system.modules.identity.repository.UserRepository;
import com.bus.system.modules.identity.service.RefreshTokenService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenServiceImpl implements RefreshTokenService {

    @Value("${app.jwtRefreshExpirationMs}")
    private Long refreshTokenDurationMs;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final RefreshTokenMapper refreshTokenMapper;

    @Override
    @Transactional
    public RefreshToken createRefreshToken(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Revoke all existing tokens for this user (token rotation)
        refreshTokenRepository.revokeAllByUser(user);

        RefreshToken refreshToken = refreshTokenMapper.toEntity(user, refreshTokenDurationMs);

        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (!token.isUsable()) {
            refreshTokenRepository.delete(token);
            throw new BusinessException(
                    "Refresh token đã hết hạn hoặc bị thu hồi. Vui lòng đăng nhập lại.");
        }
        return token;
    }

    @Override
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Override
    @Transactional
    public void revokeToken(RefreshToken token) {
        token.revoke();
        refreshTokenRepository.save(token);
        log.info("Revoked refresh token for user: {}", token.getUser().getUsername());
    }
}
