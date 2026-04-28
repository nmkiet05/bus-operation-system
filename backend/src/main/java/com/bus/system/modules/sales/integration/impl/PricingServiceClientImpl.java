package com.bus.system.modules.sales.integration.impl;

import com.bus.system.modules.pricing.domain.FareConfig;
import com.bus.system.modules.pricing.repository.FareConfigRepository;
import com.bus.system.modules.sales.integration.PricingServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component("salesPricingServiceClient")
@RequiredArgsConstructor
public class PricingServiceClientImpl implements PricingServiceClient {
    private final FareConfigRepository fareConfigRepository;

    @Override
    public Optional<FareConfig> getFareConfigById(Long fareConfigId) {
        return fareConfigRepository.findById(fareConfigId);
    }
}
