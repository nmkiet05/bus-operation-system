package com.bus.system.modules.operation.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
public class TripResponse {
    private Long id;
    private String code;

    // --- Thông tin Tuyến & Lịch trình ---
    private Long routeId;
    private String routeName;
    private String routeCode;
    private Long tripScheduleId;
    private String departureStationName; // Bến xuất phát (từ route.departureStation)
    private String arrivalStationName; // Bến đến (từ route.arrivalStation)

    // --- Thông tin Thời gian ---
    private LocalDate departureDate;
    private LocalTime actualDepartureTime;
    private LocalTime departureTime; // Alias for frontend compatibility
    private LocalDateTime arrivalTime;

    // --- Thông tin Trạng thái ---
    private String tripType; // MAIN, REINFORCEMENT
    private String status; // SCHEDULED, RUNNING...

    private String electronicTransportOrderCode; // Lệnh vận chuyển điện tử
    private String qrCodeData; // Dữ liệu QR

    // --- Thông tin Vận hành ---
    private Long busId; // ID xe (Chưa join bảng Bus để tối ưu)
    private String busLicensePlate; // Biển số xe (Batch Fetch)
    private String busTypeName; // [Enriched] Tên loại xe

    // [Phase 3] Crew — danh sách tài xế phục vụ chuyến
    private List<CrewMemberResponse> crew;

    // Convenience fields for frontend (derived from crew MAIN_DRIVER)
    private Long driverId;
    private String driverName;

    private BigDecimal odometerStart;
    private BigDecimal odometerEnd;

    // --- Thông tin Frontend Match ---
    private Long duration; // minutes
    private BigDecimal price;
    private Integer totalSeats;
    private Integer availableSeats;
    private String busType; // Alias for busTypeName
    private String dispatchNote; // Lý do gán xe
}