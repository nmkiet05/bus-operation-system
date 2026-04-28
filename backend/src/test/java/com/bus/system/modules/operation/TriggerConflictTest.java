package com.bus.system.modules.operation;

import com.bus.system.modules.identity.contract.UserRole;
import com.bus.system.modules.operation.domain.enums.TripStatus;
import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.fleet.domain.BusType;
import com.bus.system.modules.fleet.repository.BusTypeRepository;
import com.bus.system.modules.fleet.repository.BusRepository;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.identity.repository.UserRepository;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.repository.TripRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
public class TriggerConflictTest {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private BusTypeRepository busTypeRepository;

    @Autowired
    private UserRepository userRepository;

    private Bus bus;
    private User driver;

    @BeforeEach
    void setUp() {
        BusType busType = new BusType();
        busType.setName("Xe TEST");
        busType.setTotalSeats(45);
        busType.setSeatMap(new ArrayList<>()); // Set non-null seatMap
        busType = busTypeRepository.save(busType);

        bus = new Bus();
        bus.setLicensePlate("51B-TEST");
        bus.setBusType(busType);
        bus.setInsuranceExpiryDate(LocalDate.now().plusYears(1));
        bus.setRegistrationExpiryDate(LocalDate.now().plusYears(1));
        bus = busRepository.save(bus);

        driver = new User();
        driver.setUsername("driver_test");
        driver.setFullName("Driver Test");
        driver.setPassword("password");
        driver.getRoles().add(UserRole.DRIVER);
        driver = userRepository.save(driver);
    }

    @Test
    @DisplayName("Should persist overlapping trip at repository layer")
    void testBusOverlapTrigger() {
        // Given
        LocalDate today = LocalDate.now();

        Trip trip1 = new Trip();
        trip1.setBusId(bus.getId());
        trip1.setDepartureDate(today);
        trip1.setActualDepartureTime(LocalTime.of(8, 0)); // 08:00
        trip1.setStatus(TripStatus.SCHEDULED);
        // Duration default 4 hours -> Ends 12:00
        tripRepository.saveAndFlush(trip1);

        // When: Create trip2 overlapped (09:00 - 13:00)
        Trip trip2 = new Trip();
        trip2.setBusId(bus.getId());
        trip2.setDepartureDate(today);
        trip2.setActualDepartureTime(LocalTime.of(9, 0));
        trip2.setStatus(TripStatus.SCHEDULED);

        // Then
        Assertions.assertDoesNotThrow(() -> tripRepository.saveAndFlush(trip2));
    }

    // [Phase 2] Test driver overlap chuyển sang DriverAssignment level
    // Trigger check_trip_logic không còn check main_driver_id
}
