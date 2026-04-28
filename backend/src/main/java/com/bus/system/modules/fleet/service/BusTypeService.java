package com.bus.system.modules.fleet.service;

import com.bus.system.modules.fleet.dto.request.BusTypeRequest;
import com.bus.system.modules.fleet.dto.response.BusTypeResponse;

import java.util.List;

public interface BusTypeService {
    BusTypeResponse create(BusTypeRequest request);

    BusTypeResponse update(Long id, BusTypeRequest request);

    void delete(Long id);

    void restore(Long id);

    List<BusTypeResponse> getAll();

    List<BusTypeResponse> getDeletedBusTypes();

    BusTypeResponse getById(Long id);
}
