package com.bus.system.modules.planning.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
public class TripScheduleRequest {

    @NotNull(message = "Tuyến đường không được để trống")
    private Long routeId;

    @NotNull(message = "Giờ xuất bến không được để trống")
    private LocalTime departureTime;

    private String slotDecisionNumber; // Số văn bản sở GTVT

    // Frontend gửi: [2, 3, 4, 5, 6, 7, 8] (8 là CN)
    @NotNull(message = "Ngày hoạt động không được để trống")
    private List<Integer> daysOfWeek;

    @NotNull(message = "Ngày bắt đầu hiệu lực không được để trống")
    private LocalDate effectiveFrom;

    private LocalDate effectiveTo;

    private String status; // ACTIVE, INACTIVE
}