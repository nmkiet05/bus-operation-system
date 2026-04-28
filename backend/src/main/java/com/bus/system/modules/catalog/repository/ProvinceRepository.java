package com.bus.system.modules.catalog.repository;

import com.bus.system.modules.catalog.domain.Province;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProvinceRepository extends JpaRepository<Province, Long> {
    // Tìm kiếm theo mã tỉnh GSO (để check trùng)
    boolean existsByGovCode(String govCode);
}