package com.bus.system.modules.operation.service.impl;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.modules.operation.config.OperationProperties;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.domain.TripChange;
import com.bus.system.modules.operation.domain.enums.ChangeRequestStatus;
import com.bus.system.modules.operation.domain.enums.TripChangeType;
import com.bus.system.modules.operation.domain.enums.TripStatus;
import com.bus.system.modules.operation.domain.service.DriverDutyService;
import com.bus.system.modules.operation.domain.service.LaborLawResult;
import com.bus.system.modules.operation.dto.request.CreateTripChange;
import com.bus.system.modules.operation.repository.TripChangeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Validator cho TripChange — gom toàn bộ business rule validation.
 * Tách từ TripChangeServiceImpl để tuân thủ SRP.
 */
@Component
@RequiredArgsConstructor
@Slf4j
class TripChangeValidator {

    private final TripChangeRepository requestRepository;
    private final OperationProperties operationProperties;
    private final DriverDutyService driverDutyService;

    /** Anti-spam state — thread-safe, auto-cleanup on remove */
    private final ConcurrentHashMap<Long, Boolean> antiSpamResetUsers = new ConcurrentHashMap<>();

    // ==================== TRIP STATUS ====================

    void validateTripCanChange(Trip trip) {
        if (trip.getStatus() != TripStatus.APPROVED && trip.getStatus() != TripStatus.RUNNING) {
            throw new BusinessException("INVALID_STATUS",
                    "Chỉ tạo yêu cầu cho chuyến đã duyệt hoặc đang chạy.");
        }
    }

    void validateTripRunning(Trip trip) {
        if (trip.getStatus() != TripStatus.RUNNING) {
            throw new BusinessException("INVALID_STATUS",
                    "Sự cố dọc đường chỉ áp dụng cho chuyến đang chạy (RUNNING).");
        }
    }

    // ==================== REQUEST STATUS ====================

    void validateRequestPending(TripChange request) {
        if (request.getStatus() != ChangeRequestStatus.PENDING) {
            throw new BusinessException("INVALID_STATE", "Yêu cầu không ở trạng thái PENDING.");
        }
    }

    void validateEmergencyReview(TripChange request) {
        if (!Boolean.TRUE.equals(request.getIsEmergency())) {
            throw new BusinessException("NOT_EMERGENCY", "Yêu cầu này không phải khẩn cấp.");
        }
    }

    void validateApproveNotAutoExecute(TripChange request) {
        if (request.getUrgencyZone() != null && request.getUrgencyZone().isAutoExecute()) {
            throw new BusinessException("INVALID_OPERATION",
                    "Yêu cầu đã auto-execute. Dùng reviewEmergencyRequest để hậu kiểm.");
        }
    }

    void validateRejectAllowed(TripChange request) {
        if (request.getUrgencyZone() != null && !request.getUrgencyZone().isRejectAllowed()) {
            throw new BusinessException("CANNOT_REJECT_ZONE",
                    String.format("Vùng %s không cho phép từ chối. Vui lòng dùng hậu kiểm.",
                            request.getUrgencyZone()));
        }
    }

    void validateRollbackWindow(TripChange request) {
        if (request.getStatus() != ChangeRequestStatus.APPROVED) {
            throw new BusinessException("INVALID_STATUS", "Ch\u1ec9 rollback y\u00eau c\u1ea7u \u0111\u00e3 duy\u1ec7t.");
        }
        Trip trip = request.getTrip();
        if (trip.getStartDateTime() == null) {
            throw new BusinessException("MISSING_DEPARTURE", "Chuy\u1ebfn ch\u01b0a c\u00f3 th\u1eddi gian kh\u1edfi h\u00e0nh.");
        }
        long minutesToDeparture = Duration.between(LocalDateTime.now(), trip.getStartDateTime()).toMinutes();
        int window = operationProperties.getTripChange().getRollbackWindowMinutes();

        // Ch\u1ec9 ch\u1eb7n khi chuy\u1ebfn s\u1eafp xu\u1ea5t ph\u00e1t (trong kho\u1ea3ng 0 \u2192 window ph\u00fat t\u1edbi).
        // N\u1ebfu ch\u1ea1y r\u1ed3i (minutesToDeparture < 0) ho\u1eb7c c\u00f2n s\u1edbm (> window): cho ph\u00e9p rollback.
        if (minutesToDeparture >= 0 && minutesToDeparture < window) {
            throw new BusinessException("ROLLBACK_WINDOW_BLOCKED",
                    String.format("Kh\u00f4ng th\u1ec3 ho\u00e0n t\u00e1c: ch\u1ec9 c\u00f2n %d ph\u00fat \u0111\u1ebfn gi\u1edd xu\u1ea5t b\u1ebfn (c\u1ea7n t\u1ed1i thi\u1ec3u %d ph\u00fat).", minutesToDeparture, window));
        }
    }

    // ==================== INPUT VALIDATION ====================

    void validateNewDriverRequired(CreateTripChange dto) {
        if (dto.getNewDriverId() == null) {
            throw new BusinessException("MISSING_DRIVER", "Phải chọn tài xế/nhân viên mới.");
        }
    }

    void validateNewBusRequired(CreateTripChange dto) {
        if (dto.getNewBusId() == null) {
            throw new BusinessException("MISSING_BUS", "Phải chọn xe mới.");
        }
    }

    // ==================== LABOR LAW ====================

    /**
     * Validate luật lao động: LUÔN BLOCK nếu vi phạm.
     * Frontend dùng API check-compliance riêng để hiển thị chuyến
     * available/disabled.
     */
    void validateAndEnforceLaborLaw(Trip trip, Long newDriverId) {
        LaborLawResult result = driverDutyService.validateLaborLaw(
                newDriverId, trip.getDepartureDate(),
                trip.getActualDepartureTime(), trip.getRoute(), trip.getId());

        if (!result.isCompliant()) {
            throw new BusinessException(result.getViolationType(),
                    String.format("Vi phạm luật lao động: vượt %d phút/tuần. " +
                            "Vui lòng gỡ bớt chuyến tương lai của tài xế rồi thử lại.",
                            result.getExcessMinutes()));
        }
    }

    // ==================== ANTI-SPAM ====================

    void validateAntiSpam(Long tripId, Long userId) {
        if (antiSpamResetUsers.remove(userId) != null)
            return;

        int cooldown = operationProperties.getTripChange().getAntiSpamCooldownMinutes();

        // Check per-trip: cùng chuyến
        requestRepository.findTopByTripIdOrderByCreatedAtDesc(tripId).ifPresent(last -> {
            long gap = Duration.between(last.getCreatedAt(), LocalDateTime.now()).toMinutes();
            if (gap < cooldown) {
                throw new BusinessException("ANTI_SPAM",
                        String.format("Chuyến này vừa có yêu cầu. Vui lòng chờ %d phút.", cooldown - gap));
            }
        });

        // Check per-user: cùng người gửi (chặn spam nhiều chuyến)
        requestRepository.findTopByCreatedByOrderByCreatedAtDesc(userId).ifPresent(last -> {
            long gap = Duration.between(last.getCreatedAt(), LocalDateTime.now()).toMinutes();
            if (gap < cooldown) {
                throw new BusinessException("ANTI_SPAM",
                        String.format("Bạn vừa gửi yêu cầu khác. Vui lòng chờ %d phút.", cooldown - gap));
            }
        });
    }

    void resetAntiSpam(Long userId) {
        antiSpamResetUsers.put(userId, Boolean.TRUE);
    }
}
