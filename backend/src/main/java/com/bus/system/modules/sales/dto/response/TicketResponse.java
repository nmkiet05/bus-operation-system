package com.bus.system.modules.sales.dto.response;

import com.bus.system.modules.sales.domain.enums.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO trả về thông tin vé
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {

    private Long id;
    private Long bookingId;
    private Long tripId;

    // Thông tin chuyến (Enriched - Human-readable)
    private String routeName; // "Sài Gòn - Đà Lạt"
    private String departureStationName; // "BX Miền Đông"
    private String arrivalStationName; // "BX Liên Tỉnh Đà Lạt"
    private String departureDate; // "2026-02-15"
    private String departureTime; // "07:00"

    // Thông tin xe
    private String busLicensePlate; // "51B-123.45"
    private String busTypeName; // "Giường nằm 40 chỗ"

    // Thông tin ghế
    private String seatNumber;
    private BigDecimal price;
    private BigDecimal vatRate;

    // Hành khách thực tế
    private String passengerName;
    private String passengerPhone;

    // Điểm đón/trả
    private Long pickupPointId;
    private String pickupPointName;
    private Long dropoffPointId;
    private String dropoffPointName;

    // Trạng thái
    private TicketStatus status;
    private Boolean isCheckedIn;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
