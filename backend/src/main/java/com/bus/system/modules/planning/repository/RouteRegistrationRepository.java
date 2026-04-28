package com.bus.system.modules.planning.repository;

import com.bus.system.modules.planning.contract.RegistrationStatus;
import com.bus.system.modules.planning.domain.RouteRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RouteRegistrationRepository extends JpaRepository<RouteRegistration, Long> {

    // Xe đăng ký ACTIVE cho tuyến
    List<RouteRegistration> findByRouteIdAndStatus(Long routeId, RegistrationStatus status);

    // Kiểm tra xe có đăng ký tuyến không
    boolean existsByRouteIdAndBusIdAndStatus(Long routeId, Long busId, RegistrationStatus status);

    // Lấy bus IDs ACTIVE cho tuyến
    @Query("SELECT r.bus.id FROM RouteRegistration r WHERE r.route.id = :routeId AND r.status = 'ACTIVE' AND (r.expiredAt IS NULL OR r.expiredAt >= CURRENT_DATE)")
    List<Long> findActiveBusIdsByRouteId(@Param("routeId") Long routeId);

    // Lịch sử đăng ký theo tuyến (phục vụ phân tích)
    List<RouteRegistration> findByRouteIdOrderByRegisteredAtDesc(Long routeId);

    // Lịch sử đăng ký theo xe
    List<RouteRegistration> findByBusIdOrderByRegisteredAtDesc(Long busId);
}
