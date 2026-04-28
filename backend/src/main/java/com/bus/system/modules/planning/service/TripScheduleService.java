package com.bus.system.modules.planning.service;

import com.bus.system.modules.planning.dto.request.TripScheduleRequest;
import com.bus.system.modules.planning.dto.response.TripScheduleResponse;

import java.util.List;

public interface TripScheduleService {
    TripScheduleResponse create(TripScheduleRequest request);

    TripScheduleResponse update(Long id, TripScheduleRequest request);

    void delete(Long id);

    void restore(Long id);

    List<TripScheduleResponse> getSchedulesByRoute(Long routeId);

    List<TripScheduleResponse> getDeletedSchedulesByRoute(Long routeId);
}