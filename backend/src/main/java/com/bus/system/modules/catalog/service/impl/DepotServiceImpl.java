package com.bus.system.modules.catalog.service.impl;

import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.catalog.domain.Depot;
import com.bus.system.modules.catalog.domain.enums.DepotStatus;
import com.bus.system.modules.catalog.dto.request.DepotRequest;
import com.bus.system.modules.catalog.dto.response.DepotResponse;
import com.bus.system.modules.catalog.mapper.DepotMapper;
import com.bus.system.modules.catalog.repository.DepotRepository;
import com.bus.system.modules.catalog.service.DepotService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Depot Service Implementation — Full CRUD
 *
 * Depot là dữ liệu vận hành do công ty quản lý (không phải Master Data pháp
 * lý).
 */
@Service
@RequiredArgsConstructor
public class DepotServiceImpl implements DepotService {

    private final DepotRepository depotRepository;
    private final DepotMapper depotMapper;

    @Override
    @Transactional
    public DepotResponse createDepot(DepotRequest request) {
        Depot depot = Objects.requireNonNull(depotMapper.toEntity(request));
        return depotMapper.toResponse(depotRepository.save(depot));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepotResponse> getAllDepots() {
        return depotRepository.findByDeletedAtIsNull().stream()
                .map(depotMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DepotResponse updateDepot(Long id, DepotRequest request) {
        Depot depot = depotRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Bãi xe", "id", id));
        depotMapper.updateEntity(depot, request);
        return depotMapper.toResponse(depotRepository.save(depot));
    }

    @Override
    @Transactional
    public void deleteDepot(Long id) {
        Depot depot = depotRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Bãi xe", "id", id));
        // Soft delete: đánh dấu xóa thay vì xóa thật
        depot.setDeletedAt(LocalDateTime.now());
        depot.setStatus(DepotStatus.INACTIVE);
        depotRepository.save(depot);
    }

    @Override
    @Transactional
    public void restoreDepot(Long id) {
        Depot depot = depotRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Bãi xe", "id", id));
        // Khôi phục: xóa dấu xóa và đặt lại trạng thái
        depot.setDeletedAt(null);
        depot.setStatus(DepotStatus.ACTIVE);
        depotRepository.save(depot);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepotResponse> getDeletedDepots() {
        return depotRepository.findByDeletedAtIsNotNullOrderByUpdatedAtDesc().stream()
                .map(depotMapper::toResponse)
                .collect(Collectors.toList());
    }
}
