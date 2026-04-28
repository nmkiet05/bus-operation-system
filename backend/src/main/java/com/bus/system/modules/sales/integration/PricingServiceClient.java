package com.bus.system.modules.sales.integration;

import com.bus.system.modules.pricing.domain.FareConfig;

import java.util.Optional;

public interface PricingServiceClient {
    Optional<FareConfig> getFareConfigById(Long fareConfigId);
}
