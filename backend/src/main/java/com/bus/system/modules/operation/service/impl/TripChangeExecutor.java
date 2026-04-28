package com.bus.system.modules.operation.service.impl;

import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.domain.TripChange;
import com.bus.system.modules.operation.domain.enums.BusAssignmentStatus;
import com.bus.system.modules.operation.domain.enums.CrewRole;
import com.bus.system.modules.operation.domain.enums.DriverAssignmentStatus;
import com.bus.system.modules.operation.repository.DriverAssignmentRepository;
import com.bus.system.modules.operation.repository.TripRepository;
import com.bus.system.modules.operation.service.BusAssignmentService;
import com.bus.system.modules.operation.service.DriverAssignmentService;
import com.bus.system.modules.operation.service.VehicleHandoverService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Executor cho TripChange — thực thi swap driver/bus + handover.
 * Tách từ TripChangeServiceImpl để tuân thủ SRP.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TripChangeExecutor {

    private final TripRepository tripRepository;
    private final BusAssignmentService busAssignmentService;
    private final DriverAssignmentService driverAssignmentService;
    private final DriverAssignmentRepository driverAssignmentRepository;
    private final VehicleHandoverService vehicleHandoverService;

    // ==================== EXECUTE ====================

    public void executeCrewOrBusChange(TripChange request) {
        Trip trip = request.getTrip();
        Long oldDriverId = request.getOldDriver() != null ? request.getOldDriver().getId() : null;
        Long oldBusId = request.getOldBus() != null ? request.getOldBus().getId() : null;

        // Đổi crew qua DriverAssignment
        if (request.isCrewChange() && request.getNewDriver() != null) {
            CrewRole targetRole = request.getChangeType().toCrewRole();
            var activeAssignments = driverAssignmentRepository
                    .findByTripIdAndStatus(trip.getId(), DriverAssignmentStatus.ACTIVE);

            var oldAssignment = activeAssignments.stream()
                .filter(da -> da.getRole() == targetRole)
                    .filter(da -> request.getOldDriver() == null
                            || da.getDriver().getId().equals(request.getOldDriver().getId()))
                    .findFirst();

            if (oldAssignment.isPresent()) {
                driverAssignmentService.replaceDriver(
                        oldAssignment.get().getId(), request.getNewDriver().getId());
            } else {
                driverAssignmentService.assignDriver(
                        trip, request.getNewDriver().getId(), targetRole);
            }
        }

        // Đổi xe — chỉ save trip khi có thay đổi trên trip entity (bus assignment)
        if (request.getNewBus() != null) {
            var currentAssignment = trip.getBusAssignment();
            if (currentAssignment != null && shouldEndEarly(currentAssignment.getStatus())) {
                busAssignmentService.endEarly(currentAssignment.getId());
            }
            trip.reassignBus(request.getNewBus());
            trip.setBusAssignment(null);
            // Chỉ save khi bus thay đổi — tránh Hibernate flush session gây duplicate INSERT DriverAssignment
            tripRepository.save(trip);
            busAssignmentService.attachTripToBusAssignment(trip);
            tripRepository.save(trip);
        }
        // Lưu ý: KHÔNG gọi tripRepository.save(trip) cho crew-only change
        // vì điều đó gây Hibernate flush toàn session, tái-INSERT DriverAssignment đã lưu (BUG #001)


        vehicleHandoverService.processResourceChange(trip, oldDriverId, oldBusId,
                request.getRequestReason(),
                Boolean.TRUE.equals(request.getIsEmergency()),
                request.getCreatedBy());
    }

    // ==================== ROLLBACK ====================

    public void rollbackCrewOrBusChange(TripChange request, Long rollbackByUserId) {
        Trip trip = request.getTrip();
        CrewRole targetRole = request.getChangeType().toCrewRole();

        if (request.getOldDriver() != null && request.getNewDriver() != null) {

            // Bước 1: Tìm và hủy assignment đang ACTIVE hoặc PENDING của newDriver
            // (chuyến đã DEPARTED: newDriver vẫn có thể còn ACTIVE)
            driverAssignmentRepository
                    .findByTripIdAndStatus(trip.getId(), DriverAssignmentStatus.ACTIVE).stream()
                    .filter(da -> da.getRole() == targetRole)
                    .filter(da -> da.getDriver().getId().equals(request.getNewDriver().getId()))
                    .findFirst()
                    .ifPresent(da -> {
                        // Force set CANCELLED trực tiếp - bỏ qua domain state check
                        // vì đây là thao tác rollback đặc biệt, không phải luồng nghiệp vụ thường
                        da.setStatus(com.bus.system.modules.operation.domain.enums.DriverAssignmentStatus.CANCELLED);
                        driverAssignmentRepository.saveAndFlush(da);
                        log.warn("ROLLBACK: Hủy assignment newDriver {} (tripId={})",
                                request.getNewDriver().getFullName(), trip.getId());
                    });

            // Cũng kiểm tra PENDING (chuyến chưa xuất phát)
            driverAssignmentRepository
                    .findByTripIdAndStatus(trip.getId(), DriverAssignmentStatus.PENDING).stream()
                    .filter(da -> da.getRole() == targetRole)
                    .filter(da -> da.getDriver().getId().equals(request.getNewDriver().getId()))
                    .findFirst()
                    .ifPresent(da -> {
                        da.setStatus(com.bus.system.modules.operation.domain.enums.DriverAssignmentStatus.CANCELLED);
                        driverAssignmentRepository.saveAndFlush(da);
                        log.warn("ROLLBACK: Hủy assignment PENDING newDriver {} (tripId={})",
                                request.getNewDriver().getFullName(), trip.getId());
                    });

            // Bước 2: Gán lại oldDriver — chỉ khi chưa có assignment ACTIVE/PENDING
            boolean oldDriverAlreadyActive = driverAssignmentRepository
                    .existsByTripIdAndDriverIdAndStatusIn(
                            trip.getId(), request.getOldDriver().getId(),
                            List.of(DriverAssignmentStatus.ACTIVE, DriverAssignmentStatus.PENDING));

            if (!oldDriverAlreadyActive) {
                driverAssignmentService.assignDriver(trip, request.getOldDriver().getId(), targetRole);
                log.info("ROLLBACK: Gán lại oldDriver {} vào trip {} role {}",
                        request.getOldDriver().getFullName(), trip.getId(), targetRole);
            } else {
                log.info("ROLLBACK: oldDriver {} đã có assignment, bỏ qua gán lại.",
                        request.getOldDriver().getFullName());
            }
        }

        if (request.getOldBus() != null) {
            var currentAssignment = trip.getBusAssignment();
            if (currentAssignment != null && shouldEndEarly(currentAssignment.getStatus())) {
                busAssignmentService.endEarly(currentAssignment.getId());
            }
            trip.reassignBus(request.getOldBus());
            trip.setBusAssignment(null);
        }
        tripRepository.save(trip);

        if (request.getOldBus() != null) {
            busAssignmentService.attachTripToBusAssignment(trip);
            tripRepository.save(trip);
        }

        vehicleHandoverService.processResourceChange(trip,
                request.getNewDriver() != null ? request.getNewDriver().getId() : null,
                request.getNewBus() != null ? request.getNewBus().getId() : null,
                "[ROLLBACK] Hoàn tác #" + request.getId(), false, rollbackByUserId);
    }

    private boolean shouldEndEarly(BusAssignmentStatus status) {
        return status == BusAssignmentStatus.PENDING
                || status == BusAssignmentStatus.CHECKED_IN
                || status == BusAssignmentStatus.DEPARTED;
    }

}
