package com.bus.system.modules.planning.service;

import com.bus.system.modules.planning.dto.request.RouteRequest;
import com.bus.system.modules.planning.dto.response.RouteResponse;
import java.util.List;

public interface RouteService {
    RouteResponse createRoute(RouteRequest request);
    RouteResponse updateRoute(Long id, RouteRequest request);
    RouteResponse getRouteById(Long id);
    void deleteRoute(Long id);
    void restoreRoute(Long id);
    List<RouteResponse> getAllRoutes();
    List<RouteResponse> getDeletedRoutes();
}