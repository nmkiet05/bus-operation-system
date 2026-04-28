package com.bus.system.modules.operation.service;

import com.bus.system.modules.operation.dto.request.TripSearchRequest;
import com.bus.system.modules.operation.dto.response.TripResponse;
import org.springframework.data.domain.Page;

import java.time.LocalDate;
import java.util.List;

/**
 * Service cho các thao tác READ (Query) trên Trip.
 * Trách nhiệm: Read-only operations, mapping entities to DTOs.
 */
public interface TripQueryService {

        /**
         * Lấy chi tiết một chuyến.
         * 
         * @param id Trip ID
         * @return TripResponse
         */
        TripResponse getTripById(Long id);

        /**
         * Tìm kiếm chuyến theo bộ lọc.
         * 
         * @param routeId        Tuyến đường (optional)
         * @param fromProvinceId Tỉnh đi (optional)
         * @param toProvinceId   Tỉnh đến (optional)
         * @param fromDate       Ngày bắt đầu (optional)
         * @param toDate         Ngày kết thúc (optional)
         * @return Danh sách chuyến
         */
        List<TripResponse> getTrips(Long routeId, Long fromProvinceId, Long toProvinceId,
                        LocalDate fromDate, LocalDate toDate);

        /**
         * Tìm kiếm chuyến theo bộ lọc (Admin — có filter status).
         */
        List<TripResponse> getTrips(Long routeId, Long fromProvinceId, Long toProvinceId,
                        LocalDate fromDate, LocalDate toDate, String status, String tripType);

        /**
         * Tìm kiếm chuyến xe nâng cao (Customer/Advanced).
         * Phân trang & Lọc theo nhiều tiêu chí (Giá, Giờ, Loại xe...).
         * 
         * @param request Request DTO
         * @return Page<TripResponse>
         */
        Page<TripResponse> searchTrips(TripSearchRequest request);

        /**
         * Lấy danh sách chuyến được phân công cho tài xế trong khoảng ngày.
         * Dùng cho Driver Portal (read-only).
         *
         * @param driverId ID tài xế (currentUser.id)
         * @param fromDate Ngày bắt đầu
         * @param toDate   Ngày kết thúc
         * @return Danh sách chuyến của tài xế
         */
        List<TripResponse> getTripsByDriver(Long driverId, LocalDate fromDate, LocalDate toDate);
}
