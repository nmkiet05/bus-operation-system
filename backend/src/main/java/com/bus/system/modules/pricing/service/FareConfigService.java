package com.bus.system.modules.pricing.service;

import com.bus.system.modules.pricing.dto.request.FareConfigRequest;
import com.bus.system.modules.pricing.dto.response.FareConfigResponse;

import java.time.LocalDate;
import java.util.List;

public interface FareConfigService {
    // Tạo mới hoặc cập nhật giá (Logic SCD Type 2)
    FareConfigResponse upsertFare(FareConfigRequest request);

    // Lấy giá đang áp dụng (Active)
    FareConfigResponse getActiveFare(Long routeId, Long busTypeId, LocalDate date);

    // Lấy tất cả giá vé đang áp dụng
    List<FareConfigResponse> getAllActiveFares();
}