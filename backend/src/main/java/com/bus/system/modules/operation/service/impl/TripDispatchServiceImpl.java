package com.bus.system.modules.operation.service.impl;

import com.bus.system.modules.operation.domain.enums.TripStatus;
import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.fleet.repository.BusRepository;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.identity.repository.UserRepository;
import com.bus.system.modules.operation.domain.DriverAssignment;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.domain.enums.CrewRole;
import com.bus.system.modules.operation.domain.enums.DriverAssignmentStatus;
import com.bus.system.modules.operation.dto.request.TripAssignmentRequest;
import com.bus.system.modules.operation.dto.response.TripResponse;
import com.bus.system.modules.operation.mapper.TripMapper;
import com.bus.system.modules.operation.repository.DriverAssignmentRepository;
import com.bus.system.modules.operation.repository.TripRepository;
import com.bus.system.modules.operation.service.TripDispatchService;
import com.bus.system.modules.operation.service.BusAssignmentService;
import com.bus.system.modules.planning.contract.RegistrationStatus;
import com.bus.system.modules.planning.repository.RouteRegistrationRepository;
import com.bus.system.modules.planning.repository.ScheduleBusTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

/**
 * Service điều độ chuyến xe: gán xe + duyệt chuyến.
 * Lifecycle (start/complete) đã tách sang TripLifecycleServiceImpl.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TripDispatchServiceImpl implements TripDispatchService {

    private final TripRepository tripRepository;
    private final TripMapper tripMapper;
    private final BusRepository busRepository;
    private final UserRepository userRepository;
    private final DriverAssignmentRepository driverAssignmentRepository;
    private final BusAssignmentService busAssignmentService;
    private final RouteRegistrationRepository routeRegistrationRepository;
    private final ScheduleBusTypeRepository scheduleBusTypeRepository;

    @Override
    @Transactional
    public TripResponse assignResources(Long id, TripAssignmentRequest request) {
        Trip trip = tripRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Chuyến xe", "id", id));

        if (request.getBusId() == null) {
            throw new BusinessException("MISSING_BUS", "Phải chọn xe trước khi gán chuyến.");
        }

        if (trip.getStatus() != TripStatus.SCHEDULED) {
            throw new BusinessException("INVALID_STATUS",
                    "Không thể phân công nguồn lực khi chuyến đang ở trạng thái " + trip.getStatus());
        }

        processScheduledAssignment(trip, request.getBusId());

        // Gán tài xế chính nếu request có driverId
        if (request.getDriverId() != null) {
            processDriverAssignment(trip, request.getDriverId());
        }

        return tripMapper.toResponse(tripRepository.save(trip));
    }

    @Override
    @Transactional
    public void approveTrip(Long tripId) {
        Trip trip = tripRepository.findById(Objects.requireNonNull(tripId))
                .orElseThrow(() -> new ResourceNotFoundException("Chuyến xe", "id", tripId));

        if (trip.getStatus() != TripStatus.SCHEDULED) {
            throw new BusinessException("INVALID_STATUS", "Chỉ có thể duyệt chuyến đang ở trạng thái SCHEDULED.");
        }

        if (trip.getBusId() == null) {
            throw new BusinessException("MISSING_BUS", "Chưa phân công xe cho chuyến.");
        }

        trip.setStatus(TripStatus.APPROVED);
        busAssignmentService.attachTripToBusAssignment(trip);
        tripRepository.save(trip);

        log.info("Duyệt chuyến {} thành công.", tripId);
    }

    private void processScheduledAssignment(Trip trip, Long busId) {
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new ResourceNotFoundException("Xe", "id", busId));

        validateBusNotBusy(bus, trip);
        validateBusRegisteredForRoute(trip, busId);
        validateBusTypeForSchedule(trip, bus);

        trip.assignBus(bus);

        // Fair rotation: cập nhật lastAssignedAt
        bus.setLastAssignedAt(LocalDateTime.now());
        busRepository.save(bus);

        // Audit trail
        trip.setDispatchNote("Xe " + bus.getLicensePlate() + " đã được gán");

        log.info("Gán chuyến {} với xe {}", trip.getId(), bus.getLicensePlate());
    }

    /**
     * Gán tài xế chính cho chuyến — tạo hoặc cập nhật DriverAssignment.
     * Handle reassign: nếu đã có MAIN_DRIVER PENDING/ACTIVE:
     * - Cùng tài xế → bỏ qua (idempotent).
     * - Khác tài xế → hủy cái cũ, tạo mới.
     */
    private void processDriverAssignment(Trip trip, Long driverId) {
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài xế", "id", driverId));

        // Kiểm tra đã có MAIN_DRIVER assignment (PENDING hoặc ACTIVE) chưa
        var existing = driverAssignmentRepository.findFirstByTripIdAndRoleAndStatusIn(
                trip.getId(),
                CrewRole.MAIN_DRIVER,
                List.of(DriverAssignmentStatus.PENDING, DriverAssignmentStatus.ACTIVE));

        if (existing.isPresent()) {
            DriverAssignment old = existing.get();
            if (old.getDriver().getId().equals(driverId)) {
                // Cùng tài xế → idempotent, không cần làm gì
                log.info("Tài xế {} đã được gán cho chuyến {} — bỏ qua.", driver.getFullName(), trip.getId());
                return;
            }
            // Khác tài xế → hủy cái cũ
            old.cancel();
            driverAssignmentRepository.save(old);
            // Sync in-memory: loại bỏ assignment cũ khỏi crew list
            trip.getCrew().remove(old);
            log.info("Hủy phân công tài xế cũ {} cho chuyến {}", old.getDriver().getFullName(), trip.getId());
        }

        // Tạo DriverAssignment mới cho MAIN_DRIVER
        DriverAssignment da = new DriverAssignment();
        da.setTrip(trip);
        da.setDriver(driver);
        da.setRole(CrewRole.MAIN_DRIVER);
        da.setStatus(DriverAssignmentStatus.PENDING);
        driverAssignmentRepository.save(da);

        // Sync in-memory: thêm assignment mới vào crew list để TripMapper trả đúng
        // driverName
        trip.getCrew().add(da);

        log.info("Gán tài xế {} cho chuyến {}", driver.getFullName(), trip.getId());
    }

    // ==================== VALIDATION ====================

    private void validateBusNotBusy(Bus bus, Trip trip) {
        if (tripRepository.existsBusOverlap(bus.getId(), trip.getStartDateTime(), trip.getExpectedArrivalTime(),
                trip.getId())) {
            throw new BusinessException("BUS_BUSY", "Xe " + bus.getLicensePlate() + " bị trùng lịch với chuyến khác.");
        }
    }

    /**
     * Validate xe đã đăng ký khai thác tuyến (RouteRegistration ACTIVE).
     * Nếu tuyến chưa có đăng ký nào → bỏ qua (fallback cho dữ liệu cũ).
     */
    private void validateBusRegisteredForRoute(Trip trip, Long busId) {
        Long routeId = trip.getRouteId();
        List<Long> registeredBusIds = routeRegistrationRepository.findActiveBusIdsByRouteId(routeId);

        // Fallback: chưa có đăng ký → bỏ qua validate
        if (registeredBusIds.isEmpty()) {
            log.warn("Tuyến {} chưa có xe đăng ký, bỏ qua validate đăng ký.", routeId);
            return;
        }

        if (!routeRegistrationRepository.existsByRouteIdAndBusIdAndStatus(
                routeId, busId, RegistrationStatus.ACTIVE)) {
            throw new BusinessException("BUS_NOT_REGISTERED",
                    "Xe chưa đăng ký khai thác tuyến này. Vi phạm quy định phù hiệu.");
        }
    }

    /**
     * Validate loại xe phù hợp lịch chạy (ScheduleBusType effective).
     * Nếu lịch chưa có quy định loại xe → bỏ qua.
     */
    private void validateBusTypeForSchedule(Trip trip, Bus bus) {
        if (trip.getTripSchedule() == null)
            return;

        List<Long> allowedBusTypeIds = scheduleBusTypeRepository
                .findEffectiveBusTypeIdsByScheduleId(trip.getTripSchedule().getId());

        // Chưa có quy định → bỏ qua
        if (allowedBusTypeIds.isEmpty())
            return;

        if (bus.getBusType() == null || !allowedBusTypeIds.contains(bus.getBusType().getId())) {
            throw new BusinessException("BUS_TYPE_NOT_ALLOWED",
                    "Loại xe không phù hợp với lịch chạy.");
        }
    }
}
