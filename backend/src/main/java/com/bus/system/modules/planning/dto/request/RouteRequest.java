package com.bus.system.modules.planning.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class RouteRequest {
    private String code;

    @NotBlank(message = "Tên tuyến không được để trống")
    private String name;

    @NotNull(message = "Bến đi ID bắt buộc")
    private Long departureStationId;

    @NotNull(message = "Bến đến ID bắt buộc")
    private Long arrivalStationId;

    @NotNull(message = "Khoảng cách không được để trống")
    @DecimalMin(value = "0.1", message = "Khoảng cách phải lớn hơn 0")
    private BigDecimal distance;

    // [ĐÃ SỬA]: Đổi sang BigDecimal
    @NotNull(message = "Thời gian di chuyển không được để trống")
    @DecimalMin(value = "0.1", message = "Thời gian phải lớn hơn 0")
    private BigDecimal durationHours;

    private String itineraryDetail;

    private String hotline;
    private Long defaultRefundPolicyId;
    private String status;
}