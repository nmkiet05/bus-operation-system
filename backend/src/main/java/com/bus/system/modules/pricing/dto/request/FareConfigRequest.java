package com.bus.system.modules.pricing.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class FareConfigRequest {

    @NotNull(message = "Tuyến đường không được để trống")
    private Long routeId;

    @NotNull(message = "Loại xe không được để trống")
    private Long busTypeId;

    @NotNull(message = "Giá vé không được để trống")
    @Positive(message = "Giá vé phải lớn hơn 0")
    private BigDecimal price;

    @NotNull(message = "Ngày hiệu lực không được để trống")
    private LocalDate effectiveFrom;

    // effectiveTo có thể null (vô thời hạn)
    private LocalDate effectiveTo;

    private Boolean isHolidaySurcharge;
}