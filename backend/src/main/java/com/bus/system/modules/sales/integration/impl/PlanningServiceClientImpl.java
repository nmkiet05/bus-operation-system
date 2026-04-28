package com.bus.system.modules.sales.integration.impl;

import com.bus.system.modules.fleet.domain.BusType;
import com.bus.system.modules.planning.domain.PickupPoint;
import com.bus.system.modules.planning.repository.PickupPointRepository;
import com.bus.system.modules.planning.repository.ScheduleBusTypeRepository;
import com.bus.system.modules.sales.integration.PlanningServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component("salesPlanningServiceClient")
@RequiredArgsConstructor
public class PlanningServiceClientImpl implements PlanningServiceClient {
    private final PickupPointRepository pickupPointRepository;
    private final ScheduleBusTypeRepository scheduleBusTypeRepository;

    @Override
    public Optional<PickupPoint> getPickupPointById(Long pickupPointId) {
        return pickupPointRepository.findById(pickupPointId);
    }

    @Override
    public List<BusType> getEffectiveBusTypesByScheduleId(Long scheduleId) {
        return scheduleBusTypeRepository.findEffectiveBusTypesByScheduleId(scheduleId);
    }
}
