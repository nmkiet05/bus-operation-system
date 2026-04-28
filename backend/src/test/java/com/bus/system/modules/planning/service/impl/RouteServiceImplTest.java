package com.bus.system.modules.planning.service.impl;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.planning.domain.Route;
import com.bus.system.modules.planning.dto.request.RouteRequest;
import com.bus.system.modules.planning.dto.response.RouteResponse;
import com.bus.system.modules.planning.mapper.RouteMapper;
import com.bus.system.modules.planning.repository.RouteRepository;
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
 * Unit Tests cho RouteServiceImpl
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("RouteServiceImpl Tests")
class RouteServiceImplTest {

    @Mock
    private RouteRepository routeRepository;

    @Mock
    private RouteMapper routeMapper;

    @InjectMocks
    private RouteServiceImpl routeService;

    private Route route;
    private RouteRequest request;
    private RouteResponse response;

    @BeforeEach
    void setUp() {
        route = new Route();
        route.setId(1L);
        route.setCode("RT-HCM-DL");
        route.setName("TP.HCM - Đà Lạt");
        route.setStatus("DRAFT");

        request = new RouteRequest();
        request.setCode("RT-HCM-DL");
        request.setName("TP.HCM - Đà Lạt");

        response = new RouteResponse();
        response.setId(1L);
        response.setCode("RT-HCM-DL");
        response.setName("TP.HCM - Đà Lạt");
    }

    @Nested
    @DisplayName("createRoute()")
    class CreateRoute {

        @Test
        @DisplayName("Should create route successfully")
        void createRoute_Success() {
            // Given
            given(routeRepository.existsByCode(anyString())).willReturn(false);
            given(routeMapper.toEntity(any(RouteRequest.class))).willReturn(route);
            given(routeRepository.save(any(Route.class))).willReturn(route);
            given(routeMapper.toResponse(any(Route.class))).willReturn(response);

            // When
            RouteResponse result = routeService.createRoute(request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getCode()).isEqualTo("RT-HCM-DL");
            verify(routeRepository).save(any(Route.class));
        }

        @Test
        @DisplayName("Should throw when code already exists")
        void createRoute_DuplicateCode_ThrowsException() {
            // Given
            given(routeRepository.existsByCode("RT-HCM-DL")).willReturn(true);

            // When/Then
            assertThatThrownBy(() -> routeService.createRoute(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("RT-HCM-DL");

            verify(routeRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should set default status to DRAFT when null")
        void createRoute_DefaultStatus() {
            // Given
            route.setStatus(null); // Trigger default

            given(routeRepository.existsByCode(anyString())).willReturn(false);
            given(routeMapper.toEntity(any(RouteRequest.class))).willReturn(route);
            given(routeRepository.save(any(Route.class))).willReturn(route);
            given(routeMapper.toResponse(any(Route.class))).willReturn(response);

            // When
            routeService.createRoute(request);

            // Then
            assertThat(route.getStatus()).isEqualTo("DRAFT");
        }
    }

    @Nested
    @DisplayName("updateRoute()")
    class UpdateRoute {

        @Test
        @DisplayName("Should update route successfully")
        void updateRoute_Success() {
            // Given
            given(routeRepository.findById(1L)).willReturn(Optional.of(route));
            given(routeRepository.save(any(Route.class))).willReturn(route);
            given(routeMapper.toResponse(any(Route.class))).willReturn(response);

            // When
            RouteResponse result = routeService.updateRoute(1L, request);

            // Then
            assertThat(result).isNotNull();
            verify(routeMapper).updateRouteFromRequest(any(), any());
            verify(routeRepository).save(any(Route.class));
        }

        @Test
        @DisplayName("Should throw when route not found")
        void updateRoute_NotFound_ThrowsException() {
            // Given
            given(routeRepository.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> routeService.updateRoute(999L, request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Tuyến đường");
        }
    }

    @Nested
    @DisplayName("deleteRoute()")
    class DeleteRoute {

        @Test
        @DisplayName("Should soft delete route")
        void deleteRoute_Success() {
            // Given
            given(routeRepository.findById(1L)).willReturn(Optional.of(route));
            given(routeRepository.save(any(Route.class))).willReturn(route);

            // When
            routeService.deleteRoute(1L);

            // Then
            assertThat(route.getDeletedAt()).isNotNull();
            verify(routeRepository).save(route);
        }

        @Test
        @DisplayName("Should throw when route not found")
        void deleteRoute_NotFound_ThrowsException() {
            // Given
            given(routeRepository.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> routeService.deleteRoute(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getAllRoutes()")
    class GetAllRoutes {

        @Test
        @DisplayName("Should return only active routes")
        void getAllRoutes_ReturnsOnlyActive() {
            // Given
            Route active = new Route();
            active.setId(1L);
            active.setCode("RT-HCM-DL");

            Route deleted = new Route();
            deleted.setId(2L);
            deleted.setDeletedAt(LocalDateTime.now());

            given(routeRepository.findAll()).willReturn(Arrays.asList(active, deleted));
            given(routeMapper.toResponse(active)).willReturn(response);

            // When
            List<RouteResponse> results = routeService.getAllRoutes();

            // Then
            assertThat(results).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getRouteById()")
    class GetRouteById {

        @Test
        @DisplayName("Should return route by id")
        void getRouteById_Success() {
            // Given
            given(routeRepository.findById(1L)).willReturn(Optional.of(route));
            given(routeMapper.toResponse(route)).willReturn(response);

            // When
            RouteResponse result = routeService.getRouteById(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Should throw when not found")
        void getRouteById_NotFound_ThrowsException() {
            // Given
            given(routeRepository.findById(999L)).willReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> routeService.getRouteById(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
