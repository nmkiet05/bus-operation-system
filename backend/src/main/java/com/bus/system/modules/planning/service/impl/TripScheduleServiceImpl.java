package com.bus.system.modules.planning.service.impl;

import com.bus.system.common.exception.BusinessException; // Đảm bảo bạn có class này hoặc dùng RuntimeException
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.planning.domain.TripSchedule;
import com.bus.system.modules.planning.contract.ScheduleStatus;
import com.bus.system.modules.planning.dto.request.TripScheduleRequest;
import com.bus.system.modules.planning.dto.response.TripScheduleResponse;
import com.bus.system.modules.planning.mapper.TripScheduleMapper;
import com.bus.system.modules.planning.repository.TripScheduleRepository;
import com.bus.system.modules.planning.domain.QTripSchedule;
import com.querydsl.core.BooleanBuilder;
import com.bus.system.modules.planning.service.TripScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripScheduleServiceImpl implements TripScheduleService {

    private final TripScheduleRepository tripScheduleRepository;
    private final TripScheduleMapper tripScheduleMapper;

    @Override
    @Transactional
    public TripScheduleResponse create(TripScheduleRequest request) {
        // Validate trùng giờ (ID = -1 vì tạo mới chưa có ID)
        validateOverlap(request, -1L);

        TripSchedule entity = Objects.requireNonNull(tripScheduleMapper.toEntity(request));
        return tripScheduleMapper.toResponse(tripScheduleRepository.save(Objects.requireNonNull(entity)));
    }

    @Override
    @Transactional
    public TripScheduleResponse update(Long id, TripScheduleRequest request) {
        TripSchedule entity = tripScheduleRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("TripSchedule", "id", id));

        // Validate trùng giờ (Truyền ID hiện tại để loại trừ chính nó)
        validateOverlap(request, id);

        tripScheduleMapper.updateEntity(entity, request);
        return tripScheduleMapper.toResponse(tripScheduleRepository.save(Objects.requireNonNull(entity)));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        TripSchedule entity = tripScheduleRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("TripSchedule", "id", id));

        // Soft delete để tránh xung đột FK với dữ liệu trip đã sinh
        entity.setStatus(ScheduleStatus.INACTIVE);
        entity.setDeletedAt(LocalDateTime.now());
        tripScheduleRepository.save(entity);
    }

    @Override
    @Transactional
    public void restore(Long id) {
        TripSchedule entity = tripScheduleRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("TripSchedule", "id", id));

        entity.setDeletedAt(null);
        entity.setStatus(ScheduleStatus.ACTIVE);
        tripScheduleRepository.save(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripScheduleResponse> getSchedulesByRoute(Long routeId) {
        return tripScheduleRepository.findByRouteIdAndDeletedAtIsNullOrderByDepartureTimeAsc(routeId).stream()
                .map(tripScheduleMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripScheduleResponse> getDeletedSchedulesByRoute(Long routeId) {
        return tripScheduleRepository.findByRouteIdAndDeletedAtIsNotNullOrderByUpdatedAtDesc(routeId).stream()
                .map(tripScheduleMapper::toResponse)
                .collect(Collectors.toList());
    }

    // --- PRIVATE HELPER ---
    private void validateOverlap(TripScheduleRequest request, Long excludeId) {
        LocalTime targetTime = request.getDepartureTime();
        // Tính khoảng +/- 30 phút
        LocalTime minTime = targetTime.minusMinutes(30);
        LocalTime maxTime = targetTime.plusMinutes(30);

        QTripSchedule qTs = QTripSchedule.tripSchedule;
        BooleanBuilder builder = new BooleanBuilder();

        builder.and(qTs.route.id.eq(request.getRouteId()));
        builder.and(qTs.status.eq(ScheduleStatus.ACTIVE));
        builder.and(qTs.deletedAt.isNull());
        builder.and(qTs.id.ne(excludeId));

        // Effective Date Overlap
        // (ts.effectiveTo IS NULL OR ts.effectiveTo >= eFrom) AND (eTo IS NULL OR
        // ts.effectiveFrom <= eTo)
        BooleanBuilder dateOverlap = new BooleanBuilder();
        LocalDate eFrom = request.getEffectiveFrom();
        LocalDate eTo = request.getEffectiveTo();

        // Condition 1: ts.effectiveTo >= eFrom OR ts.effectiveTo IS NULL
        dateOverlap.and(qTs.effectiveTo.isNull().or(qTs.effectiveTo.goe(eFrom)));

        // Condition 2: ts.effectiveFrom <= eTo OR eTo IS NULL
        if (eTo != null) {
            dateOverlap.and(qTs.effectiveFrom.loe(eTo));
        }

        builder.and(dateOverlap);

        // Time Overlap
        BooleanBuilder timeOverlap = new BooleanBuilder();

        if (!minTime.isAfter(maxTime)) {
            // Normal case (e.g. 10:00 - 11:00)
            timeOverlap.and(qTs.departureTime.goe(minTime).and(qTs.departureTime.loe(maxTime)));
        } else {
            // Midnight crossing (e.g. 23:40 - 00:20)
            timeOverlap.and(qTs.departureTime.goe(minTime).or(qTs.departureTime.loe(maxTime)));
        }

        builder.and(timeOverlap);

        boolean isOverlap = tripScheduleRepository.exists(builder);

        if (isOverlap) {
            throw new BusinessException("Vi phạm giãn cách chuyến! Đã có lịch chạy trong khoảng thời gian "
                    + minTime + " - " + maxTime + " cho tuyến này.");
        }
    }
}