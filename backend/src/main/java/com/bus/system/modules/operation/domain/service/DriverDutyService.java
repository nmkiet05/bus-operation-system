package com.bus.system.modules.operation.domain.service;

import com.bus.system.modules.operation.dto.response.DriverTripComplianceResponse;
import com.bus.system.modules.planning.domain.Route;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Interface cho dịch vụ kiểm tra nghiệp vụ liên quan đến Luật & Trách nhiệm lái
 * xe.
 * Nghị định 10/2020/NĐ-CP về kinh doanh vận tải.
 */
public interface DriverDutyService {

        /**
         * Validate luật lao động thống nhất cho MỌI vùng.
         * Daily limit (10h, 4h liên tục): throws BusinessException ngay.
         * Weekly limit (48h): trả LaborLawResult → caller BLOCK.
         * Frontend dùng API riêng (/compliance) để lấy danh sách chuyến.
         */
        LaborLawResult validateLaborLaw(Long driverId, LocalDate tripDate,
                        LocalTime tripDepartureTime, Route route, Long excludeTripId);

        // ==================== INFER METHODS ====================

        /**
         * Suy vị trí Bãi Xe (Depot) hiện tại của xe.
         * Logic: Last BusAssignment COMPLETED → end_depot_id.
         * Dùng cho phân công bus: xe ở HN không gán trip HCM.
         *
         * @return Depot ID hoặc null nếu chưa có assignment nào
         */
        Long inferCurrentBusDepotId(Long busId, LocalDateTime beforeTime);

        // ==================== COMPLIANCE CHECK ====================

        /**
         * Lấy danh sách chuyến tương lai của tài xế + trạng thái compliance.
         * Frontend hiển thị: canUnassign=true → enable, false → disable + reason.
         */
        DriverTripComplianceResponse getDriverFutureTripsCompliance(
                        Long driverId, LocalDate fromDate, LocalDate toDate);

        /**
         * Kiểm tra compliance nếu gán driver vào trip cụ thể.
         * Frontend gọi trước khi submit để hiển thị bảng chuyến cần gỡ.
         */
        LaborLawResult checkAssignmentCompliance(Long tripId, Long newDriverId);
}
