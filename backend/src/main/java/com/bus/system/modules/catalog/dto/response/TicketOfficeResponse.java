package com.bus.system.modules.catalog.dto.response;

import lombok.Data;

@Data
public class TicketOfficeResponse {
    private Long id;
    private String name;
    private Long stationId;
    private String stationName;
    private String address;
    private String locationDetail;
    private String phone;
    private String status;
}
