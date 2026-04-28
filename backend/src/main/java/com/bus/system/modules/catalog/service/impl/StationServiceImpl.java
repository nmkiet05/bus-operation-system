package com.bus.system.modules.catalog.service.impl;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.catalog.domain.BusStation;
import com.bus.system.modules.catalog.domain.Province;
import com.bus.system.modules.catalog.domain.enums.StationStatus;
import com.bus.system.modules.catalog.dto.request.StationRequest;
import com.bus.system.modules.catalog.dto.response.StationResponse;
import com.bus.system.modules.catalog.mapper.StationMapper;
import com.bus.system.modules.catalog.repository.ProvinceRepository;
import com.bus.system.modules.catalog.repository.StationRepository;
import com.bus.system.modules.catalog.service.StationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Station Service Implementation - Master Data
 * 
 * BusStation là dữ liệu pháp lý do Sở GTVT/Bộ GTVT cấp phép.
 * Thiết kế CRUD giống Province:
 * - CREATE: ✅
 * - READ: ✅
 * - UPDATE: ❌ Không có
 * - DELETE: ✅ Soft delete
 */
@Service
@RequiredArgsConstructor
public class StationServiceImpl implements StationService {

    private final StationRepository stationRepository;
    private final ProvinceRepository provinceRepository;
    private final StationMapper stationMapper;

    @Override
    @Transactional
    public StationResponse createStation(StationRequest request) {
        // Defense in Depth: validate trùng govCode ở App Layer
        if (stationRepository.existsByGovCode(request.getGovCode())) {
            throw new BusinessException("Mã bến xe '" + request.getGovCode() + "' đã tồn tại!");
        }

        Province province = provinceRepository.findById(Objects.requireNonNull(request.getProvinceId()))
                .orElseThrow(() -> new ResourceNotFoundException("Tỉnh/Thành", "id", request.getProvinceId()));

        BusStation station = Objects.requireNonNull(stationMapper.toEntity(request, province));

        return stationMapper.toResponse(Objects.requireNonNull(stationRepository.save(station)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<StationResponse> getAllStations() {
        return stationRepository.findAll().stream()
                .map(stationMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deactivateStation(Long id) {
        BusStation station = stationRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Bến xe", "id", id));
                
        if (StationStatus.INACTIVE.equals(station.getStatus())) {
            throw new BusinessException("Bến xe này đã bị vô hiệu hóa trước đó.");
        }
        
        station.setStatus(StationStatus.INACTIVE);
        stationRepository.save(station);
    }

    @Override
    @Transactional
    public void activateStation(Long id) {
        BusStation station = stationRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Bến xe", "id", id));
                
        if (StationStatus.ACTIVE.equals(station.getStatus())) {
            throw new BusinessException("Bến xe này đang hoạt động bình thường.");
        }
        
        station.setStatus(StationStatus.ACTIVE);
        stationRepository.save(station);
    }

    // ❌ Không có updateStation - Master Data không cho phép UPDATE
}