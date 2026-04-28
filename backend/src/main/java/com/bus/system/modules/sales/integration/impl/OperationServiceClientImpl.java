package com.bus.system.modules.sales.integration.impl;

import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.repository.TripRepository;
import com.bus.system.modules.sales.integration.OperationServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component("salesOperationServiceClient")
@RequiredArgsConstructor
public class OperationServiceClientImpl implements OperationServiceClient {
    private final TripRepository tripRepository;

    @Override
    public Optional<Trip> getTripById(Long tripId) {
        return tripRepository.findById(tripId);
    }
}
