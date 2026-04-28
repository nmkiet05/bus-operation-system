package com.bus.system.modules.operation.service.impl;

import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.dto.response.TripResponse;
import com.bus.system.modules.operation.mapper.TripMapper;
import com.bus.system.modules.operation.repository.TripRepository;
import com.bus.system.modules.operation.service.TripLifecycleService;
import com.bus.system.modules.operation.service.VehicleHandoverService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service quản lý vòng đời chuyến xe (start, complete).
 * Tách từ TripAssignmentServiceImpl để đúng Single Responsibility.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TripLifecycleServiceImpl implements TripLifecycleService {

    private final TripRepository tripRepository;
    private final TripMapper tripMapper;
    private final VehicleHandoverService vehicleHandoverService;

    @Override
    @Transactional
    public TripResponse startTrip(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Chuyến xe", "id", tripId));

        trip.start(); // Entity tự validate APPROVED + set RUNNING + actualDepartureTime

        trip = tripRepository.save(trip);

        // [Mới] Sinh Biên bản bàn giao khi xe CHÍNH THỨC XUẤT BẾN (Để giải quyết kịch bản xe hỏng dọc đường)
        vehicleHandoverService.createHandoverForTrip(trip);

        log.info("Bắt đầu chuyến đi {}", tripId);

        return tripMapper.toResponse(trip);
    }

    @Override
    @Transactional
    public TripResponse completeTrip(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip", "id", tripId));

        trip.complete(); // Entity tự validate RUNNING + set COMPLETED + arrivalTime

        Trip savedTrip = tripRepository.save(trip);
        return tripMapper.toResponse(savedTrip);
    }

    @Override
    @Transactional
    public void cancelTrip(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Chuyến xe", "id", tripId));

        trip.cancel(); // Entity tự validate SCHEDULED|APPROVED + set CANCELLED

        tripRepository.save(trip);
        log.info("Hủy chuyến xe {}", tripId);
    }
}
