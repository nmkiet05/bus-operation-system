package com.bus.system.modules.operation.mapper;

import com.bus.system.modules.operation.domain.enums.HandoverStatus;
import com.bus.system.modules.operation.domain.enums.HandoverType;
import com.bus.system.modules.operation.domain.enums.ViolationLevel;
import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.domain.VehicleHandover;
import com.bus.system.modules.operation.dto.response.VehicleHandoverResponse;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper cho VehicleHandover entity.
 * 
 * Lưu ý: Biên bản được tạo tự động qua Service, không qua mapping từ DTO.
 */
@Component
public class VehicleHandoverMapper {

    public VehicleHandoverResponse toResponse(VehicleHandover entity) {
        if (entity == null)
            return null;
        VehicleHandoverResponse response = new VehicleHandoverResponse();
        response.setId(entity.getId());
        response.setBusId(entity.getBus() != null ? entity.getBus().getId() : null);
        response.setLicensePlate(entity.getBus() != null ? entity.getBus().getLicensePlate() : null);
        response.setDriverId(entity.getDriver() != null ? entity.getDriver().getId() : null);
        response.setDriverName(entity.getDriver() != null ? entity.getDriver().getFullName() : null);
        response.setHandoverType(entity.getHandoverType());
        response.setOdometer(entity.getOdometer());
        response.setFuelLevel(entity.getFuelLevel());
        response.setNotes(entity.getNotes());
        response.setHandoverTime(entity.getHandoverTime());

        // --- Status & Emergency ---
        response.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        response.setStatusReason(entity.getStatusReason());
        response.setIsEmergency(entity.getIsEmergency());
        response.setViolationLevel(entity.getViolationLevel() != null ? entity.getViolationLevel().name() : null);
        response.setEmergencyReviewedAt(entity.getEmergencyReviewedAt());

        // --- Trip ---
        if (entity.getTrip() != null) {
            response.setTripId(entity.getTrip().getId());
            response.setTripCode(entity.getTrip().getCode());
        }

        // --- Time tracking ---
        response.setScheduledReturnTime(entity.getScheduledReturnTime());
        response.setActualReturnTime(entity.getActualReturnTime());
        response.setCreatedAt(entity.getCreatedAt());

        return response;
    }

    public List<VehicleHandoverResponse> toResponseList(List<VehicleHandover> entities) {
        if (entities == null)
            return null;
        return entities.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Tạo Entity mới từ các thông tin đầu vào.
     * Centralized logic creation.
     */
    public VehicleHandover createEntity(Trip trip, Bus bus, User driver,
            HandoverStatus status, String reason, boolean isEmergency, Long requestedById) {
        VehicleHandover handover = new VehicleHandover();
        handover.setTrip(trip);
        handover.setBus(bus);
        handover.setDriver(driver);
        handover.setHandoverTime(LocalDateTime.now());
        handover.setHandoverType(HandoverType.RECEIVE);
        handover.setStatus(status);
        handover.setStatusReason(reason);
        handover.setIsEmergency(isEmergency);

        if (Boolean.TRUE.equals(isEmergency)) {
            handover.setEmergencyRequestBy(requestedById);
            handover.setViolationLevel(ViolationLevel.WARNING);
        }

        return handover;
    }
}
