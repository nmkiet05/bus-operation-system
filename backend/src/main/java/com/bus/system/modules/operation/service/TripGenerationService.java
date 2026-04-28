package com.bus.system.modules.operation.service;

import com.bus.system.modules.operation.dto.request.CreateTripRequest;
import com.bus.system.modules.operation.dto.request.TripGenerationRequest;
import com.bus.system.modules.operation.dto.response.TripGenerationResponse;
import com.bus.system.modules.operation.dto.response.TripResponse;

/**
 * Service cho việc tạo Trip (Generation).
 * Trách nhiệm: Trip creation logic (auto-generation & manual creation).
 */
public interface TripGenerationService {

    /**
     * Sinh chuyến tự động từ TripSchedule.
     * 
     * @param request Thông tin sinh lịch
     * @return Kết quả sinh lịch
     */
    TripGenerationResponse generateTrips(TripGenerationRequest request);

    /**
     * Tạo chuyến thủ công (MAIN hoặc REINFORCEMENT).
     * 
     * @param request Thông tin chuyến
     * @return TripResponse
     */
    TripResponse createTrip(CreateTripRequest request);
}
