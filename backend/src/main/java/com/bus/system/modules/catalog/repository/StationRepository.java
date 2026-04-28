package com.bus.system.modules.catalog.repository;

import com.bus.system.modules.catalog.domain.BusStation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StationRepository extends JpaRepository<BusStation, Long> {
    boolean existsByGovCode(String govCode);
}