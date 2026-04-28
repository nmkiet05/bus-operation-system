package com.bus.system.modules.operation.service;

import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.identity.domain.User;

import java.time.LocalDateTime;
import java.util.List;

/**
 * [Phase 2] Service quản lý khả dụng tài nguyên (Xe, Tài xế).
 * Tách ra từ TripAssignmentService để đúng Single Responsibility.
 */
public interface ResourceAvailabilityService {

    /**
     * Lấy danh sách tài xế khả dụng trong khoảng thời gian.
     */
    List<User> getAvailableDrivers(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * Lấy danh sách xe khả dụng trong khoảng thời gian.
     */
    List<Bus> getAvailableBuses(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * Lấy tài xế khả dụng cho trip cụ thể (có filter bằng lái + vị trí).
     */
    List<User> getAvailableDriversForTrip(Long tripId);

    /**
     * Lấy xe khả dụng cho trip cụ thể (có filter vị trí).
     */
    List<Bus> getAvailableBusesForTrip(Long tripId);
}
