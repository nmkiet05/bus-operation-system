package com.bus.system.modules.operation.service.impl;

import com.bus.system.modules.planning.contract.ScheduleStatus;
import com.bus.system.modules.operation.domain.enums.TripStatus;
import com.bus.system.modules.operation.domain.enums.TripType;
import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.operation.dto.request.CreateTripRequest;
import com.bus.system.modules.operation.dto.request.TripGenerationRequest;
import com.bus.system.modules.operation.dto.response.TripGenerationResponse;
import com.bus.system.modules.operation.dto.response.TripResponse;
import com.bus.system.modules.operation.mapper.TripMapper;
import com.bus.system.modules.operation.repository.TripRepository;
import com.bus.system.modules.operation.service.TripGenerationService;
import com.bus.system.modules.planning.domain.TripSchedule;
import com.bus.system.modules.planning.repository.RouteRepository;
import com.bus.system.modules.planning.repository.TripScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class TripGenerationServiceImpl implements TripGenerationService {

    private final TripRepository tripRepository;
    private final TripScheduleRepository tripScheduleRepository;
    private final RouteRepository routeRepository;
    private final TripMapper tripMapper;

    /**
     * Giới hạn số ngày tối đa được phép sinh lịch một lần để đảm bảo hiệu năng.
     */
    private static final int MAX_GENERATION_DAYS = 31;

    @Override
    @Transactional
    public TripGenerationResponse generateTrips(TripGenerationRequest request) {
        // 1. Validate Input (Kiểm tra ngày tháng)
        if (request.getFromDate().isAfter(request.getToDate())) {
            throw new BusinessException("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
        }
        // Giới hạn 31 ngày để bảo vệ hiệu năng hệ thống, tránh treo DB
        if (request.getFromDate().plusDays(MAX_GENERATION_DAYS).isBefore(request.getToDate())) {
            throw new BusinessException("Hệ thống giới hạn chỉ sinh lịch tối đa " + MAX_GENERATION_DAYS + " ngày/lần.");
        }

        // 2. Lấy dữ liệu Tuyến & Lịch trình mẫu
        routeRepository.findById(Objects.requireNonNull(request.getRouteId()))
                .orElseThrow(() -> new ResourceNotFoundException("Tuyến đường", "id", request.getRouteId()));

        // Chỉ lấy các lịch trình đang ACTIVE
        List<TripSchedule> schedules = tripScheduleRepository.findByRouteIdAndStatus(request.getRouteId(),
                ScheduleStatus.ACTIVE);
        if (schedules.isEmpty()) {
            throw new BusinessException("Tuyến này chưa có lịch trình mẫu nào.");
        }

        int createdCount = 0;
        int skippedCount = 0;
        List<Trip> tripsToSave = new ArrayList<>();

        // 3. Vòng lặp chính: Duyệt qua từng ngày trong khoảng thời gian
        LocalDate currentDate = request.getFromDate();
        boolean forceRegenerate = Boolean.TRUE.equals(request.getForceRegenerate());

        while (!currentDate.isAfter(request.getToDate())) {

            for (TripSchedule schedule : schedules) {
                // A. Check ngày hiệu lực của lịch trình (Effective Date)
                if (currentDate.isBefore(schedule.getEffectiveFrom()) ||
                        (schedule.getEffectiveTo() != null && currentDate.isAfter(schedule.getEffectiveTo()))) {
                    continue; // Bỏ qua nếu lịch trình chưa có hiệu lực hoặc đã hết hạn
                }

                // B. Check ngày hoạt động trong tuần (T2, T3... thông qua Bitmask)
                // Logic moved to Entity (Rich Domain Model)
                if (!schedule.runsOnDate(currentDate)) {
                    continue; // Bỏ qua nếu lịch trình không chạy vào ngày thứ n
                }

                // C. Check trùng lặp thông minh
                // Logic: Chỉ kiểm tra xem đã có chuyến MAIN chưa.
                boolean existsMain = tripRepository.existsMainTrip(schedule.getId(), currentDate);
                if (existsMain) {
                    if (forceRegenerate) {
                        List<Trip> activeTrips = tripRepository.findActiveMainTrips(schedule.getId(), currentDate);
                        boolean canRegenerate = activeTrips.stream()
                                .allMatch(t -> t.getStatus() == TripStatus.SCHEDULED);

                        if (canRegenerate) {
                            // Force Regenerate: Xóa mềm chuyến SCHEDULED MAIN cũ rồi sinh lại
                            for (Trip old : activeTrips) {
                                old.setDeletedAt(java.time.LocalDateTime.now()); // Soft-delete
                                tripRepository.save(old);
                            }
                            // GỌI FLUSH NGAY LẬP TỨC ĐỂ XÓA MỀM CÓ HIỆU LỰC, TRÁNH VI PHẠM UNIQUE
                            // CONSTRAINT KHI THÊM MỚI
                            tripRepository.flush();

                            log.info("Force Regenerate: xóa {} chuyến SCHEDULED MAIN cũ của schedule {} ngày {}",
                                    activeTrips.size(), schedule.getId(), currentDate);
                        } else {
                            skippedCount++;
                            continue;
                        }
                    } else {
                        skippedCount++;
                        continue;
                    }
                }

                // D. Tạo chuyến mới
                // Sử dụng Factory Method của Entity
                Trip trip = Trip.create(schedule, currentDate, schedule.getDepartureTime(), TripType.MAIN);

                tripsToSave.add(trip);
                createdCount++;
            }
            currentDate = currentDate.plusDays(1);
        }

        // 4. Lưu vào Database (Batch Insert)
        try {
            if (!tripsToSave.isEmpty()) {
                tripRepository.saveAll(tripsToSave);
            }
        } catch (DataIntegrityViolationException e) {
            // Phòng trường hợp có 2 người cùng bấm nút sinh lịch cùng lúc
            log.warn("Tranh chấp dữ liệu khi sinh lịch", e);
            throw new BusinessException("Dữ liệu đã thay đổi trong quá trình xử lý (tranh chấp). Vui lòng thử lại.");
        }

        // 5. Trả về kết quả thống kê
        return TripGenerationResponse.builder()
                .success(true)
                .totalTripsCreated(createdCount)
                .totalSkipped(skippedCount)
                .message(String.format("Sinh thành công %d chuyến MAIN. Bỏ qua %d ngày đã có chuyến MAIN.",
                        createdCount, skippedCount))
                .build();
    }

    @Override
    @Transactional
    public TripResponse createTrip(CreateTripRequest request) {
        // 1. Validate TripSchedule
        TripSchedule schedule = tripScheduleRepository
                .findById(Objects.requireNonNull(request.getTripScheduleId()))
                .orElseThrow(() -> new ResourceNotFoundException("Lịch trình mẫu", "id", request.getTripScheduleId()));

        // 2. Xác định loại chuyến
        String tripType = request.getTripType();
        if (tripType == null || tripType.isBlank()) {
            tripType = TripType.MAIN.name();
        }

        tripType = tripType.toUpperCase();

        // Validate tripType
        if (!tripType.equals(TripType.MAIN.name()) && !tripType.equals(TripType.REINFORCEMENT.name())) {
            throw new BusinessException("Loại chuyến không hợp lệ. Chỉ chấp nhận: MAIN hoặc REINFORCEMENT");
        }

        // 3. Nếu là MAIN, kiểm tra xem đã có MAIN chưa
        if (tripType.equals(TripType.MAIN.name())) {
            boolean existsMain = tripRepository.existsMainTrip(schedule.getId(), request.getDepartureDate());
            if (existsMain) {
                throw new BusinessException(
                        String.format(
                                "Đã tồn tại chuyến MAIN cho lịch trình này vào ngày %s. Hãy chọn REINFORCEMENT nếu muốn thêm chuyến.",
                                request.getDepartureDate()));
            }
        }

        // 5. Tạo Trip mới bằng Factory Method
        LocalTime departureTime = request.getDepartureTime() != null
                ? request.getDepartureTime()
                : schedule.getDepartureTime();

        // Convert String to Enum explicitly at Service layer boundaries
        TripType typeEnum;
        try {
            typeEnum = TripType.valueOf(tripType.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Loại chuyến không hợp lệ: {}", tripType, e);
            throw new BusinessException("Loại chuyến không hợp lệ. Chỉ chấp nhận: MAIN, REINFORCEMENT");
        }

        Trip trip = Trip.create(schedule, request.getDepartureDate(), departureTime, typeEnum);

        // 6. Gán xe và tài xế nếu có
        if (request.getBusId() != null) {
            trip.setBusId(request.getBusId());
        }
        // [Phase 2] mainDriverId đã xóa — tài xế gán qua DriverAssignment sau approve

        // 7. Lưu vào DB
        Trip savedTrip = Objects.requireNonNull(tripRepository.save(Objects.requireNonNull(trip)));

        log.info("Tạo chuyến {} thành công: scheduleId={}, date={}, type={}",
                savedTrip.getId(), schedule.getId(), request.getDepartureDate(), tripType);

        return tripMapper.toResponse(savedTrip);
    }
}
