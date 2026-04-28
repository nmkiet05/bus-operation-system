package com.bus.system.modules.sales.mapper;

import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.planning.domain.PickupPoint;
import com.bus.system.modules.planning.domain.Route;
import com.bus.system.modules.planning.domain.TripSchedule;
import com.bus.system.modules.sales.domain.Booking;
import com.bus.system.modules.sales.domain.Ticket;
import com.bus.system.modules.sales.dto.response.TicketResponse;
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.Optional;

/**
 * Mapper cho Ticket Entity <-> DTO
 */
@Component
public class TicketMapper {

    /**
     * Convert Ticket entity -> TicketResponse DTO (Enriched)
     */
    public TicketResponse toResponse(Ticket ticket) {
        if (Objects.isNull(ticket)) {
            return null;
        }

        TicketResponse.TicketResponseBuilder builder = TicketResponse.builder()
                .id(ticket.getId())
                .bookingId(Optional.ofNullable(ticket.getBooking()).map(Booking::getId).orElse(null))
                .tripId(Optional.ofNullable(ticket.getTrip()).map(Trip::getId).orElse(null))
                .seatNumber(ticket.getSeatNumber())
                .price(ticket.getPrice())
                .vatRate(ticket.getVatRate())
                .pickupPointId(Optional.ofNullable(ticket.getPickupPoint()).map(PickupPoint::getId).orElse(null))
                .pickupPointName(Optional.ofNullable(ticket.getPickupPoint()).map(PickupPoint::getName).orElse(null))
                .dropoffPointId(Optional.ofNullable(ticket.getDropoffPoint()).map(PickupPoint::getId).orElse(null))
                .dropoffPointName(Optional.ofNullable(ticket.getDropoffPoint()).map(PickupPoint::getName).orElse(null))
                .status(ticket.getStatus())
                .isCheckedIn(ticket.getIsCheckedIn())
                .passengerName(ticket.getPassengerName())
                .passengerPhone(ticket.getPassengerPhone())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt());

        // Enrichment: Trip -> TripSchedule -> Route -> BusStation
        enrichTripDetails(ticket.getTrip(), builder);

        return builder.build();
    }

    /**
     * Làm giàu thông tin chuyến xe (route, bến đi/đến, ngày giờ)
     */
    private void enrichTripDetails(Trip trip, TicketResponse.TicketResponseBuilder builder) {
        if (Objects.isNull(trip)) {
            return;
        }

        Optional.ofNullable(trip.getDepartureDate())
                .ifPresent(date -> builder.departureDate(date.toString()));
        Optional.ofNullable(trip.getActualDepartureTime())
                .ifPresent(time -> builder.departureTime(time.toString()));

        // Bus -> BusType
        Optional.ofNullable(trip.getBus())
                .ifPresent(bus -> {
                    builder.busLicensePlate(bus.getLicensePlate());
                    Optional.ofNullable(bus.getBusType())
                            .ifPresent(type -> builder.busTypeName(type.getName()));
                });

        // TripSchedule -> Route -> BusStation
        Optional.ofNullable(trip.getTripSchedule())
                .map(TripSchedule::getRoute)
                .ifPresent(route -> {
                    builder.routeName(route.getName());
                    Optional.ofNullable(route.getDepartureStation())
                            .ifPresent(station -> builder.departureStationName(station.getName()));
                    Optional.ofNullable(route.getArrivalStation())
                            .ifPresent(station -> builder.arrivalStationName(station.getName()));
                });
    }
}
