package com.bus.system.modules.operation.domain.enums;

/**
 * Trạng thái truyền dữ liệu lên cơ quan nhà nước (GovDataTransmission)
 */
public enum GovTransmissionStatus {
    PENDING, // Đang chờ gửi
    SENT, // Đã gửi
    SUCCESS, // Gửi thành công
    FAILED, // Gửi thất bại
    RETRY // Đang thử lại
}
