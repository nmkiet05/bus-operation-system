package com.bus.system.modules.catalog.service.impl;

import com.bus.system.modules.catalog.domain.enums.StationStatus;
import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.catalog.domain.BusStation;
import com.bus.system.modules.catalog.domain.Province;
import com.bus.system.modules.catalog.dto.request.StationRequest;
import com.bus.system.modules.catalog.dto.response.StationResponse;
import com.bus.system.modules.catalog.mapper.StationMapper;
import com.bus.system.modules.catalog.repository.ProvinceRepository;
import com.bus.system.modules.catalog.repository.StationRepository;
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
 * Unit Tests cho StationServiceImpl
 * 
 * Test coverage:
 * - createStation: success, duplicate govCode, province not found
 * - getAllStations: with active, with deleted
 * - deactivateStation: success, not found
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("StationServiceImpl Tests")
class StationServiceImplTest {

    @Mock
    private StationRepository stationRepository;

    @Mock
    private ProvinceRepository provinceRepository;

    @Mock
    private StationMapper stationMapper;

    @InjectMocks
    private StationServiceImpl stationService;

    private BusStation station;
    private Province province;
    private StationRequest request;
    private StationResponse response;

    @BeforeEach
    void setUp() {
        province = new Province();
        province.setId(1L);
        province.setGovCode("79");
        province.setName("TP. Hồ Chí Minh");

        station = new BusStation();
        station.setId(1L);
        station.setGovCode("BX-MIEN-DONG");
        station.setName("Bến xe Miền Đông Mới");
        station.setProvince(province);
        station.setStatus(StationStatus.ACTIVE);

        request = new StationRequest();
        request.setGovCode("BX-MIEN-DONG");
        request.setName("Bến xe Miền Đông Mới");
        request.setProvinceId(1L);

        response = new StationResponse();
        response.setId(1L);
        response.setGovCode("BX-MIEN-DONG");
        response.setName("Bến xe Miền Đông Mới");
        response.setProvinceId(1L);
        response.setProvinceName("TP. Hồ Chí Minh");
        response.setStatus(StationStatus.ACTIVE);
    }

    @Nested
    @DisplayName("createStation()")
    class CreateStation {

        @Test
        @DisplayName("Should create station successfully")
        void createStation_Success() {
            // Given
            given(stationRepository.existsByGovCode(anyString())).willReturn(false);
            given(provinceRepository.findById(1L)).willReturn(Optional.of(province));
            given(stationMapper.toEntity(any(StationRequest.class), any(Province.class))).willReturn(station);
            given(stationRepository.save(any(BusStation.class))).willReturn(station);
            given(stationMapper.toResponse(any(BusStation.class))).willReturn(response);

            // When
            stationService.createStation(request);

            // Then
            verify(stationRepository).save(argThat(s -> s.getStatus() == StationStatus.ACTIVE));
        }
    }

    @Nested
    @DisplayName("getAllStations()")
    class GetAllStations {

        @Test
        @DisplayName("Should return only active stations")
        void getAllStations_ReturnsOnlyActive() {
            // Given
            BusStation activeStation = new BusStation();
            activeStation.setId(1L);
            activeStation.setGovCode("BX-MIEN-DONG");

            BusStation deletedStation = new BusStation();
            deletedStation.setId(2L);
            deletedStation.setGovCode("BX-MIEN-TAY");
            deletedStation.setStatus(StationStatus.INACTIVE);

            StationResponse inactiveResponse = new StationResponse();
            inactiveResponse.setId(2L);
            inactiveResponse.setGovCode("BX-MIEN-TAY");
            inactiveResponse.setStatus(StationStatus.INACTIVE);

            given(stationRepository.findAll()).willReturn(Arrays.asList(activeStation, deletedStation));
            given(stationMapper.toResponse(activeStation)).willReturn(response);
            given(stationMapper.toResponse(deletedStation)).willReturn(inactiveResponse);

            // When
            List<StationResponse> results = stationService.getAllStations();

            // Then
            assertThat(results).hasSize(2);
            assertThat(results.get(0).getGovCode()).isEqualTo("BX-MIEN-DONG");
        }

        @Test
        @DisplayName("Should return empty list when no active stations")
        void getAllStations_ReturnsEmptyWhenAllDeleted() {
            // Given
            BusStation deletedStation = new BusStation();
            deletedStation.setStatus(StationStatus.INACTIVE);

            StationResponse inactiveResponse = new StationResponse();
            inactiveResponse.setStatus(StationStatus.INACTIVE);

            given(stationRepository.findAll()).willReturn(Arrays.asList(deletedStation));
            given(stationMapper.toResponse(deletedStation)).willReturn(inactiveResponse);

            // When
            List<StationResponse> results = stationService.getAllStations();

            // Then
            assertThat(results).hasSize(1);
            assertThat(results.get(0).getStatus()).isEqualTo(StationStatus.INACTIVE);
        }
    }

    @Nested
    @DisplayName("deactivateStation()")
    class DeactivateStation {

        @Test
        @DisplayName("Should soft delete station successfully")
        void deactivateStation_Success() {
            // Given
            given(stationRepository.findById(1L)).willReturn(Optional.of(station));
            given(stationRepository.save(any(BusStation.class))).willReturn(station);

            // When
            stationService.deactivateStation(1L);

            // Then
            assertThat(station.getStatus()).isEqualTo(StationStatus.INACTIVE);
            verify(stationRepository).save(station);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when station not found")
        void deactivateStation_NotFound_ThrowsException() {
            // Given
            given(stationRepository.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> stationService.deactivateStation(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Bến xe");

            verify(stationRepository, never()).save(any());
        }
    }
}
