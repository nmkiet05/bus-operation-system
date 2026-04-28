package com.bus.system.modules.fleet.repository;

import com.bus.system.modules.fleet.domain.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import java.util.Collection;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface BusRepository extends JpaRepository<Bus, Long> {

    // 1. Kiểm tra biển số đã tồn tại chưa (Dùng khi tạo mới để tránh trùng)
    boolean existsByLicensePlate(String licensePlate);

    // 2. Tìm xe theo biển số (Dùng khi cần tìm cụ thể)
    Optional<Bus> findByLicensePlate(String licensePlate);

    // 3. Tìm xe ACTIVE và không nằm trong danh sách bận
    @Query("SELECT b FROM Bus b JOIN FETCH b.busType WHERE b.status = 'ACTIVE' AND b.deletedAt IS NULL AND b.id NOT IN :excludeIds")
    List<Bus> findActiveBusesIdNotIn(
            @Param("excludeIds") Collection<Long> excludeIds);

    // 4. Tìm tất cả xe ACTIVE (khi danh sách bận rỗng)
    @Query("SELECT b FROM Bus b JOIN FETCH b.busType WHERE b.status = 'ACTIVE' AND b.deletedAt IS NULL")
    List<Bus> findActiveBuses();

    // 5. Lấy tất cả xe (bao gồm các trạng thái) có JOIN FETCH busType
    @Query("SELECT b FROM Bus b JOIN FETCH b.busType WHERE b.deletedAt IS NULL")
    List<Bus> findAllWithBusType();

    // 6. Lấy xe theo danh sách IDs với JOIN FETCH busType (tránh
    // LazyInitializationException)
    @Query("SELECT b FROM Bus b JOIN FETCH b.busType WHERE b.id IN :ids")
    List<Bus> findAllByIdWithBusType(@Param("ids") Collection<Long> ids);
}