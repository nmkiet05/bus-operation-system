package com.bus.system.modules.pricing.service.impl;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.modules.pricing.contract.FareConfigStatus;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.fleet.domain.BusType;
import com.bus.system.modules.fleet.repository.BusTypeRepository;
import com.bus.system.modules.planning.domain.Route;
import com.bus.system.modules.planning.repository.RouteRepository;
import com.bus.system.modules.pricing.domain.FareConfig;
import com.bus.system.modules.pricing.dto.request.FareConfigRequest;
import com.bus.system.modules.pricing.dto.response.FareConfigResponse;
import com.bus.system.modules.pricing.mapper.FareConfigMapper;
import com.bus.system.modules.pricing.repository.FareConfigRepository;
import com.bus.system.modules.pricing.predicate.FareConfigPredicateBuilder;
import com.querydsl.core.BooleanBuilder;
import com.bus.system.modules.pricing.service.FareConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FareConfigServiceImpl implements FareConfigService {

    private final FareConfigRepository fareConfigRepository;
    private final RouteRepository routeRepository;
    private final BusTypeRepository busTypeRepository;
    private final FareConfigMapper fareConfigMapper;

    private static final int DAYS_TO_ADJUST_FOR_OVERLAP = 1;

    @Override
    @Transactional
    public FareConfigResponse upsertFare(FareConfigRequest request) {
        // 1. Validate ngày hiệu lực
        if (request.getEffectiveFrom().isBefore(LocalDate.now())) {
            throw new BusinessException("Ngày hiệu lực không được nằm trong quá khứ!");
        }

        // 1.1 Validate ngày kết thúc phải sau ngày bắt đầu
        if (request.getEffectiveTo() != null && request.getEffectiveTo().isBefore(request.getEffectiveFrom())) {
            throw new BusinessException("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu!");
        }

        // 2. Tìm xem đang có giá nào đang chạy không
        BooleanBuilder predicate = FareConfigPredicateBuilder.buildFareOverlapPredicate(
                request.getRouteId(),
                request.getBusTypeId(),
                request.getEffectiveFrom());

        Optional<FareConfig> currentFareOpt = fareConfigRepository.findOne(predicate);

        // 3. Logic SCD Type 2: Chốt sổ giá cũ
        if (currentFareOpt.isPresent()) {
            FareConfig currentFare = currentFareOpt.get();

            // Nếu ngày bắt đầu trùng nhau -> Không cho phép
            if (currentFare.getEffectiveFrom().isEqual(request.getEffectiveFrom())) {
                throw new BusinessException("Đã có cấu hình giá áp dụng từ ngày " + request.getEffectiveFrom()
                        + ". Vui lòng xóa hoặc chỉnh sửa bản ghi cũ.");
            }

            // Kết thúc giá cũ = Ngày bắt đầu giá mới - 1 ngày
            currentFare.setEffectiveTo(request.getEffectiveFrom().minusDays(DAYS_TO_ADJUST_FOR_OVERLAP));
            fareConfigRepository.saveAndFlush(currentFare);
        }

        // 4. Tạo bản ghi giá mới
        Route route = routeRepository.findById(Objects.requireNonNull(request.getRouteId()))
                .orElseThrow(() -> new ResourceNotFoundException("Tuyến đường", "id", request.getRouteId()));

        BusType busType = busTypeRepository.findById(Objects.requireNonNull(request.getBusTypeId()))
                .orElseThrow(() -> new ResourceNotFoundException("Loại xe", "id", request.getBusTypeId()));

        FareConfig newFare = Objects.requireNonNull(fareConfigMapper.toEntity(request));
        newFare.setRoute(route);
        newFare.setBusType(busType);
        newFare.setEffectiveTo(null); // Vô thời hạn
        newFare.setStatus(FareConfigStatus.ACTIVE);

        return fareConfigMapper.toResponse(Objects.requireNonNull(fareConfigRepository.save(newFare)));
    }

    @Override
    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public FareConfigResponse getActiveFare(Long routeId, Long busTypeId, LocalDate date) {
        BooleanBuilder predicate = FareConfigPredicateBuilder.buildActiveFarePredicate(
                routeId, busTypeId, date);

        FareConfig fare = fareConfigRepository.findOne(predicate)
                .orElseThrow(() -> new BusinessException("Không tìm thấy giá vé áp dụng cho ngày " + date));
        return fareConfigMapper.toResponse(fare);
    }

    @Override
    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public List<FareConfigResponse> getAllActiveFares() {
        BooleanBuilder predicate = FareConfigPredicateBuilder.buildAllActiveFaresPredicate(LocalDate.now());
        List<FareConfig> fares = (List<FareConfig>) fareConfigRepository.findAll(predicate);
        return fares.stream()
                .map(fareConfigMapper::toResponse)
                .collect(Collectors.toList());
    }
}