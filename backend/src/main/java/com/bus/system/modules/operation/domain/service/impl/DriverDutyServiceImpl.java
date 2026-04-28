package com.bus.system.modules.operation.domain.service.impl;

import com.bus.system.modules.operation.config.OperationProperties;
import com.bus.system.common.exception.BusinessException;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.domain.enums.BusAssignmentStatus;
import com.bus.system.modules.operation.domain.service.DriverDutyService;
import com.bus.system.modules.operation.domain.service.LaborLawResult;
import com.bus.system.modules.operation.dto.response.DriverTripComplianceResponse;
import com.bus.system.modules.operation.repository.BusAssignmentRepository;
import com.bus.system.modules.operation.repository.TripRepository;
import com.bus.system.modules.planning.domain.Route;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Domain Service: Kiểm tra nghiệp vụ liên quan đến Luật & Trách nhiệm lái xe.
 * Nghị định 10/2020/NĐ-CP về kinh doanh vận tải.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DriverDutyServiceImpl implements DriverDutyService {

    private final TripRepository tripRepository;
    private final BusAssignmentRepository busAssignmentRepository;
    private final OperationProperties operationProperties;

    // ==================== INFER METHODS ====================

    @Override
    public Long inferCurrentBusDepotId(Long busId, LocalDateTime beforeTime) {
        return busAssignmentRepository
                .findLastCompletedWithDepot(busId)
                .map(assignment -> {
                    if (assignment.getEndDepot() != null) {
                        return assignment.getEndDepot().getId();
                    }
                    return null;
                })
                .orElseThrow(() -> new BusinessException("LOCATION_NOT_FOUND",
                        "Không tìm thấy bãi đỗ hiện tại của xe (chưa có ca xe nào hoàn thành)."));
    }

    // ==================== PRIVATE VALIDATION METHODS ====================

    private void validateDailyRules(Long driverId, LocalDate tripDate, LocalTime tripDepartureTime,
            long newTripDurationMinutes, Long excludeTripId) {
        // Lấy tất cả chuyến trong ngày (bao gồm SCHEDULED, APPROVED, RUNNING,
        // COMPLETED)
        List<Trip> trips = new ArrayList<>(tripRepository.findTripsByDriverAndDate(driverId, tripDate));

        // Loại bỏ chuyến đang sửa nếu có
        if (excludeTripId != null) {
            trips.removeIf(t -> t.getId().equals(excludeTripId));
        }

        // Tạo chuyến ảo đại diện cho chuyến mới
        Trip newTrip = Trip.createVirtual(tripDate, tripDepartureTime, newTripDurationMinutes);
        trips.add(newTrip);

        // Sắp xếp theo thời gian
        trips.sort((t1, t2) -> {
            LocalDateTime dt1 = t1.getStartDateTime();
            LocalDateTime dt2 = t2.getStartDateTime();
            if (dt1 == null)
                return -1;
            if (dt2 == null)
                return 1;
            return dt1.compareTo(dt2);
        });

        // Validate
        validateDailyLimit(trips);
        validateContinuousDriving(trips);
    }

    private void validateDailyLimit(List<Trip> trips) {
        long totalDrivenMinutes = trips.stream()
                .mapToLong(Trip::getDurationMinutes)
                .sum();

        if (totalDrivenMinutes > operationProperties.getDriverDuty().getMaxDailyDrivingMinutes()) {
            throw new BusinessException("DAILY_LIMIT_EXCEEDED",
                    String.format("Vi phạm NĐ 10/2020: Tổng %.1fh/ngày (Giới hạn 10h).",
                            totalDrivenMinutes / 60.0));
        }
    }

    private void validateContinuousDriving(List<Trip> trips) {
        long currentContinuousMinutes = 0;
        Trip lastTrip = null;

        for (Trip trip : trips) {
            long tripDuration = trip.getDurationMinutes();

            if (lastTrip == null) {
                currentContinuousMinutes = tripDuration;
            } else {
                LocalDateTime lastEnd = lastTrip.getExpectedArrivalTime();
                LocalDateTime currentStart = trip.getStartDateTime();

                if (currentStart.isBefore(lastEnd)) {
                    throw new BusinessException("SCHEDULE_OVERLAP",
                            "Lịch chạy bị chồng chéo (Overlap) giữa các chuyến.");
                }

                long gapMinutes = Duration.between(lastEnd, currentStart).toMinutes();

                if (gapMinutes < operationProperties.getDriverDuty().getRestTimeThresholdMinutes()) {
                    currentContinuousMinutes += tripDuration;
                } else {
                    currentContinuousMinutes = tripDuration;
                }
            }

            if (currentContinuousMinutes > operationProperties.getDriverDuty().getMaxContinuousDrivingMinutes()) {
                throw new BusinessException("CONTINUOUS_LIMIT_EXCEEDED",
                        String.format("Vi phạm NĐ 10/2020: Lái xe liên tục %.1fh (Giới hạn 4h). Cần nghỉ ít nhất 15p.",
                                currentContinuousMinutes / 60.0));
            }

            lastTrip = trip;
        }
    }

    /**
     * Validate luật lao động thống nhất — dùng cho MỌI vùng.
     * Daily: BLOCK ngay (throws BusinessException).
     * Weekly: trả LaborLawResult → caller BLOCK.
     * Frontend dùng API riêng để lấy danh sách chuyến.
     */
    @Override
    public LaborLawResult validateLaborLaw(Long driverId, LocalDate tripDate,
            LocalTime tripDepartureTime, Route route, Long excludeTripId) {
        if (route == null || route.getDurationHours() == null) {
            log.warn("Route or duration is missing, skipping duty check for driver {}", driverId);
            return LaborLawResult.ok();
        }

        long newTripDurationMinutes = (long) (route.getDurationHours().doubleValue() * 60);

        // 1. Daily limit (10h/ngày, 4h liên tục) — BLOCK ngay
        validateDailyRules(driverId, tripDate, tripDepartureTime, newTripDurationMinutes, excludeTripId);

        // 2. Weekly limit (48h/tuần)
        LocalDate weekStart = tripDate.with(DayOfWeek.MONDAY);
        LocalDate weekEnd = tripDate.with(DayOfWeek.SUNDAY);

        long weeklyMinutes = tripRepository.sumDrivingMinutesByDriverAndWeek(
                driverId, weekStart, weekEnd, excludeTripId);
        long totalAfter = weeklyMinutes + newTripDurationMinutes;
        long excessMinutes = totalAfter - operationProperties.getDriverDuty().getMaxWeeklyDrivingMinutes();

        if (excessMinutes <= 0) {
            return LaborLawResult.ok();
        }

        log.warn("LABOR LAW: Tài xế #{} vượt {}' tuần — BLOCK", driverId, excessMinutes);
        return LaborLawResult.weeklyViolation(excessMinutes);
    }

    // ==================== COMPLIANCE CHECK ====================

    @Override
    public DriverTripComplianceResponse getDriverFutureTripsCompliance(
            Long driverId, LocalDate fromDate, LocalDate toDate) {
        long weeklyMinutes = tripRepository.sumDrivingMinutesByDriverAndWeek(
                driverId, fromDate, toDate, null);
        long maxWeekly = operationProperties.getDriverDuty().getMaxWeeklyDrivingMinutes();

        // Lấy chuyến tương lai (SCHEDULED/APPROVED) trong khoảng
        List<Trip> futureTrips = tripRepository.findFutureTripsToUnassign(
                driverId, fromDate, toDate, -1L);

        List<DriverTripComplianceResponse.TripComplianceItem> items = futureTrips.stream()
                .map(trip -> {
                    boolean canUnassign = true;
                    String reason = null;

                    // Chuyến đang chạy hoặc đã hoàn thành → không gỡ
                    if (trip.getStatus() != null &&
                            !trip.getStatus().name().equals("SCHEDULED") &&
                            !trip.getStatus().name().equals("APPROVED")) {
                        canUnassign = false;
                        reason = "Chuyến đang chạy hoặc đã hoàn thành";
                    }
                    // Chuyến đã qua thời gian departure → không gỡ
                    else if (trip.getStartDateTime() != null &&
                            trip.getStartDateTime().isBefore(LocalDateTime.now())) {
                        canUnassign = false;
                        reason = "Chuyến đã qua thời gian khởi hành";
                    }

                    String routeName = trip.getRoute() != null ? trip.getRoute().getName() : "N/A";

                    return DriverTripComplianceResponse.TripComplianceItem.builder()
                            .tripId(trip.getId())
                            .departureDate(trip.getDepartureDate())
                            .routeName(routeName)
                            .durationMinutes(trip.getDurationMinutes())
                            .canUnassign(canUnassign)
                            .reason(reason)
                            .build();
                })
                .toList();

        return DriverTripComplianceResponse.builder()
                .driverId(driverId)
                .weeklyDrivenMinutes(weeklyMinutes)
                .maxWeeklyMinutes(maxWeekly)
                .remainingMinutes(Math.max(0, maxWeekly - weeklyMinutes))
                .trips(items)
                .build();
    }

    @Override
    public LaborLawResult checkAssignmentCompliance(Long tripId, Long newDriverId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new BusinessException("TRIP_NOT_FOUND",
                        "Chuyến #" + tripId + " không tồn tại."));

        if (trip.getRoute() == null || trip.getRoute().getDurationHours() == null) {
            return LaborLawResult.ok();
        }

        return validateLaborLaw(newDriverId, trip.getDepartureDate(),
                trip.getActualDepartureTime(), trip.getRoute(), tripId);
    }
}
