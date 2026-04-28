package com.bus.system.modules.operation.service.impl;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.catalog.domain.Depot;
import com.bus.system.modules.catalog.repository.DepotRepository;
import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.fleet.repository.BusRepository;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.identity.repository.UserRepository;
import com.bus.system.modules.operation.domain.BusAssignment;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.domain.enums.BusAssignmentStatus;
import com.bus.system.modules.operation.domain.enums.TripStatus;
import com.bus.system.modules.operation.dto.request.CreateBusAssignmentRequest;
import com.bus.system.modules.operation.dto.request.UpdateBusAssignmentRequest;
import com.bus.system.modules.operation.dto.response.BusAssignmentResponse;
import com.bus.system.modules.operation.mapper.BusAssignmentMapper;
import com.bus.system.modules.operation.repository.BusAssignmentRepository;
import com.bus.system.modules.operation.repository.TripRepository;
import com.bus.system.modules.operation.service.BusAssignmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.EntityManager;

/**
 * Service quản lý Ca xe (Bus Assignment).
 *
 * Nguyên tắc:
 * - Một bus + cùng ngày → gắn vào ca có sẵn (không tạo trùng).
 * - CHECK-IN/OUT xe tại bãi ghi ODO, fuel, quản bãi xác nhận.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BusAssignmentServiceImpl implements BusAssignmentService {

        private final BusAssignmentRepository busAssignmentRepository;
        private final BusAssignmentMapper busAssignmentMapper;
        private final BusRepository busRepository;
        private final DepotRepository depotRepository;
        private final TripRepository tripRepository;
        private final UserRepository userRepository;
        private final EntityManager entityManager;

        // ==================== ATTACH (Auto) ====================

        @Override
        @Transactional
        public void attachTripToBusAssignment(Trip trip) {
                if (trip.getBusId() == null) {
                        throw new BusinessException("Trip chưa có xe được gán.");
                }

                LocalDateTime tripStart = trip.getStartDateTime();
                LocalDateTime tripEnd = trip.getExpectedArrivalTime();

                if (tripStart == null || tripEnd == null) {
                        throw new BusinessException("Trip chưa có thời gian khởi hành hoặc dự kiến tới.");
                }

                List<BusAssignmentStatus> activeStatuses = List.of(
                                BusAssignmentStatus.PENDING,
                                BusAssignmentStatus.CHECKED_IN,
                                BusAssignmentStatus.DEPARTED);

                var existingAssignment = busAssignmentRepository
                                .findByBusIdAndStatusInAndScheduledStartLessThanEqualAndScheduledEndGreaterThanEqual(
                                                trip.getBusId(), activeStatuses, tripEnd, tripStart);

                if (existingAssignment.isPresent()) {
                        trip.setBusAssignment(existingAssignment.get());
                        log.info("Trip {} gắn vào BusAssignment #{} (có sẵn)",
                                        trip.getCode(), existingAssignment.get().getId());
                } else {
                        BusAssignment assignment = new BusAssignment();
                        assignment.setBus(trip.getBus());
                        assignment.setScheduledStart(tripStart);
                        assignment.setScheduledEnd(tripEnd);
                        assignment.setStatus(BusAssignmentStatus.PENDING);

                        var lastCompleted = busAssignmentRepository
                                        .findLastCompletedWithDepot(trip.getBusId());
                        lastCompleted.ifPresent(last -> assignment.setStartDepot(last.getEndDepot()));

                        busAssignmentRepository.save(assignment);
                        trip.setBusAssignment(assignment);
                        log.info("Tạo BusAssignment #{} mới cho Trip {}",
                                        assignment.getId(), trip.getCode());
                }
        }

        // ==================== CREATE / LIST / ASSIGN (Manual) ====================

        @Override
        @Transactional
        public BusAssignmentResponse createBusAssignment(CreateBusAssignmentRequest request) {
                Bus bus = busRepository.findById(request.getBusId())
                                .orElseThrow(() -> new ResourceNotFoundException("Xe", "id", request.getBusId()));

                if (!bus.isActive()) {
                        throw new BusinessException("Xe " + bus.getLicensePlate() + " đang không hoạt động.");
                }

                // Kiểm tra overlap: cùng xe không được có 2 ca trùng thời gian
                List<BusAssignment> overlapping = busAssignmentRepository.findByBusIdAndDateRange(
                                bus.getId(), request.getScheduledStart(), request.getScheduledEnd());
                // Loại bỏ ca đã COMPLETED / CANCELLED
                List<BusAssignment> activeOverlapping = overlapping.stream()
                                .filter(ba -> ba.getStatus() != BusAssignmentStatus.COMPLETED
                                                && ba.getStatus() != BusAssignmentStatus.CANCELLED
                                                && ba.getStatus() != BusAssignmentStatus.ENDED_EARLY)
                                .toList();
                if (!activeOverlapping.isEmpty()) {
                        BusAssignment existing = activeOverlapping.get(0);
                        throw new BusinessException(
                                        "Xe " + bus.getLicensePlate() + " đã có ca xe #" + existing.getId()
                                                        + " (" + existing.getScheduledStart().toLocalTime()
                                                        + " → " + existing.getScheduledEnd().toLocalTime()
                                                        + ") trùng thời gian. Không thể tạo ca xe mới.");
                }

                BusAssignment assignment = new BusAssignment();
                assignment.setBus(bus);
                assignment.setScheduledStart(request.getScheduledStart());
                assignment.setScheduledEnd(request.getScheduledEnd());
                assignment.setStatus(BusAssignmentStatus.PENDING);
                assignment.setNotes(request.getNotes());

                if (request.getStartDepotId() != null) {
                        Depot depot = depotRepository.findById(request.getStartDepotId())
                                        .orElseThrow(() -> new ResourceNotFoundException("Bãi xe", "id",
                                                        request.getStartDepotId()));
                        assignment.setStartDepot(depot);
                } else {
                        // Tự suy bãi xuất từ ca gần nhất (bãi nhập trước = bãi xuất hiện tại)
                        var lastCompleted = busAssignmentRepository.findLastCompletedWithDepot(bus.getId());
                        if (lastCompleted.isPresent()) {
                                assignment.setStartDepot(lastCompleted.get().getEndDepot());
                        }
                }

                assignment = busAssignmentRepository.save(assignment);
                entityManager.flush(); // Flush để assignment có ID persistent trước khi gán trips
                log.info("Tạo Ca xe #{} cho xe {} ({} → {})",
                                assignment.getId(), bus.getLicensePlate(),
                                request.getScheduledStart(), request.getScheduledEnd());

                // Gán trips ngay nếu có
                if (request.getTripIds() != null && !request.getTripIds().isEmpty()) {
                        for (Long tripId : request.getTripIds()) {
                                Trip trip = tripRepository.findById(tripId)
                                                .orElseThrow(() -> new ResourceNotFoundException("Chuyến", "id",
                                                                tripId));

                                if (trip.getStatus() != TripStatus.SCHEDULED) {
                                        throw new BusinessException(
                                                        "Chuyến " + trip.getCode() + " không ở trạng thái SCHEDULED.");
                                }
                                if (trip.getBusAssignment() != null) {
                                        throw new BusinessException(
                                                        "Chuyến " + trip.getCode() + " đã thuộc ca xe khác.");
                                }

                                // Validate trip nằm trong khoảng thời gian ca xe
                                validateTripWithinAssignment(trip, assignment);

                                // Gán bus cho trip
                                if (trip.getBusId() == null) {
                                        trip.assignBus(bus);
                                }
                                trip.setBusAssignment(assignment);
                                tripRepository.save(trip);
                                log.info("Gán Trip {} vào Ca xe #{} (khi tạo)", trip.getCode(), assignment.getId());
                        }
                        entityManager.flush();
                        entityManager.refresh(assignment);
                }

                return busAssignmentMapper.toResponse(assignment);
        }

        @Override
        @Transactional(readOnly = true)
        public List<BusAssignmentResponse> listBusAssignments(LocalDate date, Long busId) {
                LocalDateTime startOfDay = date.atStartOfDay();
                LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

                List<BusAssignment> assignments;
                if (busId != null) {
                        assignments = busAssignmentRepository.findByBusIdAndDateRange(busId, startOfDay, endOfDay);
                } else {
                        assignments = busAssignmentRepository.findByDateRange(startOfDay, endOfDay);
                }

                return busAssignmentMapper.toResponseList(assignments);
        }

        @Override
        @Transactional
        public BusAssignmentResponse assignTripToAssignment(Long busAssignmentId, Long tripId) {
                BusAssignment assignment = findById(busAssignmentId);
                Trip trip = tripRepository.findById(tripId)
                                .orElseThrow(() -> new ResourceNotFoundException("Chuyến", "id", tripId));

                // Validate
                if (trip.getStatus() != TripStatus.SCHEDULED) {
                        throw new BusinessException("Chỉ có thể gán chuyến SCHEDULED vào ca xe.");
                }
                if (trip.getBusAssignment() != null) {
                        throw new BusinessException("Chuyến " + trip.getCode() + " đã thuộc ca xe khác.");
                }

                // Validate trip nằm trong khoảng thời gian ca xe
                validateTripWithinAssignment(trip, assignment);

                // Gán bus cho trip (nếu chưa có)
                if (trip.getBusId() == null) {
                        trip.assignBus(assignment.getBus());
                } else if (!trip.getBusId().equals(assignment.getBus().getId())) {
                        throw new BusinessException("Chuyến đã gán xe khác. Vui lòng gỡ xe trước.");
                }

                trip.setBusAssignment(assignment);
                tripRepository.save(trip);

                log.info("Gán Trip {} vào BusAssignment #{}", trip.getCode(), busAssignmentId);

                // Flush + refresh để Hibernate nạp lại entity từ DB (bao gồm lazy trips
                // collection)
                entityManager.flush();
                entityManager.refresh(assignment);
                return busAssignmentMapper.toResponse(assignment);
        }

        // ==================== CHECK-IN / CHECK-OUT ====================

        @Override
        @Transactional
        public void checkInVehicle(Long busAssignmentId, BigDecimal odometer, Integer fuelLevel,
                        String notes, Long byUserId, Long depotId) {
                BusAssignment assignment = findById(busAssignmentId);
                User checkedBy = userRepository.findById(byUserId)
                                .orElseThrow(() -> new ResourceNotFoundException("User", "id", byUserId));

                assignment.checkIn(odometer, fuelLevel, notes, checkedBy);

                // Set bãi xuất nếu có
                if (depotId != null) {
                        Depot depot = depotRepository.findById(depotId)
                                        .orElseThrow(() -> new ResourceNotFoundException("Bãi xe", "id", depotId));
                        assignment.setStartDepot(depot);
                }

                busAssignmentRepository.save(assignment);
                log.info("BusAssignment #{} CHECK-IN: ODO={}, Fuel={}%, Depot={}",
                                busAssignmentId, odometer, fuelLevel, depotId);
        }

        @Override
        @Transactional
        public void checkOutVehicle(Long busAssignmentId, BigDecimal odometer, Integer fuelLevel,
                        String notes, Long byUserId, Long depotId) {
                BusAssignment assignment = findById(busAssignmentId);
                User checkedBy = userRepository.findById(byUserId)
                                .orElseThrow(() -> new ResourceNotFoundException("User", "id", byUserId));

                assignment.checkOut(odometer, fuelLevel, notes, checkedBy);

                // Set bãi nhập nếu có
                if (depotId != null) {
                        Depot depot = depotRepository.findById(depotId)
                                        .orElseThrow(() -> new ResourceNotFoundException("Bãi xe", "id", depotId));
                        assignment.setEndDepot(depot);
                }

                busAssignmentRepository.save(assignment);
                log.info("BusAssignment #{} CHECK-OUT: ODO={}, Fuel={}%, Depot={}",
                                busAssignmentId, odometer, fuelLevel, depotId);
        }

        @Override
        @Transactional
        public void endEarly(Long busAssignmentId) {
                BusAssignment assignment = findById(busAssignmentId);

                // Giải phóng trips SCHEDULED để điều phối xe mới
                // Trips APPROVED / RUNNING giữ nguyên (đang hoặc đã chạy)
                List<Trip> scheduledTrips = tripRepository.findByBusAssignmentIdAndStatus(
                                busAssignmentId, TripStatus.SCHEDULED);
                for (Trip trip : scheduledTrips) {
                        trip.setBusAssignment(null);
                        trip.setBusId(null);
                        tripRepository.save(trip);
                }

                // BUG FIX: Bắt buộc flush về DB ngay sau khi giải phóng trips.
                // Nếu không, Hibernate giữ các thay đổi (null bus_assignment_id) trong cache
                // và chưa ghi xuống DB trước khi đổi trạng thái ca xe.
                // Kết quả: trips vẫn còn liên kết với ca cũ dù ca đã CANCELLED/ENDED_EARLY.
                entityManager.flush();

                assignment.endEarly();
                busAssignmentRepository.save(assignment);
                log.info("BusAssignment #{} {} — giải phóng {} chuyến SCHEDULED để điều phối lại",
                                busAssignmentId, assignment.getStatus(), scheduledTrips.size());
        }

        // ==================== UNASSIGN TRIP ====================

        @Override
        @Transactional
        public BusAssignmentResponse unassignTripFromAssignment(Long busAssignmentId, Long tripId) {
                BusAssignment assignment = findById(busAssignmentId);
                Trip trip = tripRepository.findById(tripId)
                                .orElseThrow(() -> new ResourceNotFoundException("Chuyến", "id", tripId));

                assignment.unassignTrip(trip);
                tripRepository.save(trip);

                log.info("Gỡ Trip {} khỏi BusAssignment #{}", trip.getCode(), busAssignmentId);

                // Flush + refresh
                entityManager.flush();
                entityManager.refresh(assignment);
                return busAssignmentMapper.toResponse(assignment);
        }

        // ==================== UPDATE ====================

        @Override
        @Transactional
        public BusAssignmentResponse updateBusAssignment(Long busAssignmentId, UpdateBusAssignmentRequest request) {
                BusAssignment assignment = findById(busAssignmentId);

                // Chỉ cho phép update khi chưa xuất bãi
                if (assignment.getStatus() != BusAssignmentStatus.PENDING) {
                        throw new BusinessException("Chỉ có thể cập nhật ca xe ở trạng thái Chờ duyệt.");
                }

                boolean timeChanged = false;

                if (request.getScheduledStart() != null) {
                        assignment.setScheduledStart(request.getScheduledStart());
                        timeChanged = true;
                }
                if (request.getScheduledEnd() != null) {
                        assignment.setScheduledEnd(request.getScheduledEnd());
                        timeChanged = true;
                }
                if (request.getNotes() != null) {
                        assignment.setNotes(request.getNotes());
                }

                // Nếu đổi thời gian → kiểm tra overlap
                if (timeChanged) {
                        List<BusAssignment> overlapping = busAssignmentRepository.findByBusIdAndDateRange(
                                        assignment.getBus().getId(),
                                        assignment.getScheduledStart(),
                                        assignment.getScheduledEnd());
                        List<BusAssignment> activeOverlapping = overlapping.stream()
                                        .filter(ba -> !ba.getId().equals(busAssignmentId))
                                        .filter(ba -> ba.getStatus() != BusAssignmentStatus.COMPLETED
                                                        && ba.getStatus() != BusAssignmentStatus.CANCELLED
                                                        && ba.getStatus() != BusAssignmentStatus.ENDED_EARLY)
                                        .toList();
                        if (!activeOverlapping.isEmpty()) {
                                BusAssignment existing = activeOverlapping.get(0);
                                throw new BusinessException(
                                                "Xe " + assignment.getBus().getLicensePlate() + " đã có ca xe #"
                                                                + existing.getId()
                                                                + " trùng thời gian. Không thể cập nhật.");
                        }

                        // Kiểm tra thời gian mới có bao phủ tất cả trips đã gán không
                        validateAllTripsWithinAssignment(assignment);
                }

                busAssignmentRepository.save(assignment);
                log.info("Cập nhật Ca xe #{}: {} → {}",
                                busAssignmentId, assignment.getScheduledStart(), assignment.getScheduledEnd());

                entityManager.flush();
                entityManager.refresh(assignment);
                return busAssignmentMapper.toResponse(assignment);
        }

        // ==================== PRIVATE HELPERS ====================

        private BusAssignment findById(Long id) {
                return busAssignmentRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("BusAssignment", "id", id));
        }

        /**
         * Validate: thời gian trip phải nằm trong khoảng scheduledStart..scheduledEnd của ca xe.
         * Giờ xuất bãi (scheduledStart) phải <= giờ khởi hành trip.
         * Giờ nhập bãi (scheduledEnd) phải >= giờ kết thúc trip.
         */
        private void validateTripWithinAssignment(Trip trip, BusAssignment assignment) {
                LocalDateTime tripStart = trip.getStartDateTime();
                LocalDateTime tripEnd = trip.getExpectedArrivalTime();
                if (tripStart == null || tripEnd == null) return; // skip nếu trip chưa có thời gian

                if (assignment.getScheduledStart() != null && tripStart.isBefore(assignment.getScheduledStart())) {
                        throw new BusinessException(
                                "Chuyến " + trip.getCode() + " khởi hành lúc " + tripStart.toLocalTime()
                                        + " trước giờ xuất bãi (" + assignment.getScheduledStart().toLocalTime()
                                        + "). Vui lòng điều chỉnh giờ xuất bãi.");
                }
                if (assignment.getScheduledEnd() != null && tripEnd.isAfter(assignment.getScheduledEnd())) {
                        throw new BusinessException(
                                "Chuyến " + trip.getCode() + " kết thúc lúc " + tripEnd.toLocalTime()
                                        + " sau giờ nhập bãi (" + assignment.getScheduledEnd().toLocalTime()
                                        + "). Vui lòng điều chỉnh giờ nhập bãi.");
                }
        }

        /**
         * Validate tất cả trips đã gán phải nằm trong khoảng thời gian ca xe (dùng khi update thời gian ca).
         */
        private void validateAllTripsWithinAssignment(BusAssignment assignment) {
                List<Trip> trips = tripRepository.findByBusAssignmentId(assignment.getId());
                for (Trip trip : trips) {
                        validateTripWithinAssignment(trip, assignment);
                }
        }

}
