package com.bus.system.modules.catalog.service;

import com.bus.system.modules.catalog.dto.request.ProvinceRequest;
import com.bus.system.modules.catalog.dto.response.ProvinceResponse;

import java.util.List;

/**
 * Province Service
 * 
 * Thiết kế theo nguyên tắc:
 * - CREATE: ✅ Cho phép khi nhà nước chia tách/sáp nhập/đổi tên tỉnh
 * - READ: ✅ Public API cho dropdown
 * - UPDATE: ❌ Không cho phép. Tạo bản ghi mới để giữ lịch sử.
 * - DELETE: ❌ Soft delete để giữ tham chiếu dữ liệu lịch sử.
 */
public interface ProvinceService {

    /**
     * Tạo tỉnh mới.
     * Dùng khi nhà nước chia tách/sáp nhập/đổi tên tỉnh.
     * Bản ghi cũ vẫn giữ nguyên để tham chiếu dữ liệu lịch sử.
     */
    ProvinceResponse createProvince(ProvinceRequest request);

    /**
     * Lấy danh sách tất cả tỉnh thành đang ACTIVE.
     * Dùng cho dropdown chọn địa điểm.
     */
    List<ProvinceResponse> getAllProvinces();

    /**
     * Soft delete: Đánh dấu tỉnh không còn tồn tại (do sáp nhập/chia tách).
     * Dữ liệu lịch sử liên quan vẫn được giữ nguyên.
     */
    void deactivateProvince(Long id);
}