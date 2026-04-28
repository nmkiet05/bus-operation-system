package com.bus.system.modules.operation.service.impl;

import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.domain.QTrip;
import com.bus.system.modules.operation.domain.enums.TripType;
import com.bus.system.modules.operation.dto.request.TripSearchRequest;
import com.bus.system.modules.operation.dto.response.TripResponse;
import com.bus.system.modules.operation.mapper.TripMapper;
import com.bus.system.modules.operation.predicate.TripPredicateBuilder;
import com.bus.system.modules.operation.repository.TripRepository;
import com.bus.system.modules.operation.service.TripQueryService;
import com.bus.system.modules.planning.domain.ScheduleBusType;
import com.bus.system.modules.planning.repository.ScheduleBusTypeRepository;
import com.bus.system.modules.pricing.domain.FareConfig;
import com.bus.system.modules.sales.repository.TicketRepository;
import com.bus.system.modules.pricing.contract.FareConfigStatus;
import com.bus.system.modules.operation.repository.DriverAssignmentRepository;
import com.bus.system.modules.operation.integration.FleetServiceClient;
import com.bus.system.modules.operation.integration.IdentityServiceClient;
import com.bus.system.modules.operation.integration.PricingServiceClient;
import com.bus.system.modules.operation.domain.enums.TripStatus;
import com.bus.system.common.constants.AppConstants;
import com.querydsl.core.BooleanBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TripQueryServiceImpl implements TripQueryService {

    private final TripRepository tripRepository;
    private final TripMapper tripMapper;
    private final ScheduleBusTypeRepository scheduleBusTypeRepository;
    private final TicketRepository ticketRepository;
    private final DriverAssignmentRepository driverAssignmentRepository;
    // Integration Clients
    private final FleetServiceClient fleetServiceClient;
    private final IdentityServiceClient identityServiceClient;
    private final PricingServiceClient pricingServiceClient;

    @Override
    @Transactional(readOnly = true)
    public TripResponse getTripById(Long id) {
        Trip trip = tripRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Chuyến xe", "id", id));
        return tripMapper.toResponse(trip);
    }

    @Override
    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public List<TripResponse> getTrips(Long routeId, Long fromProvinceId, Long toProvinceId, LocalDate fromDate,
            LocalDate toDate) {

        // ... (Mã cũ được lược bỏ cho gọn nếu cần, nhưng giữ nguyên toàn bộ phương thức
        // để an toàn)
        // Chuyển đổi tham số cũ sang Đối tượng Request
        TripSearchRequest request = new TripSearchRequest();
        request.setRouteId(routeId);
        request.setFromProvinceId(fromProvinceId);
        request.setToProvinceId(toProvinceId);
        request.setFromDate(fromDate);
        request.setToDate(toDate);

        BooleanBuilder predicate = TripPredicateBuilder.buildTripSearchPredicate(request);

        QTrip qTrip = QTrip.trip;
        // Sử dụng OrderSpecifier để sắp xếp an toàn kiểu dữ liệu
        Iterable<Trip> result = tripRepository.findAll(predicate,
                qTrip.departureDate.asc(),
                qTrip.actualDepartureTime.asc());

        List<Trip> trips = new ArrayList<>();
        result.forEach(trips::add);

        if (trips.isEmpty()) {
            return List.of();
        }

        // 2. [TỐI ƯU] Thu thập danh sách ID để lấy dữ liệu hàng loạt (Tránh lỗi N+1)
        Set<Long> busIds = new HashSet<>();
        Set<Long> driverIds = new HashSet<>();
        Set<Long> routeIds = new HashSet<>();
        Set<Long> busTypeIds = new HashSet<>();
        Set<Long> scheduleIds = new HashSet<>();
        List<Long> tripIdsToFetch = new ArrayList<>();

        for (Trip trip : trips) {
            tripIdsToFetch.add(trip.getId());
            if (trip.hasBus())
                busIds.add(trip.getBusId());
            if (trip.hasMainDriver())
                trip.getMainDriver().ifPresent(d -> driverIds.add(d.getId()));
            if (trip.getRouteId() != null) {
                routeIds.add(trip.getRouteId());
            }
            if (trip.getTripSchedule() != null) {
                scheduleIds.add(trip.getTripSchedule().getId());
            }
        }

        // 3. Lấy dữ liệu liên quan hàng loạt
        Map<Long, Bus> busMap = new HashMap<>();
        if (!busIds.isEmpty()) {
            List<Bus> buses = fleetServiceClient.getBusesByIds(busIds);
            for (Bus b : buses) {
                busMap.put(b.getId(), b);
                if (b.getBusType() != null) {
                    busTypeIds.add(b.getBusType().getId());
                }
            }
        }

        Map<Long, User> driverMap = new HashMap<>();
        if (!driverIds.isEmpty()) {
            List<User> drivers = identityServiceClient.getUsersByIds(driverIds);
            for (User u : drivers)
                driverMap.put(u.getId(), u);
        }

        // 3b. [FIX] Batch-fetch loại xe yêu cầu từ ScheduleBusType (loại xe của nốt
        // tài)
        Map<Long, String> scheduleBusTypeNameMap = buildScheduleBusTypeNameMap(scheduleIds);

        // 4. Lấy Cấu hình Giá vé
        Map<String, BigDecimal> fareMap = new HashMap<>();
        if (!routeIds.isEmpty() && !busTypeIds.isEmpty()) {
            List<FareConfig> fares = pricingServiceClient.getAllFareConfigs();
            for (FareConfig fare : fares) {
                if (fare.getRoute() != null && fare.getBusType() != null
                        && FareConfigStatus.ACTIVE.equals(fare.getStatus())) {
                    String key = fare.getRoute().getId() + "-" + fare.getBusType().getId();
                    fareMap.put(key, fare.getPrice());
                }
            }
        }

        // 5. Lấy số lượng ghế đã đặt
        Map<Long, Integer> bookedSeatsMap = new HashMap<>();
        if (!tripIdsToFetch.isEmpty()) {
            List<Object[]> bookedCounts = ticketRepository.countBookedSeatsByTripIds(tripIdsToFetch);
            for (Object[] row : bookedCounts) {
                Long tId = (Long) row[0];
                Number count = (Number) row[1];
                bookedSeatsMap.put(tId, count.intValue());
            }
        }

        // 6. Ánh xạ sang DTO với dữ liệu đã được bổ sung
        return tripMapper.toResponseListWithDetails(trips, busMap, driverMap, fareMap, scheduleBusTypeNameMap, bookedSeatsMap);
    }

    @Override
    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public List<TripResponse> getTrips(Long routeId, Long fromProvinceId, Long toProvinceId, LocalDate fromDate,
            LocalDate toDate, String status, String tripType) {
        // Parse status enum (null-safe)
        TripStatus tripStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                tripStatus = TripStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid trip status filter: {}", status);
            }
        }

        // Parse tripType enum (null-safe)
        TripType parsedTripType = null;
        if (tripType != null && !tripType.isBlank()) {
            try {
                parsedTripType = TripType.valueOf(tripType.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid trip type filter: {}", tripType);
            }
        }

        BooleanBuilder predicate = TripPredicateBuilder.buildAdminTripPredicate(
                routeId, fromProvinceId, toProvinceId, fromDate, toDate, tripStatus, parsedTripType);

        QTrip qTrip = QTrip.trip;
        Iterable<Trip> result = tripRepository.findAll(predicate,
                qTrip.departureDate.asc(),
                qTrip.actualDepartureTime.asc());

        List<Trip> trips = new ArrayList<>();
        result.forEach(trips::add);

        if (trips.isEmpty()) {
            return List.of();
        }

        // Reuse same enrichment logic
        Set<Long> busIds = new HashSet<>();
        Set<Long> driverIds = new HashSet<>();
        Set<Long> routeIds = new HashSet<>();
        Set<Long> busTypeIds = new HashSet<>();
        Set<Long> scheduleIds = new HashSet<>();
        List<Long> tripIdsToFetch = new ArrayList<>();

        for (Trip trip : trips) {
            tripIdsToFetch.add(trip.getId());
            if (trip.hasBus())
                busIds.add(trip.getBusId());
            if (trip.hasMainDriver())
                trip.getMainDriver().ifPresent(d -> driverIds.add(d.getId()));
            if (trip.getRouteId() != null)
                routeIds.add(trip.getRouteId());
            if (trip.getTripSchedule() != null)
                scheduleIds.add(trip.getTripSchedule().getId());
        }

        Map<Long, Bus> busMap = new HashMap<>();
        if (!busIds.isEmpty()) {
            List<Bus> buses = fleetServiceClient.getBusesByIds(busIds);
            for (Bus b : buses) {
                busMap.put(b.getId(), b);
                if (b.getBusType() != null)
                    busTypeIds.add(b.getBusType().getId());
            }
        }

        Map<Long, User> driverMap = new HashMap<>();
        if (!driverIds.isEmpty()) {
            List<User> drivers = identityServiceClient.getUsersByIds(driverIds);
            for (User u : drivers)
                driverMap.put(u.getId(), u);
        }

        // [FIX] Batch-fetch loại xe yêu cầu từ ScheduleBusType
        Map<Long, String> scheduleBusTypeNameMap = buildScheduleBusTypeNameMap(scheduleIds);

        Map<String, BigDecimal> fareMap = new HashMap<>();
        if (!routeIds.isEmpty() && !busTypeIds.isEmpty()) {
            List<FareConfig> fares = pricingServiceClient.getAllFareConfigs();
            for (FareConfig fare : fares) {
                if (fare.getRoute() != null && fare.getBusType() != null
                        && FareConfigStatus.ACTIVE.equals(fare.getStatus())) {
                    String key = fare.getRoute().getId() + "-" + fare.getBusType().getId();
                    fareMap.put(key, fare.getPrice());
                }
            }
        }

        Map<Long, Integer> bookedSeatsMap = new HashMap<>();
        if (!tripIdsToFetch.isEmpty()) {
            List<Object[]> bookedCounts = ticketRepository.countBookedSeatsByTripIds(tripIdsToFetch);
            for (Object[] row : bookedCounts) {
                Long tId = (Long) row[0];
                Number count = (Number) row[1];
                bookedSeatsMap.put(tId, count.intValue());
            }
        }

        return tripMapper.toResponseListWithDetails(trips, busMap, driverMap, fareMap, scheduleBusTypeNameMap, bookedSeatsMap);
    }

    @Override
    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public Page<TripResponse> searchTrips(TripSearchRequest request) {

        // 1. Xây dựng Predicate chế độ nghiêm ngặt (chỉ APPROVED)
        BooleanBuilder predicate = TripPredicateBuilder.buildTripSearchPredicate(request);

        // 2. Phân trang & Sắp xếp
        int page = request.getPage() < 0 ? AppConstants.DEFAULT_PAGE : request.getPage();
        int size = request.getSize() <= 0 ? AppConstants.DEFAULT_PAGE_SIZE : request.getSize();

        Pageable pageable = PageRequest.of(
                page, size,
                Sort.by("departureDate").ascending()
                        .and(Sort.by("actualDepartureTime").ascending())
                        // Fix for sample data: Add ID sort for deterministic order
                        .and(Sort.by("id").descending()));

        // 3. Truy vấn
        Page<Trip> tripPage = tripRepository.findAll(predicate, pageable);

        if (tripPage.isEmpty()) {
            return Page.empty(pageable);
        }

        // 4. Bổ sung dữ liệu (Xe, Tài xế) - Logic tương tự getTrips nhưng dành cho Page
        Set<Long> busIds = new HashSet<>();
        Set<Long> driverIds = new HashSet<>();
        Set<Long> routeIds = new HashSet<>();
        Set<Long> busTypeIds = new HashSet<>();
        Set<Long> scheduleIds = new HashSet<>();
        List<Long> tripIdsToFetch = new ArrayList<>();

        tripPage.getContent().forEach(trip -> {
            tripIdsToFetch.add(trip.getId());
            if (trip.hasBus())
                busIds.add(trip.getBusId());
            if (trip.hasMainDriver())
                trip.getMainDriver().ifPresent(d -> driverIds.add(d.getId()));
            if (trip.getRouteId() != null)
                routeIds.add(trip.getRouteId());
            if (trip.getTripSchedule() != null)
                scheduleIds.add(trip.getTripSchedule().getId());
        });

        Map<Long, Bus> busMap = new HashMap<>();
        if (!busIds.isEmpty()) {
            fleetServiceClient.getBusesByIds(busIds).forEach(b -> {
                busMap.put(b.getId(), b);
                if (b.getBusType() != null) {
                    busTypeIds.add(b.getBusType().getId());
                }
            });
        }

        Map<Long, User> driverMap = new HashMap<>();
        if (!driverIds.isEmpty()) {
            identityServiceClient.getUsersByIds(driverIds).forEach(u -> driverMap.put(u.getId(), u));
        }

        // [FIX] Batch-fetch loại xe yêu cầu từ ScheduleBusType
        Map<Long, String> scheduleBusTypeNameMap = buildScheduleBusTypeNameMap(scheduleIds);

        // 5. Lấy Cấu hình Giá vé
        Map<String, BigDecimal> fareMap = new HashMap<>();
        if (!routeIds.isEmpty() && !busTypeIds.isEmpty()) {
            List<FareConfig> fares = pricingServiceClient.getAllFareConfigs();
            for (FareConfig fare : fares) {
                if (fare.getRoute() != null && fare.getBusType() != null
                        && FareConfigStatus.ACTIVE.equals(fare.getStatus())) {
                    String key = fare.getRoute().getId() + "-" + fare.getBusType().getId();
                    fareMap.put(key, fare.getPrice());
                }
            }
        }

        // 6. Lấy số lượng ghế đã đặt
        Map<Long, Integer> bookedSeatsMap = new HashMap<>();
        if (!tripIdsToFetch.isEmpty()) {
            List<Object[]> bookedCounts = ticketRepository.countBookedSeatsByTripIds(tripIdsToFetch);
            for (Object[] row : bookedCounts) {
                Long tId = (Long) row[0];
                Number count = (Number) row[1];
                bookedSeatsMap.put(tId, count.intValue());
            }
        }

        // 7. Ánh xạ sang phản hồi
        return tripPage.map(trip -> {
            Bus bus = trip.hasBus() ? busMap.get(trip.getBusId()) : null;
            User driver = trip.hasMainDriver() ? trip.getMainDriver().orElse(null) : null;

            BigDecimal price = BigDecimal.ZERO;
            if (trip.getRouteId() != null && bus != null && bus.getBusType() != null) {
                String key = trip.getRouteId() + "-" + bus.getBusType().getId();
                price = fareMap.getOrDefault(key, BigDecimal.ZERO);
            }

            int bookedSeats = bookedSeatsMap.getOrDefault(trip.getId(), 0);
            TripResponse dto = tripMapper.toResponse(trip, bus, driver, price, bookedSeats);
            // Enrich busTypeName from schedule if not set by bus
            if (dto.getBusTypeName() == null && trip.getTripSchedule() != null) {
                dto.setBusTypeName(scheduleBusTypeNameMap.get(trip.getTripSchedule().getId()));
                dto.setBusType(dto.getBusTypeName());
            }
            return dto;
        });
    }

    /**
     * Batch-fetch tên loại xe yêu cầu (từ ScheduleBusType ACTIVE) cho danh sách
     * schedule.
     * Trả về Map: scheduleId → tên loại xe (nối bằng ", " nếu nhiều loại).
     */
    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsByDriver(Long driverId, LocalDate fromDate, LocalDate toDate) {
        // ── BƯỚC 1: Tìm trip IDs qua bảng trung gian driver_assignment ───────────
        // Không query thẳng bảng trip vì quan hệ nhiều-nhiều:
        //   - 1 trip có nhiều crew (MAIN_DRIVER, CO_DRIVER, ATTENDANT)
        //   - 1 driver thuộc nhiều trip khác nhau
        // Native query trả List<Number> vì PostgreSQL trả kiểu BigInteger,
        // không phải Long — nên phải dùng .map(Number::longValue) để ép kiểu.
        // .distinct() loại trùng phòng thủ (dù SQL đã có DISTINCT).
        List<Long> tripIds = driverAssignmentRepository
                .findTripIdsByDriverIdAndDateRange(driverId, fromDate, toDate)
                .stream()
                .map(Number::longValue)
                .distinct()
                .collect(Collectors.toList());

        // Không tìm thấy chuyến nào → trả rỗng sớm, tránh query thêm không cần thiết.
        if (tripIds.isEmpty()) {
            return List.of();
        }

        // ── BƯỚC 2: Load Trip entity từ DB theo danh sách IDs ───────────────────
        // findAllById sinh ra câu SQL: SELECT * FROM trip WHERE id IN (...)
        // → 1 query duy nhất thay vì N queries riêng lẻ.
        List<Trip> trips = tripRepository.findAllById(tripIds);

        if (trips.isEmpty()) {
            return List.of();
        }

        // ── BƯỚC 3: Thu thập IDs để batch-fetch, tránh N+1 query problem ─────────
        // Nếu gọi service/repo riêng lẻ cho từng trip → N lần gọi (chậm).
        // Giải pháp: gom tất cả IDs vào Set trước, rồi gọi 1 lần cho từng loại.
        Set<Long> busIds = new HashSet<>();       // → fleet service (lấy thông tin xe)
        Set<Long> driverIds = new HashSet<>();    // → identity service (lấy thông tin tài xế)
        Set<Long> routeIds = new HashSet<>();     // → dùng để tra bảng giá vé
        Set<Long> busTypeIds = new HashSet<>();   // → thu thập từ Bus.busType, tra bảng giá
        Set<Long> scheduleIds = new HashSet<>();  // → lấy tên loại xe yêu cầu của lịch trình
        List<Long> tripIdsToFetch = new ArrayList<>(); // → đếm ghế đã đặt (ticket count)

        for (Trip trip : trips) {
            tripIdsToFetch.add(trip.getId());
            if (trip.hasBus()) busIds.add(trip.getBusId());        // hasBus() = busId != null
            if (trip.hasMainDriver())                               // hasMainDriver() = có crew MAIN_DRIVER
                trip.getMainDriver().ifPresent(d -> driverIds.add(d.getId()));
            if (trip.getRouteId() != null) routeIds.add(trip.getRouteId());
            if (trip.getTripSchedule() != null) scheduleIds.add(trip.getTripSchedule().getId());
        }

        // ── BƯỚC 3a: Batch-fetch xe buýt từ Fleet Service ───────────────────────
        // FleetServiceClient là Spring bean nội bộ (in-process call, không phải HTTP).
        // busTypeIds được thu thập ở đây vì cần busType để build key tra bảng giá.
        Map<Long, Bus> busMap = new HashMap<>();
        if (!busIds.isEmpty()) {
            List<Bus> buses = fleetServiceClient.getBusesByIds(busIds);
            for (Bus b : buses) {
                busMap.put(b.getId(), b);                                    // key = busId
                if (b.getBusType() != null) busTypeIds.add(b.getBusType().getId()); // thu thập để tra giá
            }
        }

        // ── BƯỚC 3b: Batch-fetch tài xế từ Identity Service ────────────────────
        // Trip entity chỉ lưu driverId (FK), không eager-load User.
        // IdentityServiceClient trả List<User> theo danh sách IDs.
        Map<Long, User> driverMap = new HashMap<>();
        if (!driverIds.isEmpty()) {
            List<User> drivers = identityServiceClient.getUsersByIds(driverIds);
            for (User u : drivers) driverMap.put(u.getId(), u);
        }

        // ── BƯỚC 3c: Lấy tên loại xe yêu cầu từ TripSchedule ──────────────────
        // Mỗi schedule có thể yêu cầu nhiều loại xe (ScheduleBusType nhiều-nhiều).
        // buildScheduleBusTypeNameMap trả: scheduleId → "Giường nằm, Limousine"
        Map<Long, String> scheduleBusTypeNameMap = buildScheduleBusTypeNameMap(scheduleIds);

        // ── BƯỚC 3d: Batch-fetch bảng giá vé ──────────────────────────────────
        // Key tra cứu: "routeId-busTypeId" → giá vé (BigDecimal).
        // Chỉ tính FareConfig có status=ACTIVE. Nếu trip chưa có xe/tuyến → giá = 0.
        Map<String, BigDecimal> fareMap = new HashMap<>();
        if (!routeIds.isEmpty() && !busTypeIds.isEmpty()) {
            List<FareConfig> fares = pricingServiceClient.getAllFareConfigs();
            for (FareConfig fare : fares) {
                if (fare.getRoute() != null && fare.getBusType() != null
                        && FareConfigStatus.ACTIVE.equals(fare.getStatus())) {
                    fareMap.put(fare.getRoute().getId() + "-" + fare.getBusType().getId(), fare.getPrice());
                }
            }
        }

        // ── BƯỚC 3e: Đếm ghế đã đặt theo từng trip (aggregate query) ──────────
        // countBookedSeatsByTripIds dùng GROUP BY tripId → trả Object[][]
        //   row[0] = tripId (Long), row[1] = số ghế đã đặt (Number/BigInteger)
        // Tránh load toàn bộ Ticket entity chỉ để đếm.
        Map<Long, Integer> bookedSeatsMap = new HashMap<>();
        if (!tripIdsToFetch.isEmpty()) {
            List<Object[]> bookedCounts = ticketRepository.countBookedSeatsByTripIds(tripIdsToFetch);
            for (Object[] row : bookedCounts) {
                bookedSeatsMap.put((Long) row[0], ((Number) row[1]).intValue());
            }
        }

        // ── BƯỚC 4: Sắp xếp kết quả theo ngày + giờ khởi hành ─────────────────
        // findAllById không đảm bảo thứ tự → phải sort thủ công.
        // actualDepartureTime: giờ thực tế khởi hành (null nếu chưa chạy).
        // Fallback MIDNIGHT khi null → hiển thị đầu danh sách trong ngày.
        trips.sort(java.util.Comparator
                .comparing(Trip::getDepartureDate)
                .thenComparing(t -> t.getActualDepartureTime() != null
                        ? t.getActualDepartureTime()
                        : java.time.LocalTime.MIDNIGHT));

        // ── BƯỚC 5: Ánh xạ sang DTO và trả về ─────────────────────────────────
        // toResponseListWithDetails nhận các Map đã chuẩn bị ở trên.
        // Với mỗi trip: lookup O(1) theo ID thay vì gọi thêm service/repo.
        return tripMapper.toResponseListWithDetails(trips, busMap, driverMap, fareMap, scheduleBusTypeNameMap, bookedSeatsMap);
    }

    private Map<Long, String> buildScheduleBusTypeNameMap(Set<Long> scheduleIds) {
        Map<Long, String> map = new HashMap<>();
        if (scheduleIds.isEmpty())
            return map;

        List<ScheduleBusType> sbts = scheduleBusTypeRepository
                .findByTripScheduleIdInAndStatusActive(scheduleIds);

        // Group by scheduleId, join bus type names
        sbts.stream()
                .filter(sbt -> sbt.getBusType() != null)
                .collect(Collectors.groupingBy(
                        sbt -> sbt.getTripSchedule().getId(),
                        Collectors.mapping(sbt -> sbt.getBusType().getName(),
                                Collectors.joining(", "))))
                .forEach(map::put);

        return map;
    }
}
