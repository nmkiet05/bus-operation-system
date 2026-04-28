package com.bus.system.modules.sales.integration;

import com.bus.system.modules.fleet.domain.BusType;
import com.bus.system.modules.planning.domain.PickupPoint;

import java.util.List;
import java.util.Optional;

public interface PlanningServiceClient {
    Optional<PickupPoint> getPickupPointById(Long pickupPointId);

    List<BusType> getEffectiveBusTypesByScheduleId(Long scheduleId);
}
