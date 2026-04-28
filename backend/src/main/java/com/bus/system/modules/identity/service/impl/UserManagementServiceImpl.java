package com.bus.system.modules.identity.service.impl;

import com.bus.system.modules.identity.contract.UserRole;
import com.bus.system.modules.identity.contract.UserStatus;
import com.bus.system.common.exception.BadRequestException;
import com.bus.system.common.exception.BusinessException;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.identity.dto.request.CreateUserRequest;
import com.bus.system.modules.identity.mapper.UserMapper;
import com.bus.system.modules.identity.repository.UserRepository;
import com.bus.system.modules.identity.service.UserManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserManagementServiceImpl implements UserManagementService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder encoder;

    @Override
    @Transactional
    public User createEmployee(CreateUserRequest request) {
        log.info("Processing create employee request for username: {}", request.getUsername());

        // 1. Check duplicate username
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("Lỗi: Username đã tồn tại!");
        }

        // 2. Validate & parse roles (Enum convert, Service validate)
        Set<UserRole> roles = request.getRoles().stream()
                .map(r -> UserRole.fromString(r)
                        .orElseThrow(() -> new BadRequestException("Role không hợp lệ: " + r)))
                .collect(Collectors.toSet());

        // 3. Map DTO -> Entity
        User user = userMapper.toEntity(request);

        // 4. Set Password & Roles
        user.setPassword(encoder.encode(request.getPassword()));
        user.setRoles(roles);
        user.setStatus(UserStatus.ACTIVE);

        // 5. Save
        return Objects.requireNonNull(userRepository.save(user));
    }
}
