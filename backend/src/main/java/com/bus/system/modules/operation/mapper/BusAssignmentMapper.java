package com.bus.system.modules.operation.mapper;

import com.bus.system.modules.operation.domain.BusAssignment;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.planning.domain.Route;
import com.bus.system.modules.operation.dto.response.BusAssignmentResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper cho BusAssignment entity ↔ DTO.
 */
@Component
public class BusAssignmentMapper {

    public BusAssignmentResponse toResponse(BusAssignment entity) {
        if (entity == null)
            return null;

        BusAssignmentResponse res = new BusAssignmentResponse();
        res.setId(entity.getId());
        res.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        res.setNotes(entity.getNotes());
        res.setCreatedAt(entity.getCreatedAt());

        // --- Bus ---
        if (entity.getBus() != null) {
            res.setBusId(entity.getBus().getId());
            res.setBusLicensePlate(entity.getBus().getLicensePlate());
            if (entity.getBus().getBusType() != null) {
                res.setBusTypeName(entity.getBus().getBusType().getName());
            }
        }

        // --- Depot ---
        if (entity.getStartDepot() != null) {
            res.setStartDepotId(entity.getStartDepot().getId());
            res.setStartDepotName(entity.getStartDepot().getName());
        }
        if (entity.getEndDepot() != null) {
            res.setEndDepotId(entity.getEndDepot().getId());
            res.setEndDepotName(entity.getEndDepot().getName());
        }

        // --- Schedule ---
        res.setScheduledStart(entity.getScheduledStart());
        res.setScheduledEnd(entity.getScheduledEnd());

        // --- Check-in ---
        res.setCheckInTime(entity.getCheckInTime());
        res.setCheckInOdometer(entity.getCheckInOdometer());
        res.setCheckInFuel(entity.getCheckInFuel());
        res.setCheckInNotes(entity.getCheckInNotes());
        if (entity.getCheckInBy() != null) {
            res.setCheckInByName(entity.getCheckInBy().getFullName());
        }

        // --- Check-out ---
        res.setCheckOutTime(entity.getCheckOutTime());
        res.setCheckOutOdometer(entity.getCheckOutOdometer());
        res.setCheckOutFuel(entity.getCheckOutFuel());
        res.setCheckOutNotes(entity.getCheckOutNotes());
        if (entity.getCheckOutBy() != null) {
            res.setCheckOutByName(entity.getCheckOutBy().getFullName());
        }

        // --- Trips ---
        if (entity.getTrips() != null) {
            res.setTrips(entity.getTrips().stream()
                    .map(this::toTripSummary)
                    .collect(Collectors.toList()));
        }

        return res;
    }

    public List<BusAssignmentResponse> toResponseList(List<BusAssignment> entities) {
        if (entities == null)
            return null;
        return entities.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Map Trip → TripSummary (sub-DTO bên trong BusAssignmentResponse).
     */
    private BusAssignmentResponse.TripSummary toTripSummary(Trip trip) {
        BusAssignmentResponse.TripSummary ts = new BusAssignmentResponse.TripSummary();
        ts.setId(trip.getId());
        ts.setCode(trip.getCode());
        ts.setStatus(trip.getStatus() != null ? trip.getStatus().name() : null);
        ts.setDepartureTime(trip.getStartDateTime());
        ts.setArrivalTime(trip.getExpectedArrivalTime());

        if (trip.getTripSchedule() != null && trip.getTripSchedule().getRoute() != null) {
            Route route = trip.getTripSchedule().getRoute();
            ts.setRouteName(route.getName());
            ts.setRouteCode(route.getCode());
            if (route.getDepartureStation() != null) {
                ts.setDepartureStationName(route.getDepartureStation().getName());
            }
            if (route.getArrivalStation() != null) {
                ts.setArrivalStationName(route.getArrivalStation().getName());
            }
        }

        trip.getMainDriver().ifPresent(driver -> ts.setDriverName(driver.getFullName()));

        return ts;
    }
}
