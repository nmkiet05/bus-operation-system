package com.bus.system.modules.catalog.service.impl;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.catalog.domain.Province;
import com.bus.system.modules.catalog.dto.request.ProvinceRequest;
import com.bus.system.modules.catalog.dto.response.ProvinceResponse;
import com.bus.system.modules.catalog.mapper.ProvinceMapper;
import com.bus.system.modules.catalog.repository.ProvinceRepository;
import com.bus.system.modules.catalog.service.ProvinceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Province Service Implementation
 * 
 * Thiết kế theo nguyên tắc:
 * - CREATE: ✅ Khi nhà nước thay đổi (chia tách/sáp nhập/đổi tên)
 * - READ: ✅ Public API
 * - UPDATE: ❌ Không có. Tạo bản ghi mới để giữ lịch sử.
 * - DELETE: ❌ Soft delete (deactivate) để giữ tham chiếu.
 */
@Service
@RequiredArgsConstructor
public class ProvinceServiceImpl implements ProvinceService {

    private final ProvinceRepository provinceRepository;
    private final ProvinceMapper provinceMapper;

    @Override
    @Transactional
    public ProvinceResponse createProvince(ProvinceRequest request) {
        // Validate: Không cho trùng mã tỉnh GSO
        if (provinceRepository.existsByGovCode(request.getGovCode())) {
            throw new BusinessException("Mã tỉnh GSO '" + request.getGovCode() + "' đã tồn tại!");
        }

        Province province = Objects.requireNonNull(provinceMapper.toEntity(request));
        Province saved = Objects.requireNonNull(provinceRepository.save(province));
        return provinceMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProvinceResponse> getAllProvinces() {
        // Chỉ trả về các tỉnh đang ACTIVE (chưa bị soft delete)
        return provinceRepository.findAll().stream()
                .filter(p -> p.getDeletedAt() == null)
                .map(provinceMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deactivateProvince(Long id) {
        Province province = provinceRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Tỉnh/Thành", "id", id));

        // Soft delete: Đánh dấu tỉnh không còn tồn tại
        // Dữ liệu lịch sử (chuyến xe, bến xe cũ) vẫn tham chiếu được
        province.setDeletedAt(LocalDateTime.now());
        provinceRepository.save(province);
    }

    // ❌ KHÔNG có updateProvince()
    // Lý do: Khi nhà nước đổi tên tỉnh, cần:
    // 1. Deactivate bản ghi cũ
    // 2. Create bản ghi mới với mã/tên mới
    // Như vậy dữ liệu lịch sử vẫn tham chiếu đúng tỉnh cũ
}