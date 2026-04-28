package com.bus.system.modules.pricing.service;

import com.bus.system.modules.pricing.dto.request.FarePolicyRequest;
import com.bus.system.modules.pricing.dto.response.FarePolicyResponse;
import java.util.List;

public interface FarePolicyService {
    FarePolicyResponse create(FarePolicyRequest request);
    FarePolicyResponse update(Long id, FarePolicyRequest request);
    void delete(Long id);
    FarePolicyResponse getById(Long id);
    List<FarePolicyResponse> getAll();
}