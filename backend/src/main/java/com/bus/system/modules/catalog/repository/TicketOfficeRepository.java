package com.bus.system.modules.catalog.repository;

import com.bus.system.modules.catalog.domain.TicketOffice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketOfficeRepository extends JpaRepository<TicketOffice, Long> {
    List<TicketOffice> findByStationId(Long stationId);
}
