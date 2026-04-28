package com.bus.system.modules.planning.repository;

import com.bus.system.modules.planning.domain.PickupPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PickupPointRepository extends JpaRepository<PickupPoint, Long> {

    /**
     * Tìm pickup point theo ID, chỉ lấy chưa bị xóa mềm.
     */
    Optional<PickupPoint> findByIdAndDeletedAtIsNull(Long id);

    /**
     * Tìm tất cả pickup points ACTIVE chưa bị xóa mềm, sắp xếp theo thứ tự.
     */
    List<PickupPoint> findByRouteIdAndDeletedAtIsNullAndStatusOrderBySequenceOrderAsc(Long routeId, String status);

    /**
     * Tìm tất cả pickup points chưa bị xóa mềm (bao gồm INACTIVE).
     */
    List<PickupPoint> findByRouteIdAndDeletedAtIsNullOrderBySequenceOrderAsc(Long routeId);

    /**
     * Kiểm tra sequence_order đã tồn tại trong route chưa (chỉ check bản ghi chưa
     * xóa).
     */
    boolean existsByRouteIdAndSequenceOrderAndDeletedAtIsNull(Long routeId, Integer sequenceOrder);
}
