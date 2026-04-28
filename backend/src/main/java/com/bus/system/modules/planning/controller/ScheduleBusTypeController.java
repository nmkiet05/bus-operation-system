package com.bus.system.modules.planning.controller;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.fleet.domain.BusType;
import com.bus.system.modules.fleet.repository.BusTypeRepository;
import com.bus.system.modules.planning.contract.ScheduleBusTypeStatus;
import com.bus.system.modules.planning.domain.ScheduleBusType;
import com.bus.system.modules.planning.domain.TripSchedule;
import com.bus.system.modules.planning.dto.request.CreateScheduleBusTypeRequest;
import com.bus.system.modules.planning.dto.response.ScheduleBusTypeResponse;
import com.bus.system.modules.planning.mapper.ScheduleBusTypeMapper;
import com.bus.system.modules.planning.repository.ScheduleBusTypeRepository;
import com.bus.system.modules.planning.repository.TripScheduleRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * CRUD cho loại xe lịch chạy (Schedule Bus Type).
 */
@RestController
@RequestMapping("/api/schedules/{scheduleId}/bus-types")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ScheduleBusTypeController {

    private final ScheduleBusTypeRepository scheduleBusTypeRepository;
    private final TripScheduleRepository tripScheduleRepository;
    private final BusTypeRepository busTypeRepository;
    private final ScheduleBusTypeMapper mapper;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ScheduleBusTypeResponse create(
            @PathVariable Long scheduleId,
            @Valid @RequestBody CreateScheduleBusTypeRequest request) {
        TripSchedule schedule = tripScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Lịch chạy", "id", scheduleId));
        BusType busType = busTypeRepository.findById(request.getBusTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Loại xe", "id", request.getBusTypeId()));

        if (scheduleBusTypeRepository.existsByTripScheduleIdAndBusTypeIdAndStatus(
                scheduleId, request.getBusTypeId(), ScheduleBusTypeStatus.ACTIVE)) {
            throw new BusinessException("ALREADY_EFFECTIVE", "Loại xe này đã có hiệu lực cho lịch chạy.");
        }

        ScheduleBusType sbt = ScheduleBusType.create(schedule, busType, request.getReason());
        return mapper.toResponse(scheduleBusTypeRepository.save(sbt));
    }

    @GetMapping
    public List<ScheduleBusTypeResponse> listEffective(@PathVariable Long scheduleId) {
        return scheduleBusTypeRepository.findByTripScheduleIdAndStatus(scheduleId, ScheduleBusTypeStatus.ACTIVE)
                .stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/history")
    public List<ScheduleBusTypeResponse> history(@PathVariable Long scheduleId) {
        return scheduleBusTypeRepository.findByTripScheduleIdOrderByEffectiveFromDesc(scheduleId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @PutMapping("/{sbtId}/end")
    @Transactional
    public ScheduleBusTypeResponse end(
            @PathVariable Long scheduleId,
            @PathVariable Long sbtId,
            @RequestParam String reason) {
        ScheduleBusType sbt = scheduleBusTypeRepository.findById(sbtId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule Bus Type", "id", sbtId));

        if (!sbt.isEffective()) {
            throw new BusinessException("ALREADY_ENDED", "Loại xe này đã kết thúc hiệu lực.");
        }

        sbt.end(reason);
        return mapper.toResponse(scheduleBusTypeRepository.save(sbt));
    }
}
