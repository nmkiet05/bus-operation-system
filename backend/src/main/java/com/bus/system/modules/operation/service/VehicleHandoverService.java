package com.bus.system.modules.operation.service;

import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.dto.response.VehicleHandoverResponse;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service quản lý biên bản bàn giao xe.
 * 
 * Nguyên tắc:
 * - Biên bản được tạo TỰ ĐỘNG khi Approve Trip hoặc khi đổi tài xế/xe.
 * - Không có phương thức tạo/sửa thủ công từ bên ngoài.
 */
public interface VehicleHandoverService {

        /**
         * Tự động tạo biên bản bàn giao khi chuyến được Approve.
         * 
         * @param trip Chuyến xe vừa được duyệt
         */
        void createHandoverForTrip(Trip trip);

        /**
         * Xử lý biên bản bàn giao khi thay đổi tài xế/xe.
         *
         * @param trip          Chuyến xe đang xử lý
         * @param oldDriverId   ID tài xế cũ (có thể null)
         * @param oldBusId      ID xe cũ (có thể null)
         * @param reason        Lý do thay đổi
         * @param isEmergency   Cờ khẩn cấp
         * @param requestedById ID người yêu cầu (từ TripChangeRequest.createdBy)
         */
        void processResourceChange(Trip trip, Long oldDriverId, Long oldBusId, String reason,
                        boolean isEmergency, Long requestedById);

        /**
         * Xử lý hậu kiểm Emergency.
         *
         * @param tripId       ID chuyến xe
         * @param approved     Duyệt hay từ chối
         * @param reviewNotes  Ghi chú của Admin
         * @param reviewedById ID Admin hậu kiểm
         */
        void reviewEmergencyHandover(Long tripId, boolean approved, String reviewNotes, Long reviewedById);

        /**
         * Truy vấn lịch sử bàn giao xe theo điều kiện lọc.
         *
         * @param driverId ID tài xế (tùy chọn)
         * @param busId    ID xe (tùy chọn)
         * @param fromDate Ngày bắt đầu (tùy chọn)
         * @param toDate   Ngày kết thúc (tùy chọn)
         * @return Danh sách biên bản bàn giao
         */
        List<VehicleHandoverResponse> getHandoverHistory(Long driverId, Long busId,
                        LocalDateTime fromDate, LocalDateTime toDate);

        /**
         * Lấy toàn bộ handover của một trip.
         *
         * @param tripId ID chuyến xe
         * @return Danh sách tất cả biên bản bàn giao (mọi trạng thái)
         */
        List<VehicleHandoverResponse> getHandoversByTripId(Long tripId);
}
