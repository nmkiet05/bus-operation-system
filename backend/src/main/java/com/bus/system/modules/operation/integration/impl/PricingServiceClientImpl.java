package com.bus.system.modules.operation.integration.impl;

import com.bus.system.modules.pricing.domain.FareConfig;
import com.bus.system.modules.pricing.repository.FareConfigRepository;
import com.bus.system.modules.operation.integration.PricingServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("operationPricingServiceClient")
@RequiredArgsConstructor
public class PricingServiceClientImpl implements PricingServiceClient {
    private final FareConfigRepository fareConfigRepository;

    @Override
    public List<FareConfig> getAllFareConfigs() {
        return fareConfigRepository.findAll();
    }
}
