package com.bus.system.modules.operation.repository;

import com.bus.system.modules.operation.domain.VehicleHandover;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.querydsl.QuerydslPredicateExecutor;

@Repository
public interface VehicleHandoverRepository extends JpaRepository<VehicleHandover, Long>,
                org.springframework.data.jpa.repository.JpaSpecificationExecutor<VehicleHandover>,
                QuerydslPredicateExecutor<VehicleHandover> {
        /**
         * Tìm bàn giao xe ĐANG ACTIVE của tài xế (chưa trả xe).
         * Logic: Lấy record mới nhất của tài xế. Nếu là RECEIVE -> Đang giữ xe.
         */
        @Query("""
                        SELECT vh FROM VehicleHandover vh
                        WHERE vh.driver.id = :driverId
                        AND vh.handoverTime = (
                            SELECT MAX(v2.handoverTime)
                            FROM VehicleHandover v2
                            WHERE v2.driver.id = :driverId
                        )
                        AND vh.handoverType = 'RECEIVE'
                        """)
        Optional<VehicleHandover> findActiveHandoverByDriver(@Param("driverId") Long driverId);

        /**
         * Tìm tất cả tài xế ĐANG GIỮ XE.
         * Logic: Lấy tất cả record mới nhất của từng tài xế, nếu là RECEIVE thì lấy.
         */
        @Query("""
                        SELECT vh FROM VehicleHandover vh
                        WHERE vh.handoverTime = (
                            SELECT MAX(v2.handoverTime)
                            FROM VehicleHandover v2
                            WHERE v2.driver = vh.driver
                        )
                        AND vh.handoverType = 'RECEIVE'
                        ORDER BY vh.handoverTime DESC
                        """)
        List<VehicleHandover> findAllActiveHandovers();

        /**
         * Tìm bàn giao xe ĐANG ACTIVE theo xe (Bus-First Assignment).
         */
        @Query("""
                        SELECT vh FROM VehicleHandover vh
                        WHERE vh.bus.id = :busId
                        AND vh.handoverTime = (
                            SELECT MAX(v2.handoverTime)
                            FROM VehicleHandover v2
                            WHERE v2.bus.id = :busId
                        )
                        AND vh.handoverType = 'RECEIVE'
                        """)
        Optional<VehicleHandover> findActiveHandoverByBus(@Param("busId") Long busId);

        List<VehicleHandover> findByTripIdAndStatusIn(Long tripId,
                        java.util.Collection<com.bus.system.modules.operation.domain.enums.HandoverStatus> statuses);

        boolean existsByTripIdAndStatusIn(Long tripId,
                        java.util.Collection<com.bus.system.modules.operation.domain.enums.HandoverStatus> statuses);

        /**
         * Tìm handover chưa đóng (actual_return_time IS NULL) theo driver hoặc bus.
         * Dùng để auto-close trước khi tạo handover mới, tránh trigger overlap.
         */
        @Query("""
                        SELECT vh FROM VehicleHandover vh
                        WHERE vh.actualReturnTime IS NULL
                        AND (vh.driver.id = :driverId OR vh.bus.id = :busId)
                        """)
        List<VehicleHandover> findOpenHandoversByDriverOrBus(@Param("driverId") Long driverId,
                        @Param("busId") Long busId);

        /**
         * Lấy toàn bộ handover của 1 trip (mọi trạng thái), sắp xếp theo thời gian mới
         * nhất.
         */
        List<VehicleHandover> findByTripIdOrderByHandoverTimeDesc(Long tripId);
}
