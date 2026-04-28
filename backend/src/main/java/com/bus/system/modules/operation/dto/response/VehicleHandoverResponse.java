package com.bus.system.modules.operation.dto.response;

import com.bus.system.modules.operation.domain.enums.HandoverType;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO phản hồi thông tin biên bản bàn giao xe.
 */
@Getter
@Setter
public class VehicleHandoverResponse {
    private Long id;
    private Long busId;
    private String licensePlate;
    private Long driverId;
    private String driverName;
    private HandoverType handoverType;
    private BigDecimal odometer;
    private Integer fuelLevel;
    private String notes;
    private LocalDateTime handoverTime;

    // --- Status & Emergency (mở rộng cho trang Quản lý chuyến) ---
    private String status;
    private String statusReason;
    private Boolean isEmergency;
    private String violationLevel;
    private LocalDateTime emergencyReviewedAt;

    // --- Trip info ---
    private Long tripId;
    private String tripCode;

    // --- Time tracking ---
    private LocalDateTime scheduledReturnTime;
    private LocalDateTime actualReturnTime;
    private LocalDateTime createdAt;
}
