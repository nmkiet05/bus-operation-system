package com.bus.system.modules.planning.service.impl;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.planning.domain.Route;
import com.bus.system.modules.planning.dto.request.RouteRequest;
import com.bus.system.modules.planning.dto.response.RouteResponse;
import com.bus.system.modules.planning.mapper.RouteMapper;
import com.bus.system.modules.planning.repository.RouteRepository;
import com.bus.system.modules.planning.service.RouteService;
import com.bus.system.modules.catalog.domain.BusStation;
import com.bus.system.modules.catalog.repository.StationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.bus.system.modules.planning.contract.RouteStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RouteServiceImpl implements RouteService {

    private final RouteRepository routeRepository;
    private final RouteMapper routeMapper;
    private final StationRepository busStationRepository;

    @Override
    @Transactional
    public RouteResponse createRoute(RouteRequest request) {
        if (!StringUtils.hasText(request.getCode())) {
            // Auto generate legal code based on Vietnam laws
            BusStation dep = busStationRepository.findById(request.getDepartureStationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bến đi", "id", request.getDepartureStationId()));
            BusStation arr = busStationRepository.findById(request.getArrivalStationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bến đến", "id", request.getArrivalStationId()));

            String depCode = dep.getProvince() != null ? dep.getProvince().getGovCode() : "00";
            String arrCode = arr.getProvince() != null ? arr.getProvince().getGovCode() : "00";
            long seq = routeRepository.count() + 1;
            request.setCode(String.format("%s%s-%04d", depCode, arrCode, seq));
        }

        // 1. Validate Code trùng
        if (routeRepository.existsByCode(request.getCode())) {
            throw new BusinessException("Mã tuyến " + request.getCode() + " đã tồn tại!");
        }

        // 2. Map Entity
        Route route = Objects.requireNonNull(routeMapper.toEntity(request));

        // 3. Set Default nếu null
        if (route.getStatus() == null)
            route.setStatus(RouteStatus.DRAFT.name()); // Mặc định DRAFT theo DB
        if (route.getHotline() == null)
            route.setHotline("1900xxxx"); // Mặc định theo DB

        // 4. Save
        Route savedRoute = Objects.requireNonNull(routeRepository.save(route));
        return routeMapper.toResponse(savedRoute);
    }

    @Override
    @Transactional
    public RouteResponse updateRoute(Long id, RouteRequest request) {
        Route route = routeRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Tuyến đường", "id", id));

        // Logic check: Không cho sửa Code
        routeMapper.updateRouteFromRequest(route, request);

        Route updatedRoute = routeRepository.save(Objects.requireNonNull(route));
        return routeMapper.toResponse(updatedRoute);
    }

    public RouteResponse getRouteById(Long id) {
        Route route = routeRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Tuyến đường", "id", id));
        return routeMapper.toResponse(route);
    }

    @Override
    public List<RouteResponse> getAllRoutes() {
        return routeRepository.findByDeletedAtIsNull().stream()
                .map(routeMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteRoute(Long id) {
        Route route = routeRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Tuyến đường", "id", id));
        route.setDeletedAt(LocalDateTime.now());
        routeRepository.save(route);
    }

    @Override
    @Transactional
    public void restoreRoute(Long id) {
        Route route = routeRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Tuyến đường", "id", id));
        route.setDeletedAt(null);
        routeRepository.save(route);
    }

    @Override
    public List<RouteResponse> getDeletedRoutes() {
        return routeRepository.findByDeletedAtIsNotNullOrderByUpdatedAtDesc().stream()
                .map(routeMapper::toResponse)
                .collect(Collectors.toList());
    }
}