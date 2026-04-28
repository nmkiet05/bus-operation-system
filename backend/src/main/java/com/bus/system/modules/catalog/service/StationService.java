package com.bus.system.modules.catalog.service;

import com.bus.system.modules.catalog.dto.request.StationRequest;
import com.bus.system.modules.catalog.dto.response.StationResponse;

import java.util.List;

/**
 * Station Service - Master Data
 * 
 * CRUD pattern cho BusStation (giống Province):
 * - createStation: Tạo bến xe mới khi có giấy phép
 * - getAllStations: Lấy danh sách bến xe (Public API)
 * - deactivateStation: Soft delete khi bến xe đóng cửa
 * 
 * ❌ Không có updateStation - Tạo bản ghi mới để giữ lịch sử
 */
public interface StationService {

    // ✅ CREATE: Khi có bến xe mới được cấp phép
    StationResponse createStation(StationRequest request);

    // ✅ READ: Public API cho dropdown
    List<StationResponse> getAllStations();

    // ✅ DELETE (Soft): Vô hiệu hóa khi bến xe đóng cửa/sáp nhập
    void deactivateStation(Long id);

    // ✅ ACTIVATE: Kích hoạt lại bến xe đã vô hiệu hóa
    void activateStation(Long id);

    // ❌ updateStation - Không có vì Master Data không cho phép UPDATE
}