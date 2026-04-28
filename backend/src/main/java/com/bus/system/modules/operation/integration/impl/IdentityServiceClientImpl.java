package com.bus.system.modules.operation.integration.impl;

import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.identity.repository.UserRepository;
import com.bus.system.modules.operation.integration.IdentityServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@Component("operationIdentityServiceClient")
@RequiredArgsConstructor
public class IdentityServiceClientImpl implements IdentityServiceClient {
    private final UserRepository userRepository;

    @Override
    public List<User> getUsersByIds(Set<Long> userIds) {
        return userRepository.findAllById(userIds);
    }
}
