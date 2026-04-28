package com.bus.system.modules.fleet.service.impl;

import com.bus.system.modules.fleet.domain.enums.BusStatus;
import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.fleet.domain.BusType;
import com.bus.system.modules.fleet.dto.request.BusRequest;
import com.bus.system.modules.fleet.dto.response.BusResponse;
import com.bus.system.modules.fleet.mapper.BusMapper;
import com.bus.system.modules.fleet.repository.BusRepository;
import com.bus.system.modules.fleet.repository.BusTypeRepository;
import com.bus.system.modules.operation.repository.BusAssignmentRepository;
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
 * Unit Tests cho BusServiceImpl
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("BusServiceImpl Tests")
class BusServiceImplTest {

    @Mock
    private BusRepository busRepository;

    @Mock
    private BusTypeRepository busTypeRepository;

    @Mock
    private BusMapper busMapper;

    @Mock
    private BusAssignmentRepository busAssignmentRepository;

    @InjectMocks
    private BusServiceImpl busService;

    private Bus bus;
    private BusType busType;
    private BusRequest request;
    private BusResponse response;

    @BeforeEach
    void setUp() {
        busType = new BusType();
        busType.setId(1L);
        busType.setName("Xe giường nằm");

        bus = new Bus();
        bus.setId(1L);
        bus.setLicensePlate("51B-12345");
        bus.setBusType(busType);
        bus.setStatus(BusStatus.ACTIVE);

        request = new BusRequest();
        request.setLicensePlate("51B-12345");
        request.setBusTypeId(1L);

        response = new BusResponse();
        response.setId(1L);
        response.setLicensePlate("51B-12345");
        response.setStatus("ACTIVE");
    }

    @Nested
    @DisplayName("createBus()")
    class CreateBus {

        @Test
        @DisplayName("Should create bus successfully")
        void createBus_Success() {
            // Given
            given(busRepository.existsByLicensePlate(anyString())).willReturn(false);
            given(busTypeRepository.findById(1L)).willReturn(Optional.of(busType));
            given(busMapper.toEntity(any(BusRequest.class))).willReturn(bus);
            given(busRepository.save(any(Bus.class))).willReturn(bus);
            given(busMapper.toResponse(any(Bus.class))).willReturn(response);

            // When
            BusResponse result = busService.createBus(request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getLicensePlate()).isEqualTo("51B-12345");
            verify(busRepository).save(any(Bus.class));
        }

        @Test
        @DisplayName("Should throw when license plate already exists")
        void createBus_DuplicatePlate_ThrowsException() {
            // Given
            given(busRepository.existsByLicensePlate("51B-12345")).willReturn(true);

            // When/Then
            assertThatThrownBy(() -> busService.createBus(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("51B-12345");

            verify(busRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw when bus type not found")
        void createBus_BusTypeNotFound_ThrowsException() {
            // Given
            given(busRepository.existsByLicensePlate(anyString())).willReturn(false);
            given(busMapper.toEntity(any(BusRequest.class))).willReturn(bus);
            given(busTypeRepository.findById(999L)).willReturn(Optional.empty());

            request.setBusTypeId(999L);

            // When/Then
            assertThatThrownBy(() -> busService.createBus(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Loại xe");

            verify(busRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("updateBus()")
    class UpdateBus {

        @Test
        @DisplayName("Should update bus successfully")
        void updateBus_Success() {
            // Given
            given(busRepository.findById(1L)).willReturn(Optional.of(bus));
            given(busRepository.save(any(Bus.class))).willReturn(bus);
            given(busMapper.toResponse(any(Bus.class))).willReturn(response);

            request.setBusTypeId(1L); // Same bus type

            // When
            BusResponse result = busService.updateBus(1L, request);

            // Then
            assertThat(result).isNotNull();
            verify(busRepository).save(any(Bus.class));
        }

        @Test
        @DisplayName("Should throw when bus not found")
        void updateBus_NotFound_ThrowsException() {
            // Given
            given(busRepository.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> busService.updateBus(999L, request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Xe buýt");
        }

        @Test
        @DisplayName("Should update bus type when changed")
        void updateBus_ChangeBusType_Success() {
            // Given
            BusType newBusType = new BusType();
            newBusType.setId(2L);
            newBusType.setName("Xe limousine");

            given(busRepository.findById(1L)).willReturn(Optional.of(bus));
            given(busTypeRepository.findById(2L)).willReturn(Optional.of(newBusType));
            given(busRepository.save(any(Bus.class))).willReturn(bus);
            given(busMapper.toResponse(any(Bus.class))).willReturn(response);

            request.setBusTypeId(2L); // Different bus type

            // When
            busService.updateBus(1L, request);

            // Then
            assertThat(bus.getBusType()).isEqualTo(newBusType);
            verify(busRepository).save(any(Bus.class));
        }
    }

    @Nested
    @DisplayName("deleteBus()")
    class DeleteBus {

        @Test
        @DisplayName("Should soft delete bus and set status to RETIRED")
        void deleteBus_Success() {
            // Given
            given(busRepository.findById(1L)).willReturn(Optional.of(bus));
            given(busRepository.save(any(Bus.class))).willReturn(bus);

            // When
            busService.deleteBus(1L);

            // Then
            assertThat(bus.getDeletedAt()).isNotNull();
            assertThat(bus.getStatus()).isEqualTo(BusStatus.RETIRED);
            verify(busRepository).save(bus);
        }

        @Test
        @DisplayName("Should throw when bus not found")
        void deleteBus_NotFound_ThrowsException() {
            // Given
            given(busRepository.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> busService.deleteBus(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getAllBuses()")
    class GetAllBuses {

        @Test
        @DisplayName("Should return only active buses")
        void getAllBuses_ReturnsOnlyActive() {
            // Given
            Bus activeBus = new Bus();
            activeBus.setId(1L);
            activeBus.setLicensePlate("51B-12345");
            activeBus.setBusType(busType);

            // findAllWithBusType() đã lọc deletedAt IS NULL tại DB, chỉ trả về xe chưa xóa
            given(busRepository.findAllWithBusType()).willReturn(Arrays.asList(activeBus));
            given(busMapper.toResponse(activeBus)).willReturn(response);
            given(busAssignmentRepository.findLastCompletedPerBus()).willReturn(Arrays.asList());

            // When
            List<BusResponse> results = busService.getAllBuses();

            // Then
            assertThat(results).hasSize(1);
            assertThat(results.get(0).getLicensePlate()).isEqualTo("51B-12345");
        }
    }
}
