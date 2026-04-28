package com.bus.system.modules.planning.service.impl;

import com.bus.system.modules.planning.contract.ScheduleStatus;
import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.planning.domain.TripSchedule;
import com.bus.system.modules.planning.dto.request.TripScheduleRequest;
import com.bus.system.modules.planning.dto.response.TripScheduleResponse;
import com.bus.system.modules.planning.mapper.TripScheduleMapper;
import com.bus.system.modules.planning.repository.TripScheduleRepository;
import com.querydsl.core.types.Predicate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

/**
 * Unit Tests cho TripScheduleServiceImpl
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TripScheduleServiceImpl Tests")
class TripScheduleServiceImplTest {

    @Mock
    private TripScheduleRepository tripScheduleRepository;

    @Mock
    private TripScheduleMapper tripScheduleMapper;

    @InjectMocks
    private TripScheduleServiceImpl tripScheduleService;

    private TripSchedule tripSchedule;
    private TripScheduleRequest request;
    private TripScheduleResponse response;

    @BeforeEach
    void setUp() {
        tripSchedule = new TripSchedule();
        tripSchedule.setId(1L);
        tripSchedule.setDepartureTime(LocalTime.of(7, 0));
        tripSchedule.setStatus(ScheduleStatus.ACTIVE);

        request = new TripScheduleRequest();
        request.setRouteId(1L);
        request.setDepartureTime(LocalTime.of(7, 0));
        request.setEffectiveFrom(LocalDate.now());
        request.setStatus("ACTIVE");

        response = new TripScheduleResponse();
        response.setId(1L);
        response.setDepartureTime(LocalTime.of(7, 0));
        response.setStatus("ACTIVE");
    }

    @Nested
    @DisplayName("create()")
    class Create {

        @Test
        @DisplayName("Should create trip schedule successfully")
        void create_Success() {
            // Given
            // exists(Predicate) được gọi bởi service, mặc định Mockito trả false → không có overlap
            given(tripScheduleMapper.toEntity(any(TripScheduleRequest.class))).willReturn(tripSchedule);
            given(tripScheduleRepository.save(any(TripSchedule.class))).willReturn(tripSchedule);
            given(tripScheduleMapper.toResponse(any(TripSchedule.class))).willReturn(response);

            // When
            TripScheduleResponse result = tripScheduleService.create(request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            verify(tripScheduleRepository).save(any(TripSchedule.class));
        }

        @Test
        @DisplayName("Should throw when time overlap exists")
        void create_TimeOverlap_ThrowsException() {
            // Given
            given(tripScheduleRepository.exists(any(Predicate.class))).willReturn(true);

            // When/Then
            assertThatThrownBy(() -> tripScheduleService.create(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("giãn cách chuyến");

            verify(tripScheduleRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("update()")
    class Update {

        @Test
        @DisplayName("Should update trip schedule successfully")
        void update_Success() {
            // Given
            given(tripScheduleRepository.findById(1L)).willReturn(Optional.of(tripSchedule));
            // exists(Predicate) mặc định trả false → không có overlap
            given(tripScheduleRepository.save(any(TripSchedule.class))).willReturn(tripSchedule);
            given(tripScheduleMapper.toResponse(any(TripSchedule.class))).willReturn(response);

            // When
            TripScheduleResponse result = tripScheduleService.update(1L, request);

            // Then
            assertThat(result).isNotNull();
            verify(tripScheduleMapper).updateEntity(any(), any());
            verify(tripScheduleRepository).save(any(TripSchedule.class));
        }

        @Test
        @DisplayName("Should throw when trip schedule not found")
        void update_NotFound_ThrowsException() {
            // Given
            given(tripScheduleRepository.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> tripScheduleService.update(999L, request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("TripSchedule");
        }

        @Test
        @DisplayName("Should throw when time overlap exists (excluding self)")
        void update_TimeOverlap_ThrowsException() {
            // Given
            given(tripScheduleRepository.findById(1L)).willReturn(Optional.of(tripSchedule));
            given(tripScheduleRepository.exists(any(Predicate.class))).willReturn(true);

            // When/Then
            assertThatThrownBy(() -> tripScheduleService.update(1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("giãn cách chuyến");

            verify(tripScheduleRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("delete()")
    class Delete {

        @Test
        @DisplayName("Should delete trip schedule")
        void delete_Success() {
            // Given
            given(tripScheduleRepository.existsById(1L)).willReturn(true);

            // When
            tripScheduleService.delete(1L);

            // Then
            verify(tripScheduleRepository).deleteById(1L);
        }

        @Test
        @DisplayName("Should throw when trip schedule not found")
        void delete_NotFound_ThrowsException() {
            // Given
            given(tripScheduleRepository.existsById(999L)).willReturn(false);

            // When/Then
            assertThatThrownBy(() -> tripScheduleService.delete(999L))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(tripScheduleRepository, never()).deleteById(any());
        }
    }

    @Nested
    @DisplayName("getSchedulesByRoute()")
    class GetSchedulesByRoute {

        @Test
        @DisplayName("Should return schedules for route")
        void getSchedulesByRoute_Success() {
            // Given
            given(tripScheduleRepository.findByRouteIdAndStatus(1L, ScheduleStatus.ACTIVE))
                    .willReturn(Arrays.asList(tripSchedule));
            given(tripScheduleMapper.toResponse(tripSchedule)).willReturn(response);

            // When
            List<TripScheduleResponse> results = tripScheduleService.getSchedulesByRoute(1L);

            // Then
            assertThat(results).hasSize(1);
        }

        @Test
        @DisplayName("Should return empty list when no schedules")
        void getSchedulesByRoute_Empty() {
            // Given
            given(tripScheduleRepository.findByRouteIdAndStatus(1L, ScheduleStatus.ACTIVE))
                    .willReturn(Arrays.asList());

            // When
            List<TripScheduleResponse> results = tripScheduleService.getSchedulesByRoute(1L);

            // Then
            assertThat(results).isEmpty();
        }
    }
}
