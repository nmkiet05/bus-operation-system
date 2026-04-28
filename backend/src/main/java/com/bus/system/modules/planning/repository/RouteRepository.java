package com.bus.system.modules.planning.repository;

import com.bus.system.modules.planning.domain.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {

    boolean existsByCode(String code);

    // Tìm tuyến theo Bến đi - Bến đến (ID)
    @Query("SELECT r FROM Route r WHERE r.departureStationId = :depId " +
            "AND r.arrivalStationId = :arrId " +
            "AND r.deletedAt IS NULL AND r.status = 'ACTIVE'")
    List<Route> findRoutes(Long depId, Long arrId);

    List<Route> findByDeletedAtIsNull();

    List<Route> findByDeletedAtIsNotNullOrderByUpdatedAtDesc();
}