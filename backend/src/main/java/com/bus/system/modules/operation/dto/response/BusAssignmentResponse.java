package com.bus.system.modules.operation.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO trả về thông tin Ca xe (Bus Assignment).
 */
@Getter
@Setter
public class BusAssignmentResponse {
    private Long id;

    // --- Bus info ---
    private Long busId;
    private String busLicensePlate;
    private String busTypeName;

    // --- Depot info ---
    private Long startDepotId;
    private String startDepotName;
    private Long endDepotId;
    private String endDepotName;

    // --- Schedule ---
    private LocalDateTime scheduledStart;
    private LocalDateTime scheduledEnd;

    // --- Check-in ---
    private LocalDateTime checkInTime;
    private BigDecimal checkInOdometer;
    private Integer checkInFuel;
    private String checkInNotes;
    private String checkInByName;

    // --- Check-out ---
    private LocalDateTime checkOutTime;
    private BigDecimal checkOutOdometer;
    private Integer checkOutFuel;
    private String checkOutNotes;
    private String checkOutByName;

    // --- Status ---
    private String status;
    private String notes;

    // --- Trips in this assignment ---
    private List<TripSummary> trips;

    private LocalDateTime createdAt;

    @Getter
    @Setter
    public static class TripSummary {
        private Long id;
        private String code;
        private String routeName;
        private String routeCode;
        private LocalDateTime departureTime;
        private LocalDateTime arrivalTime;
        private String status;
        private String driverName;
        private String departureStationName;
        private String arrivalStationName;
    }
}
