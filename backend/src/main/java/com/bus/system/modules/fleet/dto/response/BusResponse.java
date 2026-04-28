package com.bus.system.modules.fleet.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class BusResponse {
    private Long id;
    private String licensePlate;

    // Flatten dữ liệu từ BusType ra để Frontend dễ hiển thị
    private String busTypeName; // VD: Limousine 34 Giường
    private Integer totalSeats; // VD: 34

    private String transportBadgeNumber;
    private String gpsDeviceId;
    private String vinNumber;
    private String engineNumber;
    private Integer manufacturingYear;
    private LocalDate insuranceExpiryDate;
    private LocalDate registrationExpiryDate;

    private String status;
    private LocalDateTime lastAssignedAt;
    private LocalDate nextMaintenanceDueAt;
    private LocalDateTime updatedAt;

    // Bãi đỗ hiện tại (suy từ checkout cuối cùng)
    private Long currentDepotId;
    private String currentDepotName;
}