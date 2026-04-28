package com.bus.system.modules.pricing.repository;

import com.bus.system.modules.pricing.domain.FarePolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FarePolicyRepository extends JpaRepository<FarePolicy, Long> {

    // Dùng để validate khi tạo mới: Không cho phép trùng Mã chính sách
    boolean existsByCode(String code);

    // Dùng cho Validate khi Update (trùng code nhưng khác ID)
    boolean existsByCodeAndIdNot(String code, Long id);
}