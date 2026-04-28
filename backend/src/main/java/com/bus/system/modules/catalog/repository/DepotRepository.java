package com.bus.system.modules.catalog.repository;

import com.bus.system.modules.catalog.domain.Depot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepotRepository extends JpaRepository<Depot, Long> {

    List<Depot> findByStatus(com.bus.system.modules.catalog.domain.enums.DepotStatus status);

    List<Depot> findByDeletedAtIsNull();

    List<Depot> findByDeletedAtIsNotNullOrderByUpdatedAtDesc();
}
