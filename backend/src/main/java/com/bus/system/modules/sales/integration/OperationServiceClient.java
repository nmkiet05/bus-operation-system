package com.bus.system.modules.sales.integration;

import com.bus.system.modules.operation.domain.Trip;

import java.util.Optional;

public interface OperationServiceClient {
    Optional<Trip> getTripById(Long tripId);
}
