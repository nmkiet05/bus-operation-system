package com.bus.system.modules.fleet.repository;

import com.bus.system.modules.fleet.domain.BusType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BusTypeRepository extends JpaRepository<BusType, Long> {
    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);
}