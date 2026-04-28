package com.bus.system.modules.sales.integration.impl;

import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.identity.repository.UserRepository;
import com.bus.system.modules.sales.integration.IdentityServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component("salesIdentityServiceClient")
@RequiredArgsConstructor
public class IdentityServiceClientImpl implements IdentityServiceClient {
    private final UserRepository userRepository;

    @Override
    public Optional<User> getUserById(Long userId) {
        return userRepository.findById(userId);
    }
}
