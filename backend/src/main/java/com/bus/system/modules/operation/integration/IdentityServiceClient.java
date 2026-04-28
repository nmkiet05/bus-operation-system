package com.bus.system.modules.operation.integration;

import com.bus.system.modules.identity.domain.User;

import java.util.List;
import java.util.Set;

public interface IdentityServiceClient {
    List<User> getUsersByIds(Set<Long> userIds);
}
