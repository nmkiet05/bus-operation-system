package com.bus.system.modules.planning.service;

import com.bus.system.modules.planning.dto.request.PickupPointRequest;
import com.bus.system.modules.planning.dto.response.PickupPointResponse;

import java.util.List;

/**
 * Service quản lý điểm đón/trả khách dọc đường.
 */
public interface PickupPointService {

    /**
     * Tạo điểm đón mới cho tuyến.
     */
    PickupPointResponse createPickupPoint(Long routeId, PickupPointRequest request);

    /**
     * Cập nhật thông tin điểm đón.
     */
    PickupPointResponse updatePickupPoint(Long id, PickupPointRequest request);

    /**
     * Xóa điểm đón.
     */
    void deletePickupPoint(Long id);

    /**
     * Lấy danh sách điểm đón của tuyến (chỉ ACTIVE).
     */
    List<PickupPointResponse> getPickupPointsByRoute(Long routeId);

    /**
     * Xem chi tiết điểm đón.
     */
    PickupPointResponse getPickupPointById(Long id);
}
