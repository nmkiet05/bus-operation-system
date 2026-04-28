package com.bus.system.modules.planning.service.impl;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.planning.domain.PickupPoint;
import com.bus.system.modules.planning.dto.request.PickupPointRequest;
import com.bus.system.modules.planning.dto.response.PickupPointResponse;
import com.bus.system.modules.planning.mapper.PickupPointMapper;
import com.bus.system.modules.planning.repository.PickupPointRepository;
import com.bus.system.modules.planning.repository.RouteRepository;
import com.bus.system.modules.planning.service.PickupPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PickupPointServiceImpl implements PickupPointService {

    private final PickupPointRepository pickupPointRepository;
    private final RouteRepository routeRepository;
    private final PickupPointMapper pickupPointMapper;

    @Override
    @Transactional
    public PickupPointResponse createPickupPoint(Long routeId, PickupPointRequest request) {
        // Validate route exists
        if (!routeRepository.existsById(routeId)) {
            throw new ResourceNotFoundException("Route không tồn tại với id: " + routeId);
        }

        // Validate sequence order unique (chỉ check trong các bản ghi chưa bị xóa mềm)
        if (pickupPointRepository.existsByRouteIdAndSequenceOrderAndDeletedAtIsNull(
                routeId, request.getSequenceOrder())) {
            throw new BusinessException("Thứ tự " + request.getSequenceOrder() + " đã tồn tại trên tuyến này");
        }

        PickupPoint entity = pickupPointMapper.toEntity(request, routeId);
        PickupPoint saved = pickupPointRepository.save(entity);
        return pickupPointMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public PickupPointResponse updatePickupPoint(Long id, PickupPointRequest request) {
        PickupPoint existing = pickupPointRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup Point không tồn tại"));

        // Validate sequence order nếu thay đổi
        if (!existing.getSequenceOrder().equals(request.getSequenceOrder())) {
            if (pickupPointRepository.existsByRouteIdAndSequenceOrderAndDeletedAtIsNull(
                    existing.getRouteId(), request.getSequenceOrder())) {
                throw new BusinessException("Thứ tự " + request.getSequenceOrder() + " đã tồn tại");
            }
        }

        existing.setName(request.getName());
        existing.setAddress(request.getAddress());
        existing.setLatitude(request.getLatitude());
        existing.setLongitude(request.getLongitude());
        existing.setSequenceOrder(request.getSequenceOrder());
        existing.setEstimatedMinutesFromDeparture(request.getEstimatedMinutesFromDeparture());
        if (request.getStatus() != null) {
            existing.setStatus(request.getStatus());
        }

        PickupPoint updated = pickupPointRepository.save(existing);
        return pickupPointMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void deletePickupPoint(Long id) {
        PickupPoint existing = pickupPointRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup Point không tồn tại"));

        // Soft delete: set deletedAt thay vì xóa vật lý
        existing.setDeletedAt(LocalDateTime.now());
        pickupPointRepository.save(existing);
    }

    @Override
    public List<PickupPointResponse> getPickupPointsByRoute(Long routeId) {
        return pickupPointRepository.findByRouteIdAndDeletedAtIsNullOrderBySequenceOrderAsc(routeId)
                .stream()
                .map(pickupPointMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PickupPointResponse getPickupPointById(Long id) {
        PickupPoint entity = pickupPointRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup Point không tồn tại"));
        return pickupPointMapper.toResponse(entity);
    }
}
