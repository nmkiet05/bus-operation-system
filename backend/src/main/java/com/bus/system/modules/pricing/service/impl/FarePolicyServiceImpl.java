package com.bus.system.modules.pricing.service.impl;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.pricing.domain.FarePolicy;
import com.bus.system.modules.pricing.dto.request.FarePolicyRequest;
import com.bus.system.modules.pricing.dto.response.FarePolicyResponse;
import com.bus.system.modules.pricing.mapper.FarePolicyMapper;
import com.bus.system.modules.pricing.repository.FarePolicyRepository;
import com.bus.system.modules.pricing.service.FarePolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FarePolicyServiceImpl implements FarePolicyService {

    private final FarePolicyRepository farePolicyRepository;
    private final FarePolicyMapper farePolicyMapper;

    @Override
    @Transactional
    public FarePolicyResponse create(FarePolicyRequest request) {
        if (farePolicyRepository.existsByCode(request.getCode())) {
            throw new BusinessException("Mã chính sách '" + request.getCode() + "' đã tồn tại!");
        }
        FarePolicy entity = farePolicyMapper.toEntity(request);
        // Set người tạo thủ công nếu chưa cấu hình AuditorAware
        // entity.setCreatedBy(SecurityUtils.getCurrentUserId());
        return farePolicyMapper.toResponse(farePolicyRepository.save(Objects.requireNonNull(entity)));
    }

    @Override
    @Transactional
    public FarePolicyResponse update(Long id, FarePolicyRequest request) {
        FarePolicy entity = farePolicyRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Chính sách giá", "id", id));

        // Không cho phép sửa Code để đảm bảo toàn vẹn dữ liệu
        farePolicyMapper.updateEntity(entity, request);
        return farePolicyMapper.toResponse(farePolicyRepository.save(Objects.requireNonNull(entity)));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!farePolicyRepository.existsById(Objects.requireNonNull(id))) {
            throw new ResourceNotFoundException("Chính sách giá", "id", id);
        }
        farePolicyRepository.deleteById(Objects.requireNonNull(id)); // Soft delete sẽ tự động kích hoạt nhờ
                                                                     // BaseSoftDeleteEntity
    }

    @Override
    public FarePolicyResponse getById(Long id) {
        return farePolicyRepository.findById(Objects.requireNonNull(id))
                .map(farePolicyMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Chính sách giá", "id", id));
    }

    @Override
    public List<FarePolicyResponse> getAll() {
        return farePolicyRepository.findAll().stream()
                .map(farePolicyMapper::toResponse)
                .collect(Collectors.toList());
    }
}