package com.bus.system.modules.operation.service;

import com.bus.system.modules.operation.domain.TripChange;
import com.bus.system.modules.operation.dto.request.CreateTripChange;

/**
 * Service quản lý yêu cầu thay đổi tài xế/xe — 5 Vùng thời gian.
 *
 * STANDARD (>60') → URGENT (60'-15') → CRITICAL (<15') → DEPARTED → MID_ROUTE
 */
public interface TripChangeService {

        // ==================== TẠO YÊU CẦU ====================

        /**
         * Tạo yêu cầu — tự động phân vùng theo thời gian còn lại trước khởi hành.
         *
         * STANDARD: PENDING → admin duyệt
         * URGENT: PENDING → timeout 10' → ESCALATED auto-execute
         * CRITICAL: Auto-execute → hậu kiểm
         * DEPARTED: Auto-execute → hậu kiểm, cấm reject
         */
        TripChange createZonedRequest(CreateTripChange request, Long createdByUserId);

        /**
         * Báo sự cố dọc đường (Vùng 5 MID_ROUTE).
         * Auto-execute + ghi incident_type/gps, admin cấm reject.
         */
        TripChange createIncidentRequest(CreateTripChange request, String incidentType,
                        String incidentGps, Long createdByUserId);

        // ==================== ADMIN ACTIONS ====================

        void approveRequest(Long requestId, Long approvedByUserId);

        void rejectRequest(Long requestId, String reason, Long rejectedByUserId);

        /**
         * Hậu kiểm Emergency (Vùng 3-5).
         * Vùng 4+5: admin KHÔNG thể reject.
         */
        void reviewEmergencyRequest(Long requestId, boolean approved,
                        String reviewNotes, Long reviewedByUserId);

        void rollbackRequest(Long requestId, Long rollbackByUserId);

        void resetAntiSpamForUser(Long userId, Long adminUserId);
}
