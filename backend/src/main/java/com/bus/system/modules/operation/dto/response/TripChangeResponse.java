package com.bus.system.modules.operation.dto.response;

import com.bus.system.modules.operation.domain.enums.ChangeRequestStatus;
import com.bus.system.modules.operation.domain.enums.ChangeUrgencyZone;
import com.bus.system.modules.operation.domain.enums.TripChangeType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TripChangeResponse {
    private Long id;
    private Long tripId;
    private String routeName;
    private String licensePlate;

    // Loại thay đổi
    private TripChangeType changeType;

    // Tài xế (crew-based)
    private Long oldDriverId;
    private String oldDriverName;
    private Long newDriverId;
    private String newDriverName;

    // Xe
    private Long oldBusId;
    private Long newBusId;

    // Trạng thái
    private String requestReason;
    private ChangeRequestStatus status;
    private Boolean isEmergency;

    // 5 Vùng
    private ChangeUrgencyZone urgencyZone;
    private String incidentType;
    private String incidentGps;

    // Audit
    private Long createdBy;
    private Long approvedBy;
    private String rejectedReason;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
