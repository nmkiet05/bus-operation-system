package com.bus.system.modules.operation.service;

import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.dto.request.CreateBusAssignmentRequest;
import com.bus.system.modules.operation.dto.request.UpdateBusAssignmentRequest;
import com.bus.system.modules.operation.dto.response.BusAssignmentResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Service quản lý Ca xe (Bus Assignment).
 * Tạo/gắn bus_assignment khi approve trip. CHECK-IN/OUT xe tại bãi.
 */
public interface BusAssignmentService {

        /**
         * Tạo hoặc gắn trip vào bus_assignment.
         * Cùng bus + cùng ngày → gắn vào ca có sẵn. Khác → tạo mới.
         */
        void attachTripToBusAssignment(Trip trip);

        /**
         * Tạo Ca xe thủ công (từ trang Ca Xe).
         */
        BusAssignmentResponse createBusAssignment(CreateBusAssignmentRequest request);

        /**
         * Danh sách Ca xe theo filter (ngày, xe).
         */
        List<BusAssignmentResponse> listBusAssignments(LocalDate date, Long busId);

        /**
         * Gán trip vào ca xe cụ thể.
         */
        BusAssignmentResponse assignTripToAssignment(Long busAssignmentId, Long tripId);

        /**
         * CHECK-IN xe tại bãi (ODO, fuel, quản bãi xác nhận xuất bãi).
         */
        void checkInVehicle(Long busAssignmentId, BigDecimal odometer, Integer fuelLevel,
                        String notes, Long byUserId, Long depotId);

        /**
         * CHECK-OUT xe tại bãi (ODO, fuel, quản bãi xác nhận nhập bãi).
         */
        void checkOutVehicle(Long busAssignmentId, BigDecimal odometer, Integer fuelLevel,
                        String notes, Long byUserId, Long depotId);

        /**
         * Kết thúc ca xe sớm (Emergency: đổi xe giữa đường).
         */
        void endEarly(Long busAssignmentId);

        /**
         * Gỡ trip khỏi ca xe (unassign).
         */
        BusAssignmentResponse unassignTripFromAssignment(Long busAssignmentId, Long tripId);

        /**
         * Cập nhật Ca xe (thời gian, ghi chú).
         */
        BusAssignmentResponse updateBusAssignment(Long busAssignmentId, UpdateBusAssignmentRequest request);
}
