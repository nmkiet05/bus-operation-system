package com.bus.system.modules.planning.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PickupPointRequest {

    @NotBlank(message = "Tên điểm đón không được để trống")
    private String name;

    private String address;

    @DecimalMin(value = "-90.0", message = "Latitude phải >= -90")
    @DecimalMax(value = "90.0", message = "Latitude phải <= 90")
    private BigDecimal latitude;

    @DecimalMin(value = "-180.0", message = "Longitude phải >= -180")
    @DecimalMax(value = "180.0", message = "Longitude phải <= 180")
    private BigDecimal longitude;

    @NotNull(message = "Thứ tự không được để trống")
    @Min(value = 1, message = "Thứ tự phải >= 1")
    private Integer sequenceOrder;

    @NotNull(message = "Thời gian ước tính không được để trống")
    @Min(value = 0, message = "Thời gian phải >= 0")
    private Integer estimatedMinutesFromDeparture;

    private String status; // ACTIVE | INACTIVE
}
