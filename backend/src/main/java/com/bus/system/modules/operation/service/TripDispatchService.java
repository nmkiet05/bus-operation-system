package com.bus.system.modules.operation.service;

import com.bus.system.modules.operation.dto.request.TripAssignmentRequest;
import com.bus.system.modules.operation.dto.response.TripResponse;

/**
 * Service quản lý điều độ chuyến xe.
 * Phụ trách: Gán Xe, Duyệt chuyến.
 * Lifecycle (start/complete) → TripLifecycleService.
 */
public interface TripDispatchService {

    /**
     * Gán tài nguyên (Xe) cho chuyến.
     * Chỉ dùng cho giai đoạn SCHEDULED.
     */
    TripResponse assignResources(Long tripId, TripAssignmentRequest request);

    /**
     * Duyệt chuyến (Approve).
     * Chuyển trạng thái sang APPROVED, tạo biên bản bàn giao xe.
     */
    void approveTrip(Long tripId);
}
