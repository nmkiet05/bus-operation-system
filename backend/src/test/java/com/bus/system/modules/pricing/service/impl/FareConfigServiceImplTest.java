package com.bus.system.modules.pricing.service.impl;

import com.bus.system.modules.pricing.contract.FareConfigStatus;
import com.bus.system.common.exception.BusinessException;
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
import com.querydsl.core.types.Predicate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

/**
 * Unit Tests cho FareConfigServiceImpl
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FareConfigServiceImpl Tests")
class FareConfigServiceImplTest {

    @Mock
    private FareConfigRepository fareConfigRepository;

    @Mock
    private RouteRepository routeRepository;

    @Mock
    private BusTypeRepository busTypeRepository;

    @Mock
    private FareConfigMapper fareConfigMapper;

    @InjectMocks
    private FareConfigServiceImpl fareConfigService;

    private FareConfig fareConfig;
    private FareConfigRequest request;
    private FareConfigResponse response;
    private Route route;
    private BusType busType;

    @BeforeEach
    void setUp() {
        route = new Route();
        route.setId(1L);
        route.setName("HCM - Đà Lạt");

        busType = new BusType();
        busType.setId(1L);
        busType.setName("Giường nằm");

        fareConfig = new FareConfig();
        fareConfig.setId(1L);
        fareConfig.setRoute(route);
        fareConfig.setBusType(busType);
        fareConfig.setPrice(new BigDecimal("350000"));
        fareConfig.setEffectiveFrom(LocalDate.now().plusDays(1));
        fareConfig.setStatus(FareConfigStatus.ACTIVE);

        request = new FareConfigRequest();
        request.setRouteId(1L);
        request.setBusTypeId(1L);
        request.setPrice(new BigDecimal("350000"));
        request.setEffectiveFrom(LocalDate.now().plusDays(1));
        request.setIsHolidaySurcharge(false);

        response = new FareConfigResponse();
        response.setId(1L);
        response.setPrice(new BigDecimal("350000"));
    }

    @Nested
    @DisplayName("upsertFare()")
    class UpsertFare {

        @Test
        @DisplayName("Should create new fare config successfully")
        void upsertFare_CreateNew_Success() {
            // Given
            // fareConfigRepository.findOne(Predicate) mặc định trả Optional.empty() → không có giá hiện tại
            given(routeRepository.findById(1L)).willReturn(Optional.of(route));
            given(busTypeRepository.findById(1L)).willReturn(Optional.of(busType));
            given(fareConfigMapper.toEntity(any(FareConfigRequest.class))).willReturn(fareConfig);
            given(fareConfigRepository.save(any(FareConfig.class))).willReturn(fareConfig);
            given(fareConfigMapper.toResponse(any(FareConfig.class))).willReturn(response);

            // When
            FareConfigResponse result = fareConfigService.upsertFare(request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getPrice()).isEqualTo(new BigDecimal("350000"));
            verify(fareConfigRepository).save(any(FareConfig.class));
        }

        @Test
        @DisplayName("Should throw when effective date is in the past")
        void upsertFare_PastDate_ThrowsException() {
            // Given
            request.setEffectiveFrom(LocalDate.now().minusDays(1));

            // When/Then
            assertThatThrownBy(() -> fareConfigService.upsertFare(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("quá khứ");

            verify(fareConfigRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw when effectiveTo is before effectiveFrom")
        void upsertFare_InvalidDateRange_ThrowsException() {
            // Given
            request.setEffectiveTo(LocalDate.now()); // Before effectiveFrom

            // When/Then
            assertThatThrownBy(() -> fareConfigService.upsertFare(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("sau hoặc bằng");

            verify(fareConfigRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw when route not found")
        void upsertFare_RouteNotFound_ThrowsException() {
            // Given
            // fareConfigRepository.findOne(Predicate) mặc định trả Optional.empty()
            given(routeRepository.findById(999L)).willReturn(Optional.empty());

            request.setRouteId(999L);

            // When/Then
            assertThatThrownBy(() -> fareConfigService.upsertFare(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Tuyến đường");
        }

        @Test
        @DisplayName("Should throw when bus type not found")
        void upsertFare_BusTypeNotFound_ThrowsException() {
            // Given
            // fareConfigRepository.findOne(Predicate) mặc định trả Optional.empty()
            given(routeRepository.findById(1L)).willReturn(Optional.of(route));
            given(busTypeRepository.findById(999L)).willReturn(Optional.empty());

            request.setBusTypeId(999L);

            // When/Then
            assertThatThrownBy(() -> fareConfigService.upsertFare(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Loại xe");
        }

        @Test
        @DisplayName("Should throw when same effective date config exists")
        void upsertFare_SameEffectiveDate_ThrowsException() {
            // Given
            fareConfig.setEffectiveFrom(request.getEffectiveFrom());

            // Service gọi findOne(Predicate) từ QuerydslPredicateExecutor
            given(fareConfigRepository.findOne(any(Predicate.class))).willReturn(Optional.of(fareConfig));

            // When/Then
            assertThatThrownBy(() -> fareConfigService.upsertFare(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Đã có cấu hình giá");
        }
    }

    @Nested
    @DisplayName("getActiveFare()")
    class GetActiveFare {

        @Test
        @DisplayName("Should return active fare")
        void getActiveFare_Success() {
            // Given
            // Service gọi findOne(Predicate) từ QuerydslPredicateExecutor
            given(fareConfigRepository.findOne(any(Predicate.class))).willReturn(Optional.of(fareConfig));
            given(fareConfigMapper.toResponse(fareConfig)).willReturn(response);

            // When
            FareConfigResponse result = fareConfigService.getActiveFare(1L, 1L, LocalDate.now());

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getPrice()).isEqualTo(new BigDecimal("350000"));
        }

        @Test
        @DisplayName("Should throw when no active fare found")
        void getActiveFare_NotFound_ThrowsException() {
            // Given - fareConfigRepository.findOne(Predicate) trả Optional.empty() mặc định

            // When/Then
            assertThatThrownBy(() -> fareConfigService.getActiveFare(1L, 1L, LocalDate.now()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Không tìm thấy");
        }
    }
}
