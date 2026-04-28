package com.bus.system.modules.catalog.service.impl;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.catalog.domain.Province;
import com.bus.system.modules.catalog.dto.request.ProvinceRequest;
import com.bus.system.modules.catalog.dto.response.ProvinceResponse;
import com.bus.system.modules.catalog.mapper.ProvinceMapper;
import com.bus.system.modules.catalog.repository.ProvinceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

/**
 * Unit Tests cho ProvinceServiceImpl
 * 
 * Test coverage:
 * - createProvince: success, duplicate code
 * - getAllProvinces: with active, with deleted
 * - deactivateProvince: success, not found
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ProvinceServiceImpl Tests")
class ProvinceServiceImplTest {

    @Mock
    private ProvinceRepository provinceRepository;

    @Mock
    private ProvinceMapper provinceMapper;

    @InjectMocks
    private ProvinceServiceImpl provinceService;

    private Province province;
    private ProvinceRequest request;
    private ProvinceResponse response;

    @BeforeEach
    void setUp() {
        province = new Province();
        province.setId(1L);
        province.setGovCode("79");
        province.setName("TP. Hồ Chí Minh");

        request = new ProvinceRequest();
        request.setGovCode("79");
        request.setName("TP. Hồ Chí Minh");

        response = new ProvinceResponse();
        response.setId(1L);
        response.setGovCode("79");
        response.setName("TP. Hồ Chí Minh");
    }

    @Nested
    @DisplayName("createProvince()")
    class CreateProvince {

        @Test
        @DisplayName("Should create province successfully")
        void createProvince_Success() {
            // Given
            given(provinceRepository.existsByGovCode(anyString())).willReturn(false);
            given(provinceMapper.toEntity(any(ProvinceRequest.class))).willReturn(province);
            given(provinceRepository.save(any(Province.class))).willReturn(province);
            given(provinceMapper.toResponse(any(Province.class))).willReturn(response);

            // When
            ProvinceResponse result = provinceService.createProvince(request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getGovCode()).isEqualTo("79");
            assertThat(result.getName()).isEqualTo("TP. Hồ Chí Minh");

            verify(provinceRepository).existsByGovCode("79");
            verify(provinceRepository).save(any(Province.class));
        }

        @Test
        @DisplayName("Should throw BusinessException when code already exists")
        void createProvince_DuplicateCode_ThrowsException() {
            // Given
            given(provinceRepository.existsByGovCode("79")).willReturn(true);

            // When/Then
            assertThatThrownBy(() -> provinceService.createProvince(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("79")
                    .hasMessageContaining("đã tồn tại");

            verify(provinceRepository).existsByGovCode("79");
            verify(provinceRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("getAllProvinces()")
    class GetAllProvinces {

        @Test
        @DisplayName("Should return only active provinces")
        void getAllProvinces_ReturnsOnlyActive() {
            // Given
            Province activeProvince = new Province();
            activeProvince.setId(1L);
            activeProvince.setGovCode("79");
            activeProvince.setName("TP. Hồ Chí Minh");

            Province deletedProvince = new Province();
            deletedProvince.setId(2L);
            deletedProvince.setGovCode("01");
            deletedProvince.setName("Hà Nội");
            deletedProvince.setDeletedAt(LocalDateTime.now());

            given(provinceRepository.findAll()).willReturn(Arrays.asList(activeProvince, deletedProvince));
            given(provinceMapper.toResponse(activeProvince)).willReturn(response);

            // When
            List<ProvinceResponse> results = provinceService.getAllProvinces();

            // Then
            assertThat(results).hasSize(1);
            assertThat(results.get(0).getGovCode()).isEqualTo("79");
        }

        @Test
        @DisplayName("Should return empty list when no active provinces")
        void getAllProvinces_ReturnsEmptyWhenAllDeleted() {
            // Given
            Province deletedProvince = new Province();
            deletedProvince.setDeletedAt(LocalDateTime.now());

            given(provinceRepository.findAll()).willReturn(Arrays.asList(deletedProvince));

            // When
            List<ProvinceResponse> results = provinceService.getAllProvinces();

            // Then
            assertThat(results).isEmpty();
        }
    }

    @Nested
    @DisplayName("deactivateProvince()")
    class DeactivateProvince {

        @Test
        @DisplayName("Should soft delete province successfully")
        void deactivateProvince_Success() {
            // Given
            given(provinceRepository.findById(1L)).willReturn(Optional.of(province));
            given(provinceRepository.save(any(Province.class))).willReturn(province);

            // When
            provinceService.deactivateProvince(1L);

            // Then
            assertThat(province.getDeletedAt()).isNotNull();
            verify(provinceRepository).save(province);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when province not found")
        void deactivateProvince_NotFound_ThrowsException() {
            // Given
            given(provinceRepository.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> provinceService.deactivateProvince(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Tỉnh/Thành");

            verify(provinceRepository, never()).save(any());
        }
    }
}
