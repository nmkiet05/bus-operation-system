package com.bus.system.modules.fleet.service.impl;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.fleet.domain.BusType;
import com.bus.system.modules.fleet.dto.request.BusTypeRequest;
import com.bus.system.modules.fleet.dto.response.BusTypeResponse;
import com.bus.system.modules.fleet.mapper.BusTypeMapper;
import com.bus.system.modules.fleet.repository.BusTypeRepository;
import com.bus.system.modules.fleet.service.BusTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BusTypeServiceImpl implements BusTypeService {

    private final BusTypeRepository busTypeRepository;
    private final BusTypeMapper busTypeMapper;

    @Override
    @Transactional
    public BusTypeResponse create(BusTypeRequest request) {
        // Defense in Depth: validate trùng tên ở App Layer
        if (busTypeRepository.existsByName(request.getName())) {
            throw new BusinessException("Loại xe '" + request.getName() + "' đã tồn tại!");
        }

        BusType entity = Objects.requireNonNull(busTypeMapper.toEntity(request));
        BusType saved = busTypeRepository.save(entity);
        return busTypeMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public BusTypeResponse update(Long id, BusTypeRequest request) {
        BusType entity = busTypeRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Loại xe", "id", id));

        // Defense in Depth: validate trùng tên (trừ chính nó)
        if (busTypeRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new BusinessException("Loại xe '" + request.getName() + "' đã tồn tại!");
        }

        busTypeMapper.updateEntity(entity, request);
        BusType updated = busTypeRepository.save(Objects.requireNonNull(entity));
        return busTypeMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        BusType entity = busTypeRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Loại xe", "id", id));
        entity.setDeletedAt(LocalDateTime.now());
        busTypeRepository.save(entity);
    }

    @Override
    @Transactional
    public void restore(Long id) {
        BusType entity = busTypeRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Loại xe", "id", id));
        entity.setDeletedAt(null);
        busTypeRepository.save(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BusTypeResponse> getAll() {
        return busTypeRepository.findAll().stream()
                .filter(bt -> !bt.isDeleted())
                .map(busTypeMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BusTypeResponse> getDeletedBusTypes() {
        return busTypeRepository.findAll().stream()
                .filter(BusType::isDeleted)
                .map(busTypeMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BusTypeResponse getById(Long id) {
        BusType entity = busTypeRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Loại xe", "id", id));
        return busTypeMapper.toResponse(entity);
    }
}
