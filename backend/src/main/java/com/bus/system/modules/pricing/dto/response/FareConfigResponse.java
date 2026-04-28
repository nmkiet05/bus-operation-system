package com.bus.system.modules.pricing.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class FareConfigResponse {
    private Long id;

    // Trả về cả Object Route/BusType rút gọn hoặc chỉ ID tùy nhu cầu FE.
    // Ở đây trả về tên để hiển thị cho đẹp.
    private Long routeId;
    private String routeName;

    private Long busTypeId;
    private String busTypeName;

    private BigDecimal price;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private Boolean isHolidaySurcharge;

    private Long approvedBy;
    private String status;
}