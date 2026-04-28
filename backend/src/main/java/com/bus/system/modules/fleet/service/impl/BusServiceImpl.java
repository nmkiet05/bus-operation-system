package com.bus.system.modules.fleet.service.impl;

import com.bus.system.modules.fleet.domain.enums.BusStatus;
import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.fleet.domain.BusType;
import com.bus.system.modules.fleet.dto.request.BusRequest;
import com.bus.system.modules.fleet.dto.response.BusResponse;
import com.bus.system.modules.fleet.mapper.BusMapper;
import com.bus.system.modules.fleet.repository.BusRepository;
import com.bus.system.modules.fleet.repository.BusTypeRepository;
import com.bus.system.modules.fleet.service.BusService;
import com.bus.system.modules.operation.domain.BusAssignment;
import com.bus.system.modules.operation.repository.BusAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import java.util.List;
import java.util.Set;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BusServiceImpl implements BusService {

    private final BusRepository busRepository;
    private final BusTypeRepository busTypeRepository;
    private final BusAssignmentRepository busAssignmentRepository;
    private final BusMapper busMapper;

    @Override
    @Transactional
    public BusResponse createBus(BusRequest request) {
        if (busRepository.existsByLicensePlate(request.getLicensePlate())) {
            throw new BusinessException("Biển số xe " + request.getLicensePlate() + " đã tồn tại!");
        }

        // 1. Map thông tin cơ bản
        Bus bus = Objects.requireNonNull(busMapper.toEntity(request));

        // 2. Tìm và Gán BusType
        BusType busType = busTypeRepository.findById(Objects.requireNonNull(request.getBusTypeId()))
                .orElseThrow(() -> new ResourceNotFoundException("Loại xe", "id", request.getBusTypeId()));
        bus.setBusType(busType);

        // 3. Set Status mặc định bằng Enum
        bus.setStatus(request.getStatus() != null
                ? BusStatus.valueOf(request.getStatus())
                : BusStatus.ACTIVE);

        Bus savedBus = Objects.requireNonNull(busRepository.save(bus));
        return busMapper.toResponse(savedBus);
    }

    @Override
    @Transactional
    public BusResponse updateBus(Long id, BusRequest request) {
        Bus bus = busRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Xe buýt", "id", id));

        // Update thông tin cơ bản
        busMapper.updateBusFromRequest(bus, request);

        // Update Loại xe nếu có thay đổi
        if (request.getBusTypeId() != null && !request.getBusTypeId().equals(bus.getBusType().getId())) {
            BusType busType = busTypeRepository.findById(Objects.requireNonNull(request.getBusTypeId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Loại xe", "id", request.getBusTypeId()));
            bus.setBusType(busType);
        }

        // Update status bằng Enum
        if (request.getStatus() != null) {
            bus.setStatus(BusStatus.valueOf(request.getStatus()));
        }

        Bus updatedBus = busRepository.save(Objects.requireNonNull(bus));
        return busMapper.toResponse(updatedBus);
    }

    @Override
    @Transactional
    public void deleteBus(Long id) {
        Bus bus = busRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Xe buýt", "id", id));
        bus.setDeletedAt(LocalDateTime.now());
        bus.setStatus(BusStatus.RETIRED); // Dùng Enum
        busRepository.save(bus);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BusResponse> getAllBuses() {
        // JOIN FETCH busType — tránh lazy init, 1 query duy nhất
        List<Bus> buses = busRepository.findAllWithBusType();
        List<BusResponse> responses = buses.stream()
                .map(busMapper::toResponse)
                .collect(Collectors.toList());

        // Batch: lấy depot hiện tại cho tất cả xe (từ last completed assignment)
        Map<Long, BusAssignment> lastCompleted = busAssignmentRepository
                .findLastCompletedPerBus().stream()
                .collect(Collectors.toMap(
                        ba -> ba.getBus().getId(),
                        ba -> ba,
                        (a, b) -> a // nếu trùng lấy cái đầu
                ));

        for (BusResponse r : responses) {
            BusAssignment last = lastCompleted.get(r.getId());
            if (last != null && last.getEndDepot() != null) {
                r.setCurrentDepotId(last.getEndDepot().getId());
                r.setCurrentDepotName(last.getEndDepot().getName());
            }
        }

        return responses;
    }
}
