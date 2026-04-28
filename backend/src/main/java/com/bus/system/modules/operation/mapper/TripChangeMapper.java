package com.bus.system.modules.operation.mapper;

import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.fleet.repository.BusRepository;
import com.bus.system.modules.operation.domain.TripChange;
import com.bus.system.modules.operation.dto.response.TripChangeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TripChangeMapper {

    private final BusRepository busRepository;

    public TripChangeResponse toResponse(TripChange entity) {
        if (entity == null) {
            return null;
        }

        String licensePlate = "N/A";
        if (entity.getTrip() != null && entity.getTrip().getBusId() != null) {
            licensePlate = busRepository.findById(entity.getTrip().getBusId())
                    .map(Bus::getLicensePlate)
                    .orElse("N/A");
        }

        return TripChangeResponse.builder()
                .id(entity.getId())
                .tripId(entity.getTrip() != null ? entity.getTrip().getId() : null)
                .routeName(entity.getTrip() != null && entity.getTrip().getTripSchedule() != null
                        && entity.getTrip().getTripSchedule().getRoute() != null
                                ? entity.getTrip().getTripSchedule().getRoute().getName()
                                : "N/A")
                .licensePlate(licensePlate)
                .changeType(entity.getChangeType())
                .oldDriverId(entity.getOldDriver() != null ? entity.getOldDriver().getId() : null)
                .oldDriverName(entity.getOldDriver() != null ? entity.getOldDriver().getFullName() : "N/A")
                .newDriverId(entity.getNewDriver() != null ? entity.getNewDriver().getId() : null)
                .newDriverName(entity.getNewDriver() != null ? entity.getNewDriver().getFullName() : "N/A")
                .oldBusId(entity.getOldBus() != null ? entity.getOldBus().getId() : null)
                .newBusId(entity.getNewBus() != null ? entity.getNewBus().getId() : null)
                .requestReason(entity.getRequestReason())
                .status(entity.getStatus())
                .isEmergency(entity.getIsEmergency())
                .urgencyZone(entity.getUrgencyZone())
                .incidentType(entity.getIncidentType())
                .incidentGps(entity.getIncidentGps())
                .createdBy(entity.getCreatedBy())
                .approvedBy(entity.getApprovedBy())
                .rejectedReason(entity.getRejectedReason())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
