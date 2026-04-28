package com.bus.system.modules.operation.service.impl;

import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.fleet.repository.BusRepository;
import com.bus.system.modules.identity.contract.UserRole;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.identity.repository.UserRepository;
import com.bus.system.modules.operation.config.OperationProperties;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.repository.TripRepository;
import com.bus.system.modules.operation.service.ResourceAvailabilityService;
import com.bus.system.modules.planning.domain.Route;
import com.bus.system.modules.planning.repository.RouteRegistrationRepository;
import com.bus.system.modules.planning.repository.ScheduleBusTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service kiểm tra khả dụng tài nguyên (Xe, Tài xế).
 *
 * Dispatch pipeline cho xe (getAvailableBusesForTrip):
 * 1. Pool đăng ký tuyến (RouteRegistration ACTIVE)
 * 2. Loại xe cho lịch (ScheduleBusType effective)
 * 3. Không bận + hard block bảo dưỡng quá hạn
 * 4. Sort dispatch score (location * 100 + maintenance * 10 + idle * 1)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ResourceAvailabilityServiceImpl implements ResourceAvailabilityService {

    private final TripRepository tripRepository;
    private final BusRepository busRepository;
    private final UserRepository userRepository;
    private final RouteRegistrationRepository routeRegistrationRepository;
    private final ScheduleBusTypeRepository scheduleBusTypeRepository;
    private final OperationProperties operationProperties;

    @Override
    @Transactional(readOnly = true)
    public List<User> getAvailableDrivers(LocalDateTime startTime, LocalDateTime endTime) {
        List<Long> busyDriverIds = tripRepository.findBusyDriverIds(startTime, endTime);
        if (busyDriverIds.isEmpty()) {
            return userRepository.findActiveUsersByRole(UserRole.DRIVER);
        }
        return userRepository.findActiveUsersByRoleAndIdNotIn(UserRole.DRIVER, busyDriverIds);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Bus> getAvailableBuses(LocalDateTime startTime, LocalDateTime endTime) {
        List<Long> busyBusIds = tripRepository.findBusyBusIds(startTime, endTime);
        List<Bus> buses;
        if (busyBusIds.isEmpty()) {
            buses = busRepository.findActiveBuses();
        } else {
            buses = busRepository.findActiveBusesIdNotIn(busyBusIds);
        }
        return buses;
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getAvailableDriversForTrip(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Chuyến xe", "id", tripId));

        LocalDateTime startTime = trip.getStartDateTime();
        LocalDateTime endTime = trip.getExpectedArrivalTime();
        if (startTime == null || endTime == null) {
            return List.of();
        }

        // 1. Lọc theo thời gian (chưa bận)
        List<User> candidates = getAvailableDrivers(startTime, endTime);

        // 2. Xác định yêu cầu bằng lái
        if (trip.getBusId() != null) {
            // Đã gán xe → lọc theo bằng lái phù hợp xe cụ thể
            Bus bus = busRepository.findById(trip.getBusId()).orElse(null);
            if (bus != null) {
                return candidates.stream()
                        .filter(driver -> isLicenseQualified(driver, bus))
                        .collect(Collectors.toList());
            }
        }

        // 3. Chưa gán xe → lọc theo loại xe yêu cầu từ ScheduleBusType
        if (trip.getTripSchedule() != null) {
            List<com.bus.system.modules.fleet.domain.BusType> allowedTypes = scheduleBusTypeRepository
                    .findEffectiveBusTypesByScheduleId(
                            trip.getTripSchedule().getId());
            if (!allowedTypes.isEmpty()) {
                // Lấy MAX totalSeats để xác định hạng bằng lái cần thiết cao nhất
                int maxSeats = allowedTypes.stream()
                        .mapToInt(com.bus.system.modules.fleet.domain.BusType::getTotalSeats)
                        .max()
                        .orElse(0);
                return candidates.stream()
                        .filter(driver -> driver.getDriverDetail() != null
                                && driver.getDriverDetail().canDriveSeats(maxSeats))
                        .collect(Collectors.toList());
            }
        }

        return candidates;
    }

    /**
     * Tìm xe khả dụng cho chuyến — 4 tầng pipeline.
     *
     * 1. Pool đăng ký tuyến (RouteRegistration ACTIVE)
     * 2. Loại xe cho lịch (ScheduleBusType effective)
     * 3. Không bận + hard block bảo dưỡng quá hạn
     * 4. Sort dispatch score
     */
    @Override
    @Transactional(readOnly = true)
    public List<Bus> getAvailableBusesForTrip(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Chuyến xe", "id", tripId));

        LocalDateTime startTime = trip.getStartDateTime();
        LocalDateTime endTime = trip.getExpectedArrivalTime();
        if (startTime == null || endTime == null) {
            return List.of();
        }

        Long routeId = trip.getRouteId();

        // === TẦNG 1: Pool xe đăng ký tuyến ===
        List<Long> registeredBusIds = routeRegistrationRepository.findActiveBusIdsByRouteId(routeId);
        if (registeredBusIds.isEmpty()) {
            log.warn("Tuyến {} chưa có xe đăng ký khai thác.", routeId);
            // Fallback: trả tất cả xe khả dụng (chưa có dữ liệu đăng ký)
            return getAvailableBusesFallback(startTime, endTime, trip);
        }

        // === TẦNG 2: Loại xe cho lịch chạy ===
        List<Long> allowedBusTypeIds = List.of();
        if (trip.getTripSchedule() != null) {
            allowedBusTypeIds = scheduleBusTypeRepository
                    .findEffectiveBusTypeIdsByScheduleId(trip.getTripSchedule().getId());
        }

        // === TẦNG 3: Không bận + active + hard block bảo dưỡng ===
        List<Long> busyBusIds = tripRepository.findBusyBusIds(startTime, endTime);
        final List<Long> finalAllowedBusTypeIds = allowedBusTypeIds;

        List<Bus> candidates = busRepository.findAllByIdWithBusType(registeredBusIds).stream()
                .filter(Bus::isActive)
                .filter(bus -> !busyBusIds.contains(bus.getId()))
                .filter(bus -> !isMaintenanceOverdue(bus)) // Hard block quá hạn
                .filter(bus -> {
                    // Filter loại xe nếu lịch có quy định
                    if (finalAllowedBusTypeIds.isEmpty())
                        return true;
                    return bus.getBusType() != null
                            && finalAllowedBusTypeIds.contains(bus.getBusType().getId());
                })
                .collect(Collectors.toList());

        // === TẦNG 4: Sort dispatch score ===
        Route route = trip.getRoute();
        Long departureStationId = (route != null) ? route.getDepartureStationId() : null;

        if (departureStationId == null) {
            return candidates;
        }

        final Long depStationId = departureStationId;
        final LocalDateTime depTime = startTime;
        var dispatchConfig = operationProperties.getDispatch();

        return candidates.stream()
                .sorted((a, b) -> {
                    int scoreA = calculateDispatchScore(a, depStationId, depTime, dispatchConfig);
                    int scoreB = calculateDispatchScore(b, depStationId, depTime, dispatchConfig);
                    return Integer.compare(scoreA, scoreB);
                })
                .collect(Collectors.toList());
    }

    // ==================== DISPATCH SCORING ====================

    /**
     * Tính dispatch score cho xe. Score thấp = ưu tiên cao.
     *
     * Formula: location * locationWeight + maintenance * maintenanceWeight + idle *
     * idleWeight
     * Default: location * 100 + maintenance * 10 + idle * 1
     *
     * → Location luôn dominant. Idle chỉ phá hòa khi cùng vị trí.
     */
    private int calculateDispatchScore(Bus bus, Long departureStationId,
            LocalDateTime tripStart,
            OperationProperties.DispatchConfig config) {
        int locationScore = busLocationPriority(bus.getId(), departureStationId, tripStart);
        int maintenanceScore = maintenancePriority(bus, config);
        int idleScore = idlePriority(bus, tripStart);

        return locationScore * config.getLocationWeight()
                + maintenanceScore * config.getMaintenanceWeight()
                + idleScore * config.getIdleWeight();
    }

    /**
     * Ưu tiên vị trí xe — 5 mức:
     * 0 = quay đầu (chuyến trước vừa đến bến này trong 4h qua)
     * 1 = tại bến xuất phát (đã ở bến nhưng không phải vừa quay đầu)
     * 2 = nằm bãi (depot) — placeholder, chưa có depot assignment data
     * 3 = bến khác
     * 4 = không rõ vị trí
     */
    private int busLocationPriority(Long busId, Long departureStationId, LocalDateTime beforeTime) {
        return tripRepository.findLastTripByBusBefore(busId, beforeTime)
                .map(lastTrip -> {
                    Route route = lastTrip.getRoute();
                    if (route == null)
                        return 4;

                    Long arrivalStationId = route.getArrivalStationId();
                    if (arrivalStationId == null)
                        return 4;

                    if (arrivalStationId.equals(departureStationId)) {
                        // Xe đang ở đúng bến xuất phát
                        // Phân biệt "quay đầu" (vừa đến < 4h) vs "tại bến" (đã nằm lâu)
                        LocalDateTime arrivedAt = lastTrip.getArrivalTime();
                        if (arrivedAt != null) {
                            long hoursAgo = ChronoUnit.HOURS.between(arrivedAt, beforeTime);
                            return hoursAgo <= 4 ? 0 : 1; // 0 = quay đầu, 1 = tại bến
                        }
                        // Chưa có arrivalTime → coi như tại bến
                        return 1;
                    }

                    // Xe ở bến khác
                    return 3;
                })
                .orElse(4); // Chưa có chuyến → không rõ vị trí
    }

    /**
     * Ưu tiên bảo dưỡng:
     * 0 = xa kỳ bảo dưỡng (> safeDays)
     * 1 = bình thường (warnDays ~ safeDays)
     * 2 = sắp bảo dưỡng (< warnDays)
     */
    private int maintenancePriority(Bus bus, OperationProperties.DispatchConfig config) {
        if (bus.getNextMaintenanceDueAt() == null)
            return 1;
        long daysUntil = ChronoUnit.DAYS.between(LocalDate.now(), bus.getNextMaintenanceDueAt());
        if (daysUntil > config.getMaintenanceSafeDays())
            return 0;
        if (daysUntil > config.getMaintenanceWarnDays())
            return 1;
        return 2;
    }

    /**
     * Ưu tiên fair rotation (idle):
     * 0 = idle lâu nhất (≥ 48h) → ưu tiên
     * 5 = vừa chạy (< 2h) → ít ưu tiên
     *
     * Fallback: nếu lastAssignedAt = null → dùng createdAt
     */
    private int idlePriority(Bus bus, LocalDateTime tripStart) {
        LocalDateTime lastActive = bus.getLastAssignedAt();
        if (lastActive == null) {
            lastActive = bus.getCreatedAt(); // Fallback xe mới
        }
        if (lastActive == null)
            return 0;

        long hoursIdle = ChronoUnit.HOURS.between(lastActive, tripStart);
        if (hoursIdle >= 48)
            return 0;
        if (hoursIdle >= 24)
            return 1;
        if (hoursIdle >= 12)
            return 2;
        if (hoursIdle >= 6)
            return 3;
        if (hoursIdle >= 2)
            return 4;
        return 5;
    }

    // ==================== HARD BLOCKS ====================

    /**
     * Xe quá hạn bảo dưỡng → loại khỏi dispatch (safety).
     */
    private boolean isMaintenanceOverdue(Bus bus) {
        if (bus.getNextMaintenanceDueAt() == null)
            return false;
        return bus.getNextMaintenanceDueAt().isBefore(LocalDate.now());
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Fallback khi tuyến chưa có đăng ký xe.
     * Vẫn filter loại xe theo ScheduleBusType, chỉ bỏ filter RouteRegistration.
     */
    private List<Bus> getAvailableBusesFallback(LocalDateTime startTime, LocalDateTime endTime, Trip trip) {
        List<Bus> candidates = getAvailableBuses(startTime, endTime);

        // === Vẫn áp dụng Tầng 2: Filter loại xe theo lịch chạy ===
        List<Long> allowedBusTypeIds = List.of();
        if (trip.getTripSchedule() != null) {
            allowedBusTypeIds = scheduleBusTypeRepository
                    .findEffectiveBusTypeIdsByScheduleId(trip.getTripSchedule().getId());
        }
        final List<Long> finalAllowedBusTypeIds = allowedBusTypeIds;

        Route route = trip.getRoute();
        Long departureStationId = (route != null) ? route.getDepartureStationId() : null;

        final Long depStationId = departureStationId;
        final LocalDateTime depTime = startTime;
        var dispatchConfig = operationProperties.getDispatch();

        List<Bus> result = candidates.stream()
                .filter(bus -> !isMaintenanceOverdue(bus))
                .filter(bus -> {
                    // Filter loại xe nếu lịch có quy định
                    if (finalAllowedBusTypeIds.isEmpty())
                        return true;
                    return bus.getBusType() != null
                            && finalAllowedBusTypeIds.contains(bus.getBusType().getId());
                })
                .sorted((a, b) -> {
                    if (depStationId == null)
                        return 0;
                    int scoreA = calculateDispatchScore(a, depStationId, depTime, dispatchConfig);
                    int scoreB = calculateDispatchScore(b, depStationId, depTime, dispatchConfig);
                    return Integer.compare(scoreA, scoreB);
                })
                .collect(Collectors.toList());
        return result;
    }

    /**
     * Kiểm tra tài xế có đủ bằng lái để lái xe không.
     */
    private boolean isLicenseQualified(User driver, Bus bus) {
        if (driver == null || driver.getDriverDetail() == null) {
            return false;
        }
        return driver.getDriverDetail().canDrive(bus);
    }
}
