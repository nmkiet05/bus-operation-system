package com.bus.system.modules.planning.mapper;

import com.bus.system.modules.planning.domain.Route;
import com.bus.system.modules.planning.dto.request.RouteRequest;
import com.bus.system.modules.planning.dto.response.RouteResponse; // Bạn tự tạo class Response tương tự Request nhé
import org.springframework.stereotype.Component;

@Component
public class RouteMapper {

    public Route toEntity(RouteRequest request) {
        if (request == null)
            return null;
        Route route = new Route();
        route.setCode(request.getCode());
        route.setName(request.getName());
        route.setDepartureStationId(request.getDepartureStationId());
        route.setArrivalStationId(request.getArrivalStationId());
        route.setDistance(request.getDistance());
        route.setDurationHours(request.getDurationHours());
        route.setItineraryDetail(request.getItineraryDetail());
        route.setHotline(request.getHotline());
        route.setDefaultRefundPolicyId(request.getDefaultRefundPolicyId());
        return route;
    }

    // Logic update từ request đè vào entity cũ
    public void updateRouteFromRequest(Route route, RouteRequest request) {
        if (request == null)
            return;
        route.setName(request.getName());
        route.setDepartureStationId(request.getDepartureStationId());
        route.setArrivalStationId(request.getArrivalStationId());
        route.setDistance(request.getDistance());
        route.setDurationHours(request.getDurationHours());
        route.setItineraryDetail(request.getItineraryDetail());
        route.setHotline(request.getHotline());
        route.setDefaultRefundPolicyId(request.getDefaultRefundPolicyId());
        if (request.getStatus() != null)
            route.setStatus(request.getStatus());
    }

    // (Optional) toResponse bạn tự map các trường tương ứng nhé
    // Trong RouteMapper.java

    public RouteResponse toResponse(Route route) {
        if (route == null)
            return null;

        RouteResponse response = new RouteResponse();
        response.setId(route.getId());
        response.setCode(route.getCode());
        response.setName(route.getName());
        response.setDepartureStationId(route.getDepartureStationId());
        response.setArrivalStationId(route.getArrivalStationId());
        response.setDistance(route.getDistance());
        response.setDurationHours(route.getDurationHours());
        response.setItineraryDetail(route.getItineraryDetail());
        response.setHotline(route.getHotline());
        response.setDefaultRefundPolicyId(route.getDefaultRefundPolicyId());
        response.setStatus(route.getStatus());
        response.setCreatedAt(route.getCreatedAt());
        response.setUpdatedAt(route.getUpdatedAt());

        return response;
    }
}