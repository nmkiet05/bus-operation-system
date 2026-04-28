package com.bus.system.modules.operation.integration.impl;

import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.fleet.repository.BusRepository;
import com.bus.system.modules.operation.integration.FleetServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@Component("operationFleetServiceClient")
@RequiredArgsConstructor
public class FleetServiceClientImpl implements FleetServiceClient {
    private final BusRepository busRepository;

    @Override
    public List<Bus> getBusesByIds(Set<Long> busIds) {
        return busRepository.findAllById(busIds);
    }
}
