package com.bus.system.modules.sales.integration;

import com.bus.system.modules.identity.domain.User;

import java.util.Optional;

public interface IdentityServiceClient {
    Optional<User> getUserById(Long userId);
}
