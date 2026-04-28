package com.bus.system.modules.operation.service.impl;

import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.fleet.repository.BusRepository;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.identity.repository.UserRepository;
import com.bus.system.modules.operation.domain.enums.HandoverStatus;
import com.bus.system.modules.operation.domain.QVehicleHandover;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.domain.VehicleHandover;
import com.bus.system.modules.operation.domain.enums.TripStatus;
import com.bus.system.modules.operation.dto.response.VehicleHandoverResponse;
import com.bus.system.modules.operation.mapper.VehicleHandoverMapper;
import com.bus.system.modules.operation.predicate.VehicleHandoverBuilder;
import com.bus.system.modules.operation.domain.enums.ViolationLevel;
import com.bus.system.modules.operation.repository.VehicleHandoverRepository;
import com.bus.system.modules.operation.service.VehicleHandoverService;
import com.querydsl.core.BooleanBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Service triển khai quản lý biên bản bàn giao xe.
 *
 * Nguyên tắc thiết kế:
 * - Biên bản được tạo TỰ ĐỘNG khi Approve Trip hoặc qua TripChangeRequest.
 * - Không có phương thức tạo/sửa thủ công từ bên ngoài.
 * - Audit Trail: Mọi thay đổi đều được ghi nhận đầy đủ.
 */
@Service
@RequiredArgsConstructor
public class VehicleHandoverServiceImpl implements VehicleHandoverService {

    private final VehicleHandoverRepository handoverRepository;
    private final BusRepository busRepository;
    private final UserRepository userRepository;
    private final VehicleHandoverMapper handoverMapper;

    /**
     * Tự động tạo biên bản bàn giao khi duyệt chuyến.
     */
    @Override
    @Transactional
    public void createHandoverForTrip(Trip trip) {
        // [Ngăn trùng lặp] Kiểm tra đã tồn tại biên bản cho chuyến này chưa
        boolean exists = handoverRepository.existsByTripIdAndStatusIn(trip.getId(),
                List.of(HandoverStatus.PENDING_HANDOVER, HandoverStatus.IN_PROGRESS));
        if (exists) {
            return; // Đã có rồi, không tạo nữa
        }

        Long driverId = trip.getMainDriver().map(User::getId).orElse(null);
        Long busId = trip.getBusId();

        // [Auto-close] Đóng handover cũ của driver/bus để tránh trigger overlap
        if (driverId != null) {
            closeOldHandovers(driverId, busId);
            // Flush NGAY sau khi đóng handover cũ, TRƯỚC khi INSERT handover mới.
            // Tránh: Hibernate defer UPDATEs → trigger check_handover_overlap
            // thấy handover cũ vẫn IN_PROGRESS khi INSERT mới → EXCEPTION.
            handoverRepository.flush();
        }

        HandoverStatus status = trip.getStatus() == com.bus.system.modules.operation.domain.enums.TripStatus.RUNNING 
                ? HandoverStatus.IN_PROGRESS 
                : HandoverStatus.PENDING_HANDOVER;

        createHandoverEntity(trip, driverId, busId, status, null, false, null);
    }

    /**
     * Auto-close các handover PENDING/IN_PROGRESS cũ theo driver hoặc bus.
     * Tránh conflict trigger check_handover_overlap().
     */
    private void closeOldHandovers(Long driverId, Long busId) {
        List<VehicleHandover> oldHandovers = handoverRepository.findOpenHandoversByDriverOrBus(driverId, busId);
        for (VehicleHandover h : oldHandovers) {
            h.setActualReturnTime(LocalDateTime.now());
            h.setStatus(HandoverStatus.COMPLETED);
            h.setStatusReason("[Auto-close] Đóng tự động khi duyệt chuyến mới");
            handoverRepository.save(h);
        }
    }

    /**
     * Xử lý biên bản bàn giao khi thay đổi tài xế/xe.
     */
    @Override
    @Transactional
    public void processResourceChange(Trip trip, Long oldDriverId, Long oldBusId,
            String reason, boolean isEmergency, Long requestedById) {
        // Tìm tất cả biên bản đang hoạt động
        List<VehicleHandover> activeHandovers = handoverRepository.findByTripIdAndStatusIn(trip.getId(),
                List.of(HandoverStatus.PENDING_HANDOVER, HandoverStatus.IN_PROGRESS));

        // [STRICT AUDIT] Đóng biên bản cũ — phải set actualReturnTime để partial unique
        // index (WHERE actual_return_time IS NULL) không conflict với bản ghi mới
        for (VehicleHandover h : activeHandovers) {
            h.setStatus(HandoverStatus.CANCELLED);
            h.setActualReturnTime(LocalDateTime.now()); // ← bắt buộc: giải phóng unique index
            String cancelReason = "[System Auto-Close] " + (reason != null ? reason : "Resource changed");
            h.setStatusReason(cancelReason);
            handoverRepository.save(h);
        }

        // Flush TRƯỚC khi INSERT mới — đảm bảo partial unique index đã được giải phóng
        handoverRepository.flush();

        HandoverStatus nextStatus = resolveHandoverStatusForTrip(trip);

        // Tạo biên bản mới cho tài xế/xe mới
        createHandoverEntity(trip,
                trip.getMainDriver().map(com.bus.system.modules.identity.domain.User::getId).orElse(null),
                trip.getBusId(),
                nextStatus, reason, isEmergency, requestedById);
    }

    /**
     * Hậu kiểm biên bản Emergency.
     */
    @Override
    @Transactional
    public void reviewEmergencyHandover(Long tripId, boolean approved, String reviewNotes, Long reviewedById) {
        // Tìm biên bản Emergency chưa được review
        List<VehicleHandover> emergencyHandovers = handoverRepository.findByTripIdAndStatusIn(tripId,
                List.of(HandoverStatus.PENDING_HANDOVER, HandoverStatus.IN_PROGRESS));

        for (VehicleHandover h : emergencyHandovers) {
            if (Boolean.TRUE.equals(h.getIsEmergency()) && h.getEmergencyReviewedBy() == null) {
                h.setEmergencyReviewedBy(reviewedById);
                h.setEmergencyReviewedAt(LocalDateTime.now());

                if (approved) {
                    // Clear violation
                    h.setViolationLevel(null);
                    h.setStatusReason(appendStatusReason(
                            h.getStatusReason(),
                            "[Reviewed: APPROVED] " + (reviewNotes != null ? reviewNotes : "")));
                } else {
                    // Upgrade violation
                    h.setViolationLevel(ViolationLevel.CRITICAL);
                    h.setStatusReason(appendStatusReason(
                            h.getStatusReason(),
                            "[Reviewed: REJECTED] " + (reviewNotes != null ? reviewNotes : "")));
                }

                handoverRepository.save(h);
            }
        }
    }

    /**
     * Truy vấn lịch sử bàn giao xe theo điều kiện lọc.
     */
    @Override
    @Transactional(readOnly = true)
    public List<VehicleHandoverResponse> getHandoverHistory(Long driverId, Long busId,
            LocalDateTime fromDate, LocalDateTime toDate) {
        BooleanBuilder predicate = VehicleHandoverBuilder.buildHandoverHistoryPredicate(
                driverId, busId, fromDate, toDate);

        QVehicleHandover qHandover = QVehicleHandover.vehicleHandover;
        Iterable<VehicleHandover> result = handoverRepository.findAll(predicate, qHandover.handoverTime.desc());

        List<VehicleHandover> handovers = new ArrayList<>();
        result.forEach(handovers::add);

        return handoverMapper.toResponseList(handovers);
    }

    /**
     * Lấy toàn bộ handover của một trip (mọi trạng thái).
     */
    @Override
    @Transactional(readOnly = true)
    public List<VehicleHandoverResponse> getHandoversByTripId(Long tripId) {
        List<VehicleHandover> handovers = handoverRepository.findByTripIdOrderByHandoverTimeDesc(tripId);
        return handoverMapper.toResponseList(handovers);
    }

    // ==================== PRIVATE HELPER ====================

    /**
     * Tạo thực thể VehicleHandover mới.
     */
    private void createHandoverEntity(Trip trip, Long driverId, Long busId, HandoverStatus status,
            String reason, boolean isEmergency, Long requestedById) {
        // Skip nếu thiếu thông tin
        if (driverId == null || busId == null) {
            return;
        }

        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Xe", "id", busId));
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài xế", "id", driverId));

        VehicleHandover handover = handoverMapper.createEntity(trip, bus, driver, status, reason, isEmergency,
                requestedById);

        handoverRepository.save(handover);
    }

    private HandoverStatus resolveHandoverStatusForTrip(Trip trip) {
        return trip.getStatus() == TripStatus.RUNNING
                ? HandoverStatus.IN_PROGRESS
                : HandoverStatus.PENDING_HANDOVER;
    }

    private String appendStatusReason(String current, String appended) {
        if (appended == null || appended.isBlank()) {
            return current;
        }
        if (current == null || current.isBlank()) {
            return appended;
        }
        return current + " | " + appended;
    }
}
