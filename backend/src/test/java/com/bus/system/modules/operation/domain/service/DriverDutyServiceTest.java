package com.bus.system.modules.operation.domain.service;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.modules.operation.config.OperationProperties;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.domain.service.impl.DriverDutyServiceImpl;
import com.bus.system.modules.operation.repository.BusAssignmentRepository;
import com.bus.system.modules.operation.repository.TripRepository;
import com.bus.system.modules.planning.domain.Route;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
@DisplayName("DriverDutyService Tests (Luật GTĐB)")
class DriverDutyServiceTest {

        @Mock
        private TripRepository tripRepository;

        @Mock
        private BusAssignmentRepository busAssignmentRepository;

        @Mock
        private OperationProperties operationProperties;

        @Mock
        private OperationProperties.DriverDutyConfig driverDutyProperties;

        @InjectMocks
        private DriverDutyServiceImpl driverDutyService;

        private Route route;
        private Long driverId = 10L;
        private List<Trip> dailyTrips;

        @BeforeEach
        void setUp() {
                route = new Route();
                route.setId(1L);
                route.setDurationHours(new BigDecimal("3.0")); // Chuyến 3 tiếng

                dailyTrips = new ArrayList<>();

                // Mock config properties
                lenient().when(operationProperties.getDriverDuty()).thenReturn(driverDutyProperties);
                lenient().when(driverDutyProperties.getMaxDailyDrivingMinutes()).thenReturn(600L); // 10h
                lenient().when(driverDutyProperties.getMaxContinuousDrivingMinutes()).thenReturn(240L); // 4h
                lenient().when(driverDutyProperties.getRestTimeThresholdMinutes()).thenReturn(15L); // 15 min
                lenient().when(driverDutyProperties.getMaxWeeklyDrivingMinutes()).thenReturn(2880L); // 48h
        }

        private Trip createPastTrip(LocalTime departure, double durationHours) {
                Trip t = new Trip();
                t.setId(100L + dailyTrips.size());
                t.setDepartureDate(LocalDate.now());
                t.setActualDepartureTime(departure);

                LocalDateTime start = LocalDateTime.of(LocalDate.now(), departure);
                long minutes = (long) (durationHours * 60);
                t.setArrivalTime(start.plusMinutes(minutes));

                return t;
        }

        @Test
        @DisplayName("Should pass when driver has no previous trips")
        void validateLaborLaw_NoPreviousTrips_Success() {
                // Given
                given(tripRepository.findTripsByDriverAndDate(eq(driverId), any(LocalDate.class)))
                                .willReturn(dailyTrips);
                given(tripRepository.sumDrivingMinutesByDriverAndWeek(
                                eq(driverId), any(LocalDate.class), any(LocalDate.class), isNull()))
                                .willReturn(0L);

                // When / Then
                assertThatCode(
                                () -> driverDutyService.validateLaborLaw(driverId, LocalDate.now(),
                                                LocalTime.of(7, 0), route, null))
                                .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should throw when Daily Driving > 10 hours")
        void validateLaborLaw_ExceedDailyLimit_ThrowsException() {
                // Given: Đã lái 3 chuyến, mỗi chuyến 2.5h (Tổng 7.5h)
                dailyTrips.add(createPastTrip(LocalTime.of(6, 0), 2.5));
                dailyTrips.add(createPastTrip(LocalTime.of(9, 0), 2.5));
                dailyTrips.add(createPastTrip(LocalTime.of(12, 0), 2.5));

                given(tripRepository.findTripsByDriverAndDate(eq(driverId), any(LocalDate.class)))
                                .willReturn(dailyTrips);

                // Try to add new trip 3h -> Tổng 10.5h -> Vi phạm
                route.setDurationHours(new BigDecimal("3.0"));

                // When / Then
                assertThatThrownBy(() -> driverDutyService.validateLaborLaw(driverId, LocalDate.now(),
                                LocalTime.of(15, 0),
                                route, null))
                                .isInstanceOf(BusinessException.class)
                                .hasMessageContaining("Tổng");
        }

        @Test
        @DisplayName("Should throw when Continuous Driving > 4 hours (No break)")
        void validateLaborLaw_ExceedContinuous_ThrowsException() {
                // Given: Chuyến trước lái 3.5h, xong lúc 10:30
                Trip t1 = createPastTrip(LocalTime.of(7, 0), 3.5); // 7:00 -> 10:30
                dailyTrips.add(t1);

                given(tripRepository.findTripsByDriverAndDate(eq(driverId), any(LocalDate.class)))
                                .willReturn(dailyTrips);

                // New trip starts at 10:35 (Gap 5 mins < 15 mins) -> Cộng dồn = 3.5 + 3 = 6.5h
                // > 4h
                route.setDurationHours(new BigDecimal("3.0"));
                LocalTime newStart = LocalTime.of(10, 35);

                // When / Then
                assertThatThrownBy(
                                () -> driverDutyService.validateLaborLaw(driverId, LocalDate.now(), newStart, route,
                                                null))
                                .isInstanceOf(BusinessException.class)
                                .hasMessageContaining("Lái xe liên tục");
        }

        @Test
        @DisplayName("Should pass when there is enough rest time (15 mins)")
        void validateLaborLaw_WithRest_Success() {
                // Given: Chuyến trước lái 3.5h, xong lúc 10:30
                Trip t1 = createPastTrip(LocalTime.of(7, 0), 3.5); // 7:00 -> 10:30
                dailyTrips.add(t1);

                given(tripRepository.findTripsByDriverAndDate(eq(driverId), any(LocalDate.class)))
                                .willReturn(dailyTrips);
                given(tripRepository.sumDrivingMinutesByDriverAndWeek(
                                eq(driverId), any(LocalDate.class), any(LocalDate.class), isNull()))
                                .willReturn(210L); // 3.5h already this week

                // New trip starts at 10:45 (Gap 15 mins >= 15 mins) -> Reset counter -> 3h < 4h
                route.setDurationHours(new BigDecimal("3.0"));
                LocalTime newStart = LocalTime.of(10, 45);

                // When / Then
                assertThatCode(() -> driverDutyService.validateLaborLaw(driverId, LocalDate.now(), newStart, route,
                                null))
                                .doesNotThrowAnyException();
        }
}
