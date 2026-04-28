package com.bus.system.modules.fleet.service.impl;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.fleet.domain.BusType;
import com.bus.system.modules.fleet.dto.request.BusTypeRequest;
import com.bus.system.modules.fleet.dto.response.BusTypeResponse;
import com.bus.system.modules.fleet.mapper.BusTypeMapper;
import com.bus.system.modules.fleet.repository.BusTypeRepository;
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
 * Unit Tests cho BusTypeServiceImpl
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("BusTypeServiceImpl Tests")
class BusTypeServiceImplTest {

    @Mock
    private BusTypeRepository busTypeRepository;

    @Mock
    private BusTypeMapper busTypeMapper;

    @InjectMocks
    private BusTypeServiceImpl busTypeService;

    private BusType busType;
    private BusTypeRequest request;
    private BusTypeResponse response;

    @BeforeEach
    void setUp() {
        busType = new BusType();
        busType.setId(1L);
        busType.setName("Xe giường nằm 40 chỗ");
        busType.setTotalSeats(40);

        request = new BusTypeRequest();
        request.setName("Xe giường nằm 40 chỗ");
        request.setTotalSeats(40);

        response = new BusTypeResponse();
        response.setId(1L);
        response.setName("Xe giường nằm 40 chỗ");
        response.setTotalSeats(40);
    }

    @Nested
    @DisplayName("create()")
    class Create {

        @Test
        @DisplayName("Should create bus type successfully")
        void create_Success() {
            // Given
            given(busTypeRepository.existsByName(anyString())).willReturn(false);
            given(busTypeMapper.toEntity(any(BusTypeRequest.class))).willReturn(busType);
            given(busTypeRepository.save(any(BusType.class))).willReturn(busType);
            given(busTypeMapper.toResponse(any(BusType.class))).willReturn(response);

            // When
            BusTypeResponse result = busTypeService.create(request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("Xe giường nằm 40 chỗ");
            verify(busTypeRepository).save(any(BusType.class));
        }

        @Test
        @DisplayName("Should throw when name already exists")
        void create_DuplicateName_ThrowsException() {
            // Given
            given(busTypeRepository.existsByName("Xe giường nằm 40 chỗ")).willReturn(true);

            // When/Then
            assertThatThrownBy(() -> busTypeService.create(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("đã tồn tại");

            verify(busTypeRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("update()")
    class Update {

        @Test
        @DisplayName("Should update bus type successfully")
        void update_Success() {
            // Given
            given(busTypeRepository.findById(1L)).willReturn(Optional.of(busType));
            given(busTypeRepository.existsByNameAndIdNot(anyString(), any())).willReturn(false);
            given(busTypeRepository.save(any(BusType.class))).willReturn(busType);
            given(busTypeMapper.toResponse(any(BusType.class))).willReturn(response);

            // When
            BusTypeResponse result = busTypeService.update(1L, request);

            // Then
            assertThat(result).isNotNull();
            verify(busTypeMapper).updateEntity(any(), any());
            verify(busTypeRepository).save(any(BusType.class));
        }

        @Test
        @DisplayName("Should throw when bus type not found")
        void update_NotFound_ThrowsException() {
            // Given
            given(busTypeRepository.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> busTypeService.update(999L, request))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(busTypeRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw when name already exists for another bus type")
        void update_DuplicateName_ThrowsException() {
            // Given
            given(busTypeRepository.findById(1L)).willReturn(Optional.of(busType));
            given(busTypeRepository.existsByNameAndIdNot("Xe giường nằm 40 chỗ", 1L)).willReturn(true);

            // When/Then
            assertThatThrownBy(() -> busTypeService.update(1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("đã tồn tại");

            verify(busTypeRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("delete()")
    class Delete {

        @Test
        @DisplayName("Should soft delete bus type")
        void delete_Success() {
            // Given
            given(busTypeRepository.findById(1L)).willReturn(Optional.of(busType));
            given(busTypeRepository.save(any(BusType.class))).willReturn(busType);

            // When
            busTypeService.delete(1L);

            // Then
            assertThat(busType.getDeletedAt()).isNotNull();
            verify(busTypeRepository).save(busType);
        }

        @Test
        @DisplayName("Should throw when bus type not found")
        void delete_NotFound_ThrowsException() {
            // Given
            given(busTypeRepository.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> busTypeService.delete(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getAll()")
    class GetAll {

        @Test
        @DisplayName("Should return only active bus types")
        void getAll_ReturnsOnlyActive() {
            // Given
            BusType active = new BusType();
            active.setId(1L);
            active.setName("Active Type");

            BusType deleted = new BusType();
            deleted.setId(2L);
            deleted.setDeletedAt(LocalDateTime.now());

            given(busTypeRepository.findAll()).willReturn(Arrays.asList(active, deleted));
            given(busTypeMapper.toResponse(active)).willReturn(response);

            // When
            List<BusTypeResponse> results = busTypeService.getAll();

            // Then
            assertThat(results).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getById()")
    class GetById {

        @Test
        @DisplayName("Should return bus type by id")
        void getById_Success() {
            // Given
            given(busTypeRepository.findById(1L)).willReturn(Optional.of(busType));
            given(busTypeMapper.toResponse(busType)).willReturn(response);

            // When
            BusTypeResponse result = busTypeService.getById(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Should throw when not found")
        void getById_NotFound_ThrowsException() {
            // Given
            given(busTypeRepository.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> busTypeService.getById(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
