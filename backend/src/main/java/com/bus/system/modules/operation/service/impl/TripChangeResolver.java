package com.bus.system.modules.operation.service.impl;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.fleet.repository.BusRepository;
import com.bus.system.modules.identity.repository.UserRepository;
import com.bus.system.modules.operation.config.OperationProperties;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.domain.TripChange;
import com.bus.system.modules.operation.domain.enums.ChangeUrgencyZone;
import com.bus.system.modules.operation.domain.enums.DriverAssignmentStatus;
import com.bus.system.modules.operation.domain.enums.TripChangeType;
import com.bus.system.modules.operation.domain.enums.TripStatus;
import com.bus.system.modules.operation.dto.request.CreateTripChange;
import com.bus.system.modules.operation.repository.DriverAssignmentRepository;
import com.bus.system.modules.operation.repository.TripChangeRepository;
import com.bus.system.modules.operation.repository.TripRepository;
import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.planning.contract.RegistrationStatus;
import com.bus.system.modules.planning.repository.RouteRegistrationRepository;
import com.bus.system.modules.planning.repository.ScheduleBusTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Resolver cho TripChange — tìm + set entity vào request.
 * KHÔNG chứa business validation — chỉ resolve thuần.
 * Tách từ TripChangeServiceImpl để tuân thủ SRP.
 */
@Component
@RequiredArgsConstructor
@Slf4j
class TripChangeResolver {

    private final TripRepository tripRepository;
    private final TripChangeRepository requestRepository;
    private final UserRepository userRepository;
    private final BusRepository busRepository;
    private final DriverAssignmentRepository driverAssignmentRepository;
    private final OperationProperties operationProperties;
    private final RouteRegistrationRepository routeRegistrationRepository;
    private final ScheduleBusTypeRepository scheduleBusTypeRepository;

    // ==================== FIND ====================

    Trip findTrip(Long tripId) {
        return tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Chuyến xe", "id", tripId));
    }

    TripChange findRequest(Long requestId) {
        return requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu", "id", requestId));
    }

    // ==================== RESOLVE OLD ====================

    void resolveOldCrewMember(TripChange request, Trip trip) {
        var targetRole = request.getChangeType().toCrewRole();
        driverAssignmentRepository.findByTripIdAndStatus(trip.getId(), DriverAssignmentStatus.ACTIVE)
                .stream()
                .filter(da -> da.getRole() == targetRole)
                .findFirst()
                .ifPresent(da -> request.assignOldDriver(da.getDriver()));
    }

    void resolveOldBus(TripChange request, Trip trip) {
        if (trip.getBusId() != null) {
            request.assignOldBus(busRepository.findById(trip.getBusId()).orElse(null));
        }
    }

    // ==================== RESOLVE NEW ====================

    /**
     * Resolve new driver — validator đã check null trước.
     */
    void resolveNewDriver(TripChange request, CreateTripChange dto) {
        if (request.isCrewChange() && dto.getNewDriverId() != null) {
            request.assignNewDriver(userRepository.findById(dto.getNewDriverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Tài xế", "id", dto.getNewDriverId())));
        }
    }

    /**
     * Resolve new bus — validator đã check null trước.
     */
    void resolveNewBus(TripChange request, CreateTripChange dto) {
        if (dto.getChangeType() == TripChangeType.REPLACE_BUS && dto.getNewBusId() != null) {
            Bus newBus = busRepository.findById(dto.getNewBusId())
                    .orElseThrow(() -> new ResourceNotFoundException("Xe", "id", dto.getNewBusId()));

            // Validate xe swap phải đăng ký tuyến
            validateSwapBusRegistered(request.getTrip(), dto.getNewBusId());
            // Validate loại xe phù hợp lịch chạy
            validateSwapBusType(request.getTrip(), newBus);

            request.assignNewBus(newBus);
        }
    }

    /**
     * Validate xe thay thế phải đăng ký cùng tuyến.
     * Nếu tuyến chưa có đăng ký → bỏ qua (fallback).
     */
    private void validateSwapBusRegistered(Trip trip, Long newBusId) {
        if (trip == null)
            return;
        Long routeId = trip.getRouteId();
        var registered = routeRegistrationRepository.findActiveBusIdsByRouteId(routeId);
        if (registered.isEmpty())
            return; // Chưa có đăng ký → bỏ qua

        if (!routeRegistrationRepository.existsByRouteIdAndBusIdAndStatus(
                routeId, newBusId, RegistrationStatus.ACTIVE)) {
            throw new BusinessException("BUS_NOT_REGISTERED",
                    "Xe thay thế chưa đăng ký khai thác tuyến này.");
        }
    }

    /**
     * Validate loại xe thay thế phù hợp lịch chạy.
     * Nếu lịch chưa có quy định loại xe → bỏ qua.
     */
    private void validateSwapBusType(Trip trip, Bus newBus) {
        if (trip == null || trip.getTripSchedule() == null)
            return;

        List<Long> allowedBusTypeIds = scheduleBusTypeRepository
                .findEffectiveBusTypeIdsByScheduleId(trip.getTripSchedule().getId());

        if (allowedBusTypeIds.isEmpty())
            return;

        if (newBus.getBusType() == null || !allowedBusTypeIds.contains(newBus.getBusType().getId())) {
            throw new BusinessException("BUS_TYPE_NOT_ALLOWED",
                    "Loại xe thay thế không phù hợp với lịch chạy.");
        }
    }

    // ==================== ZONE DETECTION ====================

    ChangeUrgencyZone determineZone(Trip trip) {
        if (trip.getStatus() == TripStatus.RUNNING || trip.getStatus() == TripStatus.COMPLETED) {
            return ChangeUrgencyZone.DEPARTED;
        }

        LocalDateTime departure = trip.getStartDateTime();
        if (departure == null)
            return ChangeUrgencyZone.STANDARD;

        long minutes = Duration.between(LocalDateTime.now(), departure).toMinutes();
        int urgentWindow = operationProperties.getTripChange().getUrgentWindowMinutes();
        int handoverGap = operationProperties.getTripChange().getHandoverGapMinutes();

        if (minutes > urgentWindow)
            return ChangeUrgencyZone.STANDARD;
        if (minutes > handoverGap)
            return ChangeUrgencyZone.URGENT;
        return ChangeUrgencyZone.CRITICAL;
    }
}
