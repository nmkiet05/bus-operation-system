package com.bus.system.modules.operation.integration;

import com.bus.system.modules.pricing.domain.FareConfig;

import java.util.List;

public interface PricingServiceClient {
    List<FareConfig> getAllFareConfigs();
}
