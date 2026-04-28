package com.bus.system.modules.operation.mapper;

import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.domain.enums.DriverAssignmentStatus;
import com.bus.system.modules.operation.dto.request.CreateTripRequest;
import com.bus.system.modules.operation.dto.response.TripResponse;
import com.bus.system.modules.planning.domain.Route;
import com.bus.system.modules.planning.domain.TripSchedule;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class TripMapper {

    private final DriverAssignmentMapper driverAssignmentMapper;

    public Trip toEntity(CreateTripRequest request) {
        if (request == null)
            return null;
        Trip entity = new Trip();
        entity.setDepartureDate(request.getDepartureDate());
        return entity;
    }

    public TripResponse toResponse(Trip entity) {
        if (entity == null) {
            return null;
        }

        TripResponse response = new TripResponse();

        // 1. Map ID & Thời gian
        response.setId(entity.getId());
        response.setDepartureDate(entity.getDepartureDate());
        response.setActualDepartureTime(entity.getActualDepartureTime());
        response.setDepartureTime(entity.getActualDepartureTime()); // Map for frontend
        response.setArrivalTime(entity.getExpectedArrivalTime());

        // 2. Map Trạng thái & Loại
        if (entity.getStatus() != null) {
            response.setStatus(entity.getStatus().name());
        }
        if (entity.getTripType() != null) {
            response.setTripType(entity.getTripType().name());
        }

        // 3. Map các trường khớp với Schema
        response.setElectronicTransportOrderCode(entity.getElectronicTransportOrderCode());
        response.setQrCodeData(entity.getQrCodeData());
        response.setOdometerStart(entity.getOdometerStart());
        response.setOdometerEnd(entity.getOdometerEnd());

        // 4. Map ID liên kết
        response.setBusId(entity.getBusId());

        // [Phase 3] Populate crew
        response.setCrew(entity.getCrew().stream()
                .filter(da -> da.getStatus() == DriverAssignmentStatus.ACTIVE
                        || da.getStatus() == DriverAssignmentStatus.PENDING)
                .map(driverAssignmentMapper::toCrewMemberResponse)
                .collect(Collectors.toList()));

        // [Phase 3] Convenience: extract MAIN_DRIVER for frontend backward compat
        entity.getMainDriver().ifPresent(driver -> {
            response.setDriverId(driver.getId());
            response.setDriverName(driver.getFullName());
        });

        // 5. Map quan hệ cha
        TripSchedule schedule = entity.getTripSchedule();
        if (schedule != null) {
            response.setTripScheduleId(schedule.getId());
            Route route = schedule.getRoute();
            if (route != null) {
                response.setRouteId(route.getId());
                response.setRouteName(route.getName());
                response.setRouteCode(route.getCode());
                // Map station names cho filter b\u1ebfn trong UI
                if (route.getDepartureStation() != null) {
                    response.setDepartureStationName(route.getDepartureStation().getName());
                }
                if (route.getArrivalStation() != null) {
                    response.setArrivalStationName(route.getArrivalStation().getName());
                }
            }
        }

        // 6. Dispatch audit
        response.setDispatchNote(entity.getDispatchNote());

        return response;
    }

    public List<TripResponse> toResponseList(List<Trip> entities) {
        if (entities == null) {
            return List.of();
        }
        return entities.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // [OPTIMIZED N+1] Hàm map danh sách có kèm thông tin chi tiết (đã fetch sẵn)
    public List<TripResponse> toResponseListWithDetails(List<Trip> entities,
            Map<Long, Bus> busMap,
            Map<Long, User> driverMap,
            Map<String, java.math.BigDecimal> fareMap,
            Map<Long, String> scheduleBusTypeNameMap,
            Map<Long, Integer> bookedSeatsMap) {
        if (entities == null)
            return List.of();

        return entities.stream().map(entity -> {
            Bus bus = entity.getBusId() != null ? busMap.get(entity.getBusId()) : null;
            User driver = entity.getMainDriver().orElse(null);

            // Resolve Price
            java.math.BigDecimal price = java.math.BigDecimal.ZERO;
            if (entity.getTripSchedule() != null && entity.getTripSchedule().getRoute() != null && bus != null
                    && bus.getBusType() != null) {
                String key = entity.getTripSchedule().getRoute().getId() + "-" + bus.getBusType().getId();
                price = fareMap.getOrDefault(key, java.math.BigDecimal.ZERO);
            }

            // Resolve Booked Seats
            int bookedSeats = bookedSeatsMap != null ? bookedSeatsMap.getOrDefault(entity.getId(), 0) : 0;

            TripResponse dto = toResponse(entity, bus, driver, price, bookedSeats);

            // [FIX] Fallback: nếu chưa có busTypeName từ bus đã gán → lấy từ
            // ScheduleBusType (loại xe yêu cầu của nốt tài)
            if (dto.getBusTypeName() == null && entity.getTripSchedule() != null) {
                String scheduleBusTypeName = scheduleBusTypeNameMap.get(entity.getTripSchedule().getId());
                if (scheduleBusTypeName != null) {
                    dto.setBusTypeName(scheduleBusTypeName);
                    dto.setBusType(scheduleBusTypeName); // Alias
                }
            }

            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * Map Trip sang Response kèm thông tin chi tiết Xe, Tài xế và Só liệu Ghế.
     */
    public TripResponse toResponse(Trip entity, Bus bus, User driver, java.math.BigDecimal price, int bookedSeats) {
        TripResponse dto = toResponse(entity); // Base mapping

        // Enrich Bus info
        if (bus != null) {
            dto.setBusLicensePlate(bus.getLicensePlate());
            if (bus.getBusType() != null) {
                dto.setBusTypeName(bus.getBusType().getName());
                dto.setBusType(bus.getBusType().getName()); // Alias
                dto.setTotalSeats(bus.getBusType().getTotalSeats());
                dto.setAvailableSeats(Math.max(0, bus.getBusType().getTotalSeats() - bookedSeats));
            }
        }

        // Enrich Driver info from crew
        // (driver param kept for backward compatibility, but crew is primary now)

        // Enrich Derived Fields
        dto.setDuration(entity.getDurationMinutes());
        dto.setPrice(price != null ? price : java.math.BigDecimal.ZERO);

        return dto;
    }

    public TripResponse toResponse(Trip entity, Bus bus, User driver) {
        return toResponse(entity, bus, driver, java.math.BigDecimal.ZERO, 0);
    }

    // toCrewMemberResponse đã chuyển sang DriverAssignmentMapper
}