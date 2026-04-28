package com.bus.system.modules.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO trả về sơ đồ ghế cho một chuyến
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatMapResponse {

    private Long tripId;
    private Integer totalSeats;
    private Integer bookedSeats;
    private Integer availableSeats;

    // Danh sách ghế đã đặt
    private List<String> occupiedSeats;

    // Danh sách ghế trống
    private List<String> availableSeatsNumbers;
}
