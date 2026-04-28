package com.bus.system.modules.catalog.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TicketOfficeRequest {
    @NotBlank(message = "Tên văn phòng không được để trống")
    private String name;

    private Long stationId; // Optional -> Nullable in DB

    private String address;

    private String locationDetail;

    private String phone;

    private String status;
}
