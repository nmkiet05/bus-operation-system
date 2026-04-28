package com.bus.system.modules.operation.repository;

import com.bus.system.modules.operation.domain.TripChange;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TripChangeRepository extends JpaRepository<TripChange, Long>,
                JpaSpecificationExecutor<TripChange> {

        /**
         * Tìm request gần nhất của một chuyến để kiểm tra Anti-spam.
         */
        Optional<TripChange> findTopByTripIdOrderByCreatedAtDesc(Long tripId);

        /**
         * Tìm request gần nhất của một người tạo (cho Anti-spam theo user).
         */
        Optional<TripChange> findTopByCreatedByOrderByCreatedAtDesc(Long createdBy);

        /**
         * [OPTIMIZED] Lấy toàn bộ danh sách — dùng LEFT JOIN FETCH cho tất cả quan hệ LAZY.
         * Tránh N+1: thay vì N câu SQL lẻ, chỉ chạy 1 câu JOIN duy nhất.
         */
        @EntityGraph(attributePaths = {"trip", "oldDriver", "newDriver"})
        @Query("SELECT r FROM TripChange r ORDER BY r.createdAt DESC")
        List<TripChange> findAllWithDetails();

        /**
         * [FIX #1] Tìm request URGENT quá timeout — JPQL query thay vì findAll().
         * Chỉ load các rows cần thiết, tránh full table scan + OOM.
         */
        @Query("SELECT r FROM TripChange r WHERE r.urgencyZone = 'URGENT' " +
                        "AND r.status = 'PENDING' AND r.createdAt < :cutoff")
        List<TripChange> findExpiredUrgentRequests(@Param("cutoff") LocalDateTime cutoff);
}
