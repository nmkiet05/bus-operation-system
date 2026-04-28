package com.bus.system.modules.catalog.service;

import com.bus.system.modules.catalog.dto.request.DepotRequest;
import com.bus.system.modules.catalog.dto.response.DepotResponse;

import java.util.List;

/**
 * Depot Service — Operational Data (Full CRUD)
 *
 * Depot (Bãi đỗ xe) do công ty tự quản lý, khác với Station (pháp lý).
 * → Có đầy đủ CREATE, READ, UPDATE, DELETE.
 */
public interface DepotService {

    DepotResponse createDepot(DepotRequest request);

    List<DepotResponse> getAllDepots();

    DepotResponse updateDepot(Long id, DepotRequest request);

    void deleteDepot(Long id);

    void restoreDepot(Long id);

    List<DepotResponse> getDeletedDepots();
}
