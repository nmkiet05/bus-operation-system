package com.bus.system.modules.planning.contract;

/**
 * Trạng thái đăng ký khai thác tuyến.
 */
public enum RegistrationStatus {
    ACTIVE, // Đang khai thác
    EXPIRED, // Hết hạn phù hiệu
    REVOKED // Thu hồi (xe hỏng, bán, vi phạm...)
}
