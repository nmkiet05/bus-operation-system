package com.bus.system.modules.operation.service;

import com.bus.system.modules.operation.dto.response.TripResponse;

/**
 * Service quản lý vòng đời chuyến xe.
 * Tách biệt khỏi TripAssignmentService (điều độ / gán tài nguyên).
 */
public interface TripLifecycleService {

    /**
     * Bắt đầu chuyến đi → RUNNING, cập nhật giờ khởi hành thực tế.
     */
    TripResponse startTrip(Long tripId);

    /**
     * Kết thúc chuyến đi → COMPLETED, cập nhật giờ đến thực tế.
     */
    TripResponse completeTrip(Long tripId);

    /**
     * Hủy chuyến: SCHEDULED|APPROVED → CANCELLED.
     */
    void cancelTrip(Long tripId);
}
