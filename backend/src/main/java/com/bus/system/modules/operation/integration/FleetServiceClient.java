package com.bus.system.modules.operation.integration;

import com.bus.system.modules.fleet.domain.Bus;

import java.util.List;
import java.util.Set;

public interface FleetServiceClient {
    List<Bus> getBusesByIds(Set<Long> busIds);
}
