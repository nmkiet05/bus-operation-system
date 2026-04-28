package com.bus.system.modules.operation.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TripAssignmentRequest {

    private Long busId;

    private Long driverId; // Tài xế chính (optional — nếu có sẽ tạo DriverAssignment)
}
