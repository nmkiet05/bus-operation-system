package com.bus.system.modules.pricing.repository;

import com.bus.system.modules.pricing.contract.FareConfigStatus;
import com.bus.system.modules.pricing.domain.FareConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.querydsl.QuerydslPredicateExecutor;

@Repository
public interface FareConfigRepository extends JpaRepository<FareConfig, Long>,
                org.springframework.data.jpa.repository.JpaSpecificationExecutor<FareConfig>,
                QuerydslPredicateExecutor<FareConfig> {

        /**
         * Tìm giá vé đang có hiệu lực (Active) cho một Tuyến và Loại xe cụ thể.
         * Logic Query khớp với nghiệp vụ SCD Type 2:
         * 1. Đúng Route ID, BusType ID.
         * 2. Status là ACTIVE.
         * 3. Chưa bị xóa (deletedAt IS NULL).
         * 4. Ngày cần tìm (queryDate) >= Ngày hiệu lực (effectiveFrom).
         * 5. Ngày cần tìm (queryDate) <= Ngày kết thúc (effectiveTo) HOẶC effectiveTo
         * là NULL (vô thời hạn).
         */
        @Query("SELECT f FROM FareConfig f " +
                        "WHERE f.route.id = :routeId " +
                        "AND f.busType.id = :busTypeId " +
                        "AND f.status = :status " +
                        "AND f.deletedAt IS NULL " +
                        "AND f.effectiveFrom <= :queryDate " +
                        "AND (f.effectiveTo IS NULL OR f.effectiveTo >= :queryDate)")
        Optional<FareConfig> findActiveFare(@Param("routeId") Long routeId,
                        @Param("busTypeId") Long busTypeId,
                        @Param("queryDate") LocalDate queryDate,
                        @Param("status") FareConfigStatus status);

        default Optional<FareConfig> findActiveFare(Long routeId, Long busTypeId, LocalDate queryDate) {
                return findActiveFare(routeId, busTypeId, queryDate,
                                FareConfigStatus.ACTIVE);
        }

        /**
         * Kiểm tra xem có cấu hình giá nào chồng chéo khoảng thời gian không (Dùng cho
         * Validate lúc tạo mới).
         */
        @Query("SELECT COUNT(f) > 0 FROM FareConfig f " +
                        "WHERE f.route.id = :routeId " +
                        "AND f.busType.id = :busTypeId " +
                        "AND f.status = :status " +
                        "AND f.deletedAt IS NULL " +
                        "AND f.id <> :excludeId " + // Trừ chính nó ra (khi update)
                        "AND (" +
                        "   (f.effectiveTo IS NULL OR f.effectiveTo >= :newEffectiveFrom)" +
                        "   AND " +
                        "   (:newEffectiveTo IS NULL OR f.effectiveFrom <= :newEffectiveTo)" +
                        ")")
        boolean existsOverlappingFare(@Param("routeId") Long routeId,
                        @Param("busTypeId") Long busTypeId,
                        @Param("newEffectiveFrom") LocalDate newEffectiveFrom,
                        @Param("newEffectiveTo") LocalDate newEffectiveTo,
                        @Param("excludeId") Long excludeId,
                        @Param("status") FareConfigStatus status);

        default boolean existsOverlappingFare(Long routeId, Long busTypeId, LocalDate newEffectiveFrom,
                        LocalDate newEffectiveTo, Long excludeId) {
                return existsOverlappingFare(routeId, busTypeId, newEffectiveFrom, newEffectiveTo, excludeId,
                                FareConfigStatus.ACTIVE);
        }
}