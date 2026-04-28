package com.bus.system.modules.operation.service.impl;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.identity.repository.UserRepository;
import com.bus.system.modules.operation.domain.DriverAssignment;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.domain.enums.CrewRole;
import com.bus.system.modules.operation.domain.enums.DriverAssignmentStatus;
import com.bus.system.modules.operation.repository.DriverAssignmentRepository;
import com.bus.system.modules.operation.repository.TripRepository;
import com.bus.system.modules.operation.service.DriverAssignmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Service quản lý Phân công tài xế.
 * Sử dụng Optimistic Locking (@Version trong BaseEntity) thay vì Redis Lock.
 *
 * Nguyên tắc:
 * - Mỗi trip có N DriverAssignment (lái chính + phụ + phụ xe).
 * - Tối đa 1 MAIN_DRIVER per trip.
 * - Swap giữa đường: old → ENDED_EARLY, new → ACTIVE.
 *
 * Race Condition: @Version trên BaseEntity → nếu 2 admin cùng gán,
 * người sau sẽ nhận OptimisticLockException → FE retry hoặc thông báo lỗi.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DriverAssignmentServiceImpl implements DriverAssignmentService {

    private static final List<DriverAssignmentStatus> ACTIVE_STATUSES = List.of(
            DriverAssignmentStatus.PENDING,
            DriverAssignmentStatus.ACTIVE);

    private final DriverAssignmentRepository driverAssignmentRepository;
    private final UserRepository userRepository;
    private final TripRepository tripRepository;

    // ==================== ASSIGN SINGLE ====================

    @Override
    @Transactional
    public DriverAssignment assignDriver(Trip trip, Long driverId, CrewRole role) {
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", driverId));

        // Check duplicate: driver đã gán vào trip chưa
        if (driverAssignmentRepository.existsByTripIdAndDriverIdAndStatusIn(
                trip.getId(), driverId, ACTIVE_STATUSES)) {
            throw new BusinessException(
                    "Tài xế " + driver.getFullName() + " đã được gán cho chuyến này rồi.");
        }

        // Check driver overlap: bận chuyến khác cùng thời gian
        LocalDateTime tripStart = trip.getStartDateTime();
        LocalDateTime tripEnd = trip.getExpectedArrivalTime();
        if (tripStart != null && tripEnd != null) {
            boolean driverBusy = tripRepository.existsDriverOverlap(
                    driverId, tripStart, tripEnd, trip.getId());
            if (driverBusy) {
                throw new BusinessException(
                        "Tài xế " + driver.getFullName() + " đang bận chuyến khác trong khung giờ này.");
            }
        }

        // Check max 1 MAIN_DRIVER per trip
        if (role == CrewRole.MAIN_DRIVER) {
            boolean hasMain = driverAssignmentRepository.existsByTripIdAndRoleAndStatusIn(
                    trip.getId(), CrewRole.MAIN_DRIVER, ACTIVE_STATUSES);
            if (hasMain) {
                throw new BusinessException(
                        "Chuyến này đã có tài xế chính. Mỗi chuyến chỉ được phép 1 tài xế chính.");
            }
        }

        DriverAssignment assignment = new DriverAssignment();
        assignment.setTrip(trip);
        assignment.setDriver(driver);
        assignment.setRole(role);

        // saveAndFlush: đảm bảo Postgres IDENTITY sequence gán ID ngay lập tức
        // Cần thiết để replaceDriver() có thể gọi updateActualStartTime(id, ...) sau đó
        driverAssignmentRepository.saveAndFlush(assignment);
        log.info("Gán tài xế {} ({}) vào Trip {} với role {}",
                driver.getFullName(), driverId, trip.getCode(), role);
        return assignment;
    }

    // ==================== ASSIGN BATCH (Optimistic Lock) ====================

    /**
     * Gán batch nhân sự — Optimistic Locking.
     *
     * Flow:
     * 1. Validate input: không trùng driverId trong list, không rỗng
     * 2. Pre-validate toàn bộ: duplicate check + overlap check + max 1 MAIN_DRIVER
     * 3. Nếu OK → insert batch (trong @Transactional)
     * 4. Nếu conflict → OptimisticLockException → Spring tự rollback
     */
    @Override
    @Transactional
    public List<DriverAssignment> assignBatchCrew(Long tripId, List<CrewAssignItem> assignments) {

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Chuyến xe", "id", tripId));

        // 1. INPUT VALIDATION
        if (assignments == null || assignments.isEmpty()) {
            throw new BusinessException("Danh sách nhân sự không được để trống.");
        }

        // Check trùng driverId TRONG BATCH
        Set<Long> driverIdsInBatch = new HashSet<>();
        for (CrewAssignItem item : assignments) {
            if (!driverIdsInBatch.add(item.driverId())) {
                throw new BusinessException(
                        "Trùng tài xế trong danh sách gán (ID: " + item.driverId() + ").");
            }
        }

        // 2. PRE-VALIDATE ALL
        LocalDateTime tripStart = trip.getStartDateTime();
        LocalDateTime tripEnd = trip.getExpectedArrivalTime();

        List<User> drivers = new ArrayList<>();
        for (CrewAssignItem item : assignments) {
            User driver = userRepository.findById(item.driverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Nhân sự", "id", item.driverId()));
            drivers.add(driver);

            // Check duplicate
            if (driverAssignmentRepository.existsByTripIdAndDriverIdAndStatusIn(
                    tripId, item.driverId(), ACTIVE_STATUSES)) {
                throw new BusinessException(
                        "Tài xế " + driver.getFullName() + " đã được gán cho chuyến này rồi.");
            }

            // Check overlap
            if (tripStart != null && tripEnd != null) {
                boolean busy = tripRepository.existsDriverOverlap(
                        item.driverId(), tripStart, tripEnd, tripId);
                if (busy) {
                    throw new BusinessException(
                            "Tài xế " + driver.getFullName() + " đang bận chuyến khác trong khung giờ này.");
                }
            }
        }

        // Check max 1 MAIN_DRIVER per trip (cả DB hiện tại + batch đang gán)
        long mainDriverInBatch = assignments.stream()
                .filter(a -> a.role() == CrewRole.MAIN_DRIVER)
                .count();
        if (mainDriverInBatch > 1) {
            throw new BusinessException(
                    "Batch chứa nhiều hơn 1 tài xế chính. Mỗi chuyến chỉ được phép 1 tài xế chính.");
        }
        if (mainDriverInBatch == 1) {
            boolean hasMain = driverAssignmentRepository.existsByTripIdAndRoleAndStatusIn(
                    tripId, CrewRole.MAIN_DRIVER, ACTIVE_STATUSES);
            if (hasMain) {
                throw new BusinessException(
                        "Chuyến này đã có tài xế chính. Mỗi chuyến chỉ được phép 1 tài xế chính.");
            }
        }

        // 3. BATCH INSERT
        List<DriverAssignment> results = new ArrayList<>();
        for (int i = 0; i < assignments.size(); i++) {
            CrewAssignItem item = assignments.get(i);
            User driver = drivers.get(i);

            DriverAssignment assignment = new DriverAssignment();
            assignment.setTrip(trip);
            assignment.setDriver(driver);
            assignment.setRole(item.role());

            driverAssignmentRepository.save(assignment);
            results.add(assignment);

            log.info("Batch gán tài xế {} ({}) vào Trip {} với role {}",
                    driver.getFullName(), item.driverId(), trip.getCode(), item.role());
        }

        log.info("Batch assign hoàn thành: {} nhân sự → Trip {}",
                results.size(), trip.getCode());
        return results;
    }

    // ==================== SWAP & CANCEL ====================

    @Override
    @Transactional
    public DriverAssignment replaceDriver(Long driverAssignmentId, Long newDriverId) {
        DriverAssignment oldAssignment = findById(driverAssignmentId);
        LocalDateTime swapTime = LocalDateTime.now();

        // Entity tự validate + chuyển trạng thái ACTIVE → ENDED_EARLY
        oldAssignment.endEarly(newDriverId);
        driverAssignmentRepository.save(oldAssignment);

        // assignDriver() đã gọi save() bên trong → entity được persist với ID
        DriverAssignment newAssignment = assignDriver(
                oldAssignment.getTrip(), newDriverId, oldAssignment.getRole());

        // Dùng @Modifying JPQL thay vì save() để tránh Hibernate double-flush
        // (save() sau assignDriver() gây duplicate INSERT do entity vẫn trong dirty state)
        driverAssignmentRepository.updateActualStartTime(newAssignment.getId(), swapTime);
        newAssignment.setActualStartTime(swapTime); // sync in-memory state

        log.info("Swap tài xế trên Trip {}: {} → {} lúc {}",
                oldAssignment.getTrip().getCode(),
                oldAssignment.getDriver().getFullName(),
                newAssignment.getDriver().getFullName(),
                swapTime);

        return newAssignment;
    }


    @Override
    @Transactional
    public void cancelAssignment(Long driverAssignmentId) {
        DriverAssignment assignment = findById(driverAssignmentId);

        // Entity tự validate (ACTIVE|PENDING) + chuyển trạng thái
        assignment.cancel();

        driverAssignmentRepository.save(assignment);
        log.info("Hủy phân công tài xế {} trên Trip {}",
                assignment.getDriver().getFullName(), assignment.getTrip().getCode());
    }

    @Override
    public List<DriverAssignment> getActiveCrew(Long tripId) {
        return driverAssignmentRepository.findByTripIdAndStatus(tripId, DriverAssignmentStatus.ACTIVE);
    }

    private DriverAssignment findById(Long id) {
        return driverAssignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DriverAssignment", "id", id));
    }
}
