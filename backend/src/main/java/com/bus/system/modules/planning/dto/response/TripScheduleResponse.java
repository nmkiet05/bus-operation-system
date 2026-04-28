package com.bus.system.modules.planning.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
public class TripScheduleResponse {
    private Long id;
    private String code;
    private Long routeId;
    private String routeName;
    private LocalTime departureTime;
    private String slotDecisionNumber;

    private List<Integer> daysOfWeek; // Trả về list cho FE dễ hiển thị
    private Short operationDaysBitmap; // Trả thêm bitmap gốc để debug nếu cần

    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private String status;
}