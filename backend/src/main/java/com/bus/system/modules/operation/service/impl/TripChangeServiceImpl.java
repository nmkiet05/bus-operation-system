package com.bus.system.modules.operation.service.impl;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.modules.operation.config.OperationProperties;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.domain.TripChange;
import com.bus.system.modules.operation.domain.enums.ChangeUrgencyZone;
import com.bus.system.modules.operation.domain.enums.TripChangeType;
import com.bus.system.modules.operation.dto.request.CreateTripChange;
import com.bus.system.modules.operation.repository.TripChangeRepository;
import com.bus.system.modules.operation.service.TripChangeService;
import com.bus.system.modules.operation.service.VehicleHandoverService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Orchestrator cho TripChange — điều phối flow
 * tạo/duyệt/reject/review/rollback.
 * Delegate validation → TripChangeValidator
 * Delegate execute/rollback → TripChangeExecutor
 * Delegate resolve entity → TripChangeResolver
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TripChangeServiceImpl implements TripChangeService {

    private final TripChangeRepository requestRepository;
    private final TripChangeValidator validator;
    private final TripChangeExecutor executor;
    private final TripChangeResolver resolver;
    private final OperationProperties operationProperties;
    private final VehicleHandoverService vehicleHandoverService;

    // ==================== ZONE-BASED FLOW ====================

    @Override
    @Transactional
    public TripChange createZonedRequest(CreateTripChange dto, Long createdByUserId) {
        validator.validateAntiSpam(dto.getTripId(), createdByUserId);

        Trip trip = resolver.findTrip(dto.getTripId());
        validator.validateTripCanChange(trip);

        ChangeUrgencyZone zone = resolver.determineZone(trip);
        log.info("TripChange Trip#{}: Zone={}", trip.getId(), zone);

        // Tạo request qua entity factory
        TripChange request = TripChange.create(trip, dto.getChangeType(),
                dto.getReason(), zone, createdByUserId);

        // Resolve old resources
        resolver.resolveOldCrewMember(request, trip);
        resolver.resolveOldBus(request, trip);

        // Validate + resolve new resources
        if (request.isCrewChange()) {
            validator.validateNewDriverRequired(dto);
            resolver.resolveNewDriver(request, dto);
        }
        if (dto.getChangeType() == TripChangeType.REPLACE_BUS) {
            validator.validateNewBusRequired(dto);
            resolver.resolveNewBus(request, dto);
        }

        request = requestRepository.saveAndFlush(request);

        // Luật lao động: BLOCK ở MỌI vùng
        if (request.isCrewChange() && dto.getNewDriverId() != null) {
            validator.validateAndEnforceLaborLaw(trip, dto.getNewDriverId());
        }

        // Xử lý theo vùng
        switch (zone) {
            case STANDARD -> log.info("STANDARD: #{} chờ admin duyệt", request.getId());
            case URGENT -> log.warn("URGENT: #{} chờ admin {}' rồi auto-escalate",
                    request.getId(), operationProperties.getTripChange().getEscalationTimeoutMinutes());
            case CRITICAL, DEPARTED -> {
                executor.executeCrewOrBusChange(request);
                log.warn("{}: #{} auto-execute, chờ hậu kiểm", zone, request.getId());
            }
            default -> throw new BusinessException("INVALID_ZONE",
                    "Vùng " + zone + " cần dùng createIncidentRequest()");
        }

        return request;
    }

    @Override
    @Transactional
    public TripChange createIncidentRequest(CreateTripChange dto, String incidentType,
            String incidentGps, Long createdByUserId) {
        validator.validateAntiSpam(dto.getTripId(), createdByUserId);

        Trip trip = resolver.findTrip(dto.getTripId());
        validator.validateTripRunning(trip);

        // Tạo request qua entity factory
        TripChange request = TripChange.createIncident(trip, dto.getChangeType(), dto.getReason(),
                incidentType, incidentGps, createdByUserId);
        resolver.resolveOldCrewMember(request, trip);

        if (request.isCrewChange()) {
            validator.validateNewDriverRequired(dto);
            resolver.resolveNewDriver(request, dto);
        }

        request = requestRepository.saveAndFlush(request);

        // Luật lao động: BLOCK ngay cả sự cố
        if (request.isCrewChange() && dto.getNewDriverId() != null) {
            validator.validateAndEnforceLaborLaw(trip, dto.getNewDriverId());
        }

        executor.executeCrewOrBusChange(request);

        log.warn("MID_ROUTE: #{} type={} gps={} — auto-execute, cấm reject",
                request.getId(), incidentType, incidentGps);
        return request;
    }

    // ==================== ADMIN ACTIONS ====================

    @Override
    @Transactional
    public void approveRequest(Long requestId, Long approvedByUserId) {
        TripChange request = resolver.findRequest(requestId);
        validator.validateRequestPending(request);
        validator.validateApproveNotAutoExecute(request);

        executor.executeCrewOrBusChange(request);
        request.approve(approvedByUserId);
        requestRepository.save(request);
        log.info("Duyệt #{} bởi Admin {}", requestId, approvedByUserId);
    }

    @Override
    @Transactional
    public void rejectRequest(Long requestId, String reason, Long rejectedByUserId) {
        TripChange request = resolver.findRequest(requestId);
        validator.validateRequestPending(request);
        validator.validateRejectAllowed(request);

        request.reject(reason, rejectedByUserId);
        requestRepository.save(request);
        log.info("Từ chối #{} bởi Admin {}: {}", requestId, rejectedByUserId, reason);
    }

    @Override
    @Transactional
    public void reviewEmergencyRequest(Long requestId, boolean approved, String reviewNotes,
            Long reviewedByUserId) {
        TripChange request = resolver.findRequest(requestId);
        validator.validateEmergencyReview(request);

        request.review(approved, reviewNotes, reviewedByUserId);
        requestRepository.save(request);

        vehicleHandoverService.reviewEmergencyHandover(
                request.getTrip().getId(), approved, reviewNotes, reviewedByUserId);

        log.info("Hậu kiểm #{}: {} bởi Admin {} (Zone={})", requestId,
                approved ? "APPROVED" : "REJECTED", reviewedByUserId, request.getUrgencyZone());
    }

    @Override
    @Transactional
    public void rollbackRequest(Long requestId, Long rollbackByUserId) {
        TripChange request = resolver.findRequest(requestId);
        validator.validateRollbackWindow(request);

        executor.rollbackCrewOrBusChange(request, rollbackByUserId);

        request.cancel();
        requestRepository.save(request);
        log.warn("ROLLBACK: #{} hoàn tác bởi Admin {}", requestId, rollbackByUserId);
    }

    @Override
    public void resetAntiSpamForUser(Long userId, Long adminUserId) {
        validator.resetAntiSpam(userId);
        log.info("Admin {} reset Anti-spam cho user {}", adminUserId, userId);
    }
}
