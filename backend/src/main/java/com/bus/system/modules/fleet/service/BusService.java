package com.bus.system.modules.fleet.service;

import com.bus.system.modules.fleet.dto.request.BusRequest;
import com.bus.system.modules.fleet.dto.response.BusResponse;

import java.util.List;

public interface BusService {
    // 1. Tạo xe mới
    BusResponse createBus(BusRequest request);

    // 2. Cập nhật xe
    BusResponse updateBus(Long id, BusRequest request);

    // 3. Xóa xe (Xóa mềm)
    void deleteBus(Long id);

    // 4. Lấy danh sách xe
    List<BusResponse> getAllBuses();
}