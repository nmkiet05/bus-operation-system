package com.bus.system.modules.planning.controller;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.fleet.repository.BusRepository;
import com.bus.system.modules.planning.contract.RegistrationStatus;
import com.bus.system.modules.planning.domain.Route;
import com.bus.system.modules.planning.domain.RouteRegistration;
import com.bus.system.modules.planning.dto.request.CreateRouteRegistrationRequest;
import com.bus.system.modules.planning.dto.response.RouteRegistrationResponse;
import com.bus.system.modules.planning.mapper.RouteRegistrationMapper;
import com.bus.system.modules.planning.repository.RouteRegistrationRepository;
import com.bus.system.modules.planning.repository.RouteRepository;
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
 * CRUD cho đăng ký khai thác tuyến (Route Bus Registration).
 */
@RestController
@RequestMapping("/api/routes/{routeId}/registrations")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RouteRegistrationController {

        private final RouteRegistrationRepository registrationRepository;
        private final RouteRepository routeRepository;
        private final BusRepository busRepository;
        private final RouteRegistrationMapper mapper;

        @PostMapping
        @ResponseStatus(HttpStatus.CREATED)
        @Transactional
        public RouteRegistrationResponse create(
                        @PathVariable Long routeId,
                        @Valid @RequestBody CreateRouteRegistrationRequest request) {
                Route route = routeRepository.findById(routeId)
                                .orElseThrow(() -> new ResourceNotFoundException("Tuyến", "id", routeId));
                Bus bus = busRepository.findById(request.getBusId())
                                .orElseThrow(() -> new ResourceNotFoundException("Xe", "id", request.getBusId()));

                if (registrationRepository.existsByRouteIdAndBusIdAndStatus(
                                routeId, request.getBusId(), RegistrationStatus.ACTIVE)) {
                        throw new BusinessException("ALREADY_REGISTERED", "Xe đã đăng ký tuyến này.");
                }

                RouteRegistration reg = RouteRegistration.create(route, bus,
                                request.getBadgeNumber(), request.getExpiredAt());
                return mapper.toResponse(registrationRepository.save(reg));
        }

        @GetMapping
        public List<RouteRegistrationResponse> list(
                        @PathVariable Long routeId,
                        @RequestParam(defaultValue = "ACTIVE") RegistrationStatus status) {
                return registrationRepository.findByRouteIdAndStatus(routeId, status).stream()
                                .map(mapper::toResponse)
                                .collect(Collectors.toList());
        }

        @GetMapping("/history")
        public List<RouteRegistrationResponse> history(@PathVariable Long routeId) {
                return registrationRepository.findByRouteIdOrderByRegisteredAtDesc(routeId).stream()
                                .map(mapper::toResponse)
                                .collect(Collectors.toList());
        }

        @PutMapping("/{regId}/revoke")
        @Transactional
        public RouteRegistrationResponse revoke(
                        @PathVariable Long routeId,
                        @PathVariable Long regId,
                        @RequestParam String reason) {
                RouteRegistration reg = registrationRepository.findById(regId)
                                .orElseThrow(() -> new ResourceNotFoundException("Đăng ký", "id", regId));

                if (reg.getStatus() != RegistrationStatus.ACTIVE) {
                        throw new BusinessException("NOT_ACTIVE", "Chỉ có thể thu hồi đăng ký đang ACTIVE.");
                }

                reg.revoke(reason);
                return mapper.toResponse(registrationRepository.save(reg));
        }
}
