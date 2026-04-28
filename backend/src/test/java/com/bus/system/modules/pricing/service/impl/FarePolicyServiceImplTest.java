package com.bus.system.modules.pricing.service.impl;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.pricing.domain.FarePolicy;
import com.bus.system.modules.pricing.dto.request.FarePolicyRequest;
import com.bus.system.modules.pricing.dto.response.FarePolicyResponse;
import com.bus.system.modules.pricing.mapper.FarePolicyMapper;
import com.bus.system.modules.pricing.repository.FarePolicyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
 * Unit Tests cho FarePolicyServiceImpl
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FarePolicyServiceImpl Tests")
class FarePolicyServiceImplTest {

    @Mock
    private FarePolicyRepository farePolicyRepository;

    @Mock
    private FarePolicyMapper farePolicyMapper;

    @InjectMocks
    private FarePolicyServiceImpl farePolicyService;

    private FarePolicy farePolicy;
    private FarePolicyRequest request;
    private FarePolicyResponse response;

    @BeforeEach
    void setUp() {
        farePolicy = new FarePolicy();
        farePolicy.setId(1L);
        farePolicy.setCode("REFUND_24H");
        farePolicy.setName("Hoàn vé trước 24h");

        request = new FarePolicyRequest();
        request.setCode("REFUND_24H");
        request.setName("Hoàn vé trước 24h");

        response = new FarePolicyResponse();
        response.setId(1L);
        response.setCode("REFUND_24H");
        response.setName("Hoàn vé trước 24h");
    }

    @Nested
    @DisplayName("create()")
    class Create {

        @Test
        @DisplayName("Should create fare policy successfully")
        void create_Success() {
            // Given
            given(farePolicyRepository.existsByCode(anyString())).willReturn(false);
            given(farePolicyMapper.toEntity(any(FarePolicyRequest.class))).willReturn(farePolicy);
            given(farePolicyRepository.save(any(FarePolicy.class))).willReturn(farePolicy);
            given(farePolicyMapper.toResponse(any(FarePolicy.class))).willReturn(response);

            // When
            FarePolicyResponse result = farePolicyService.create(request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getCode()).isEqualTo("REFUND_24H");
            verify(farePolicyRepository).save(any(FarePolicy.class));
        }

        @Test
        @DisplayName("Should throw when code already exists")
        void create_DuplicateCode_ThrowsException() {
            // Given
            given(farePolicyRepository.existsByCode("REFUND_24H")).willReturn(true);

            // When/Then
            assertThatThrownBy(() -> farePolicyService.create(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("REFUND_24H");

            verify(farePolicyRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("update()")
    class Update {

        @Test
        @DisplayName("Should update fare policy successfully")
        void update_Success() {
            // Given
            given(farePolicyRepository.findById(1L)).willReturn(Optional.of(farePolicy));
            given(farePolicyRepository.save(any(FarePolicy.class))).willReturn(farePolicy);
            given(farePolicyMapper.toResponse(any(FarePolicy.class))).willReturn(response);

            // When
            FarePolicyResponse result = farePolicyService.update(1L, request);

            // Then
            assertThat(result).isNotNull();
            verify(farePolicyMapper).updateEntity(any(), any());
            verify(farePolicyRepository).save(any(FarePolicy.class));
        }

        @Test
        @DisplayName("Should throw when fare policy not found")
        void update_NotFound_ThrowsException() {
            // Given
            given(farePolicyRepository.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> farePolicyService.update(999L, request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Chính sách giá");
        }
    }

    @Nested
    @DisplayName("delete()")
    class Delete {

        @Test
        @DisplayName("Should delete fare policy")
        void delete_Success() {
            // Given
            given(farePolicyRepository.existsById(1L)).willReturn(true);

            // When
            farePolicyService.delete(1L);

            // Then
            verify(farePolicyRepository).deleteById(1L);
        }

        @Test
        @DisplayName("Should throw when fare policy not found")
        void delete_NotFound_ThrowsException() {
            // Given
            given(farePolicyRepository.existsById(999L)).willReturn(false);

            // When/Then
            assertThatThrownBy(() -> farePolicyService.delete(999L))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(farePolicyRepository, never()).deleteById(any());
        }
    }

    @Nested
    @DisplayName("getById()")
    class GetById {

        @Test
        @DisplayName("Should return fare policy by id")
        void getById_Success() {
            // Given
            given(farePolicyRepository.findById(1L)).willReturn(Optional.of(farePolicy));
            given(farePolicyMapper.toResponse(farePolicy)).willReturn(response);

            // When
            FarePolicyResponse result = farePolicyService.getById(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Should throw when not found")
        void getById_NotFound_ThrowsException() {
            // Given
            given(farePolicyRepository.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> farePolicyService.getById(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getAll()")
    class GetAll {

        @Test
        @DisplayName("Should return all fare policies")
        void getAll_Success() {
            // Given
            given(farePolicyRepository.findAll()).willReturn(Arrays.asList(farePolicy));
            given(farePolicyMapper.toResponse(farePolicy)).willReturn(response);

            // When
            List<FarePolicyResponse> results = farePolicyService.getAll();

            // Then
            assertThat(results).hasSize(1);
        }
    }
}
