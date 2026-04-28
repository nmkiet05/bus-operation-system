package com.bus.system.modules.operation.service;

import com.bus.system.modules.operation.domain.DriverAssignment;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.domain.enums.CrewRole;

import java.util.List;

/**
 * Service quản lý Phân công tài xế (Driver Assignment).
 * [Phase 3] Tạo phân công khi approve trip. Swap khi đổi tài xế giữa đường.
 */
public interface DriverAssignmentService {

    /**
     * Gán tài xế vào chuyến với role cụ thể.
     */
    DriverAssignment assignDriver(Trip trip, Long driverId, CrewRole role);

    /**
     * Swap tài xế giữa đường: old → ENDED_EARLY, new → ACTIVE.
     */
    DriverAssignment replaceDriver(Long driverAssignmentId, Long newDriverId);

    /**
     * Hủy phân công tài xế (cascade khi swap).
     */
    void cancelAssignment(Long driverAssignmentId);

    /**
     * Lấy crew đang ACTIVE của trip.
     */
    List<DriverAssignment> getActiveCrew(Long tripId);

    /**
     * Gán batch nhân sự vào chuyến — Distributed Lock (Redisson).
     * Acquire Redis lock trên key "crew-lock:trip:{tripId}" trước khi validate +
     * insert.
     * Kiểm tra duplicate, driver overlap trước khi gán.
     * Toàn bộ batch trong 1 transaction — nếu 1 lỗi → rollback hết.
     *
     * @param tripId      ID chuyến xe
     * @param assignments Danh sách {driverId, role}
     * @return Danh sách DriverAssignment đã tạo
     */
    List<DriverAssignment> assignBatchCrew(Long tripId, List<CrewAssignItem> assignments);

    /**
     * DTO đơn giản cho batch assign — tránh coupling với Controller DTO.
     */
    record CrewAssignItem(Long driverId, CrewRole role) {
    }
}
