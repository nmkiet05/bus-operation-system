package com.bus.system.modules.catalog.service.impl;

import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.catalog.domain.BusStation;
import com.bus.system.modules.catalog.repository.StationRepository;
import com.bus.system.modules.catalog.domain.TicketOffice;
import com.bus.system.modules.catalog.dto.request.TicketOfficeRequest;
import com.bus.system.modules.catalog.dto.response.TicketOfficeResponse;
import com.bus.system.modules.catalog.mapper.TicketOfficeMapper;
import com.bus.system.modules.catalog.repository.TicketOfficeRepository;
import com.bus.system.modules.catalog.service.TicketOfficeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.Map;
import java.util.Collections;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketOfficeServiceImpl implements TicketOfficeService {

    private final TicketOfficeRepository ticketOfficeRepository;
    private final StationRepository stationRepository;
    private final TicketOfficeMapper ticketOfficeMapper;

    @Override
    @Transactional
    public TicketOfficeResponse createTicketOffice(TicketOfficeRequest request) {
        TicketOffice ticketOffice = Objects.requireNonNull(ticketOfficeMapper.toEntity(request));

        Long stationId = request.getStationId();
        if (stationId != null) {
            BusStation station = stationRepository.findById(stationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Bến xe", "id", stationId));
            ticketOffice.setStation(station);
        }

        if (ticketOffice.getStatus() == null) {
            ticketOffice.setStatus("ACTIVE");
        }

        TicketOffice saved = Objects.requireNonNull(ticketOfficeRepository.save(ticketOffice));
        return ticketOfficeMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public TicketOfficeResponse updateTicketOffice(Long id, TicketOfficeRequest request) {
        TicketOffice ticketOffice = ticketOfficeRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Văn phòng bán vé", "id", id));

        ticketOfficeMapper.updateEntity(ticketOffice, request);

        Long stationId = request.getStationId();
        if (stationId != null) {
            BusStation station = stationRepository.findById(stationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Bến xe", "id", stationId));
            ticketOffice.setStation(station);
        } else {
            ticketOffice.setStation(null); // Allow independent agent
        }

        TicketOffice saved = Objects.requireNonNull(ticketOfficeRepository.save(ticketOffice));
        return ticketOfficeMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteTicketOffice(Long id) {
        TicketOffice ticketOffice = ticketOfficeRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Văn phòng bán vé", "id", id));
        ticketOffice.setDeletedAt(LocalDateTime.now());
        ticketOfficeRepository.save(ticketOffice);
    }

    @Override
    @Transactional(readOnly = true)
    public TicketOfficeResponse getTicketOfficeById(Long id) {
        TicketOffice ticketOffice = ticketOfficeRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("Văn phòng bán vé", "id", id));
        return ticketOfficeMapper.toResponse(ticketOffice);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketOfficeResponse> getAllTicketOffices() {
        List<TicketOffice> offices = ticketOfficeRepository.findAll().stream()
                .filter(t -> t.getDeletedAt() == null)
                .collect(Collectors.toList());

        return enrichAndMap(offices);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketOfficeResponse> getTicketOfficesByStation(Long stationId) {
        List<TicketOffice> offices = ticketOfficeRepository.findByStationId(stationId).stream()
                .filter(t -> t.getDeletedAt() == null)
                .collect(Collectors.toList());

        return enrichAndMap(offices);
    }

    private List<TicketOfficeResponse> enrichAndMap(List<TicketOffice> offices) {
        if (offices.isEmpty())
            return List.of();

        Set<Long> stationIds = offices.stream()
                .filter(o -> o.getStation() != null)
                .map(o -> o.getStation().getId())
                .collect(Collectors.toSet());

        Map<Long, BusStation> stationMap = Collections.emptyMap();
        if (!stationIds.isEmpty()) {
            stationMap = stationRepository.findAllById(stationIds).stream()
                    .collect(Collectors.toMap(BusStation::getId, s -> s));
        }

        return ticketOfficeMapper.toResponseListWithMap(offices, stationMap);
    }
}
