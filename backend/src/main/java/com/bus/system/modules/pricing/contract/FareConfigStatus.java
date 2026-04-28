package com.bus.system.modules.pricing.contract;

/**
 * Trạng thái Cấu hình giá vé (FareConfig)
 */
public enum FareConfigStatus {
    DRAFT, // Nháp, chưa duyệt
    ACTIVE, // Đang áp dụng
    EXPIRED, // Hết hiệu lực
    CANCELLED // Đã hủy
}
