package com.bus.system.modules.planning.mapper;

import com.bus.system.modules.planning.domain.Route;
import com.bus.system.modules.planning.domain.TripSchedule;
import com.bus.system.modules.planning.dto.request.TripScheduleRequest;
import com.bus.system.modules.planning.dto.response.TripScheduleResponse;
import com.bus.system.modules.planning.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import com.bus.system.modules.planning.contract.ScheduleStatus;

@Component
@RequiredArgsConstructor
public class TripScheduleMapper {

    private final RouteRepository routeRepository;

    public TripSchedule toEntity(TripScheduleRequest request) {
        TripSchedule entity = new TripSchedule();
        entity.setDepartureTime(request.getDepartureTime());
        entity.setSlotDecisionNumber(request.getSlotDecisionNumber());
        entity.setEffectiveFrom(request.getEffectiveFrom());
        entity.setEffectiveTo(request.getEffectiveTo());

        // Map String to Enum
        if (request.getStatus() != null) {
            try {
                entity.setStatus(ScheduleStatus.valueOf(request.getStatus()));
            } catch (IllegalArgumentException e) {
                entity.setStatus(ScheduleStatus.ACTIVE); // Default or throw exception
            }
        } else {
            entity.setStatus(ScheduleStatus.ACTIVE);
        }

        // Map Route
        Route route = routeRepository.findById(Objects.requireNonNull(request.getRouteId()))
                .orElseThrow(() -> new RuntimeException("Route not found"));
        entity.setRoute(route);

        // Map DaysOfWeek List -> Bitmask Short
        entity.setOperationDaysBitmap(convertListToBitmap(request.getDaysOfWeek()));

        return entity;
    }

    public TripScheduleResponse toResponse(TripSchedule entity) {
        TripScheduleResponse response = new TripScheduleResponse();
        response.setId(entity.getId());
        response.setDepartureTime(entity.getDepartureTime());
        response.setSlotDecisionNumber(entity.getSlotDecisionNumber());
        response.setEffectiveFrom(entity.getEffectiveFrom());
        response.setEffectiveTo(entity.getEffectiveTo());
        response.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);

        if (entity.getRoute() != null) {
            response.setRouteId(entity.getRoute().getId());
            response.setRouteName(entity.getRoute().getName());
        }

        // Map Bitmask Short -> DaysOfWeek List
        response.setOperationDaysBitmap(entity.getOperationDaysBitmap());
        response.setDaysOfWeek(convertBitmapToList(entity.getOperationDaysBitmap()));

        return response;
    }

    public void updateEntity(TripSchedule entity, TripScheduleRequest request) {
        entity.setDepartureTime(request.getDepartureTime());
        entity.setSlotDecisionNumber(request.getSlotDecisionNumber());
        entity.setEffectiveFrom(request.getEffectiveFrom());
        entity.setEffectiveTo(request.getEffectiveTo());
        if (request.getStatus() != null) {
            try {
                entity.setStatus(ScheduleStatus.valueOf(request.getStatus()));
            } catch (IllegalArgumentException e) {
                // Ignore
            }
        }
        entity.setOperationDaysBitmap(convertListToBitmap(request.getDaysOfWeek()));
        // Không update Route để tránh sai lệch
    }

    // --- UTILS BITMASK ---
    // CN=1(Bit 0), T2=2(Bit 1), T3=4(Bit 2)... T7=64(Bit 6)
    // Quy ước Input: 2,3,4,5,6,7,8 (8 là CN)
    private static final int INPUT_DAY_SUNDAY = 8;
    private static final int INPUT_DAY_MONDAY = 2;
    private static final int INPUT_DAY_SATURDAY = 7;
    private static final int BIT_SUNDAY_MASK = 1; // 1 << 0

    private Short convertListToBitmap(List<Integer> days) {
        if (days == null || days.isEmpty())
            return 0;
        int bitmap = 0;
        for (Integer day : days) {
            if (day == INPUT_DAY_SUNDAY)
                bitmap |= BIT_SUNDAY_MASK; // Chủ nhật là bit 0
            else if (day >= INPUT_DAY_MONDAY && day <= INPUT_DAY_SATURDAY)
                bitmap |= (1 << (day - 1));
        }
        return (short) bitmap;
    }

    private List<Integer> convertBitmapToList(Short bitmap) {
        List<Integer> days = new ArrayList<>();
        if (bitmap == null)
            return days;
        int val = bitmap;

        // Kiểm tra bit 0 (Chủ nhật)
        if ((val & BIT_SUNDAY_MASK) > 0)
            days.add(INPUT_DAY_SUNDAY);

        // Kiểm tra các ngày từ T2 (2) -> T7 (7)
        for (int i = INPUT_DAY_MONDAY; i <= INPUT_DAY_SATURDAY; i++) {
            if ((val & (1 << (i - 1))) > 0) {
                days.add(i);
            }
        }
        days.sort(Integer::compareTo);
        return days;
    }
}