package com.bus.system.modules.catalog.service;

import com.bus.system.modules.catalog.dto.request.TicketOfficeRequest;
import com.bus.system.modules.catalog.dto.response.TicketOfficeResponse;

import java.util.List;

public interface TicketOfficeService {
    TicketOfficeResponse createTicketOffice(TicketOfficeRequest request);

    TicketOfficeResponse updateTicketOffice(Long id, TicketOfficeRequest request);

    void deleteTicketOffice(Long id);

    TicketOfficeResponse getTicketOfficeById(Long id);

    List<TicketOfficeResponse> getAllTicketOffices();

    List<TicketOfficeResponse> getTicketOfficesByStation(Long stationId);
}
