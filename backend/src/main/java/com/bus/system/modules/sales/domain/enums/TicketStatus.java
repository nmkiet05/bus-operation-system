package com.bus.system.modules.sales.domain.enums;

/**
 * Trạng thái vé xe khách
 */
public enum TicketStatus {
    ACTIVE, // Vé mới tạo (mặc định)
    PENDING, // Đang giữ ghế (chờ thanh toán)
    CONFIRMED, // Đã xác nhận (đã thanh toán)
    CHECKED_IN, // Đã lên xe (quét QR thành công)
    CANCELLED, // Đã hủy (trước khi lên xe)
    REFUNDED, // Đã hoàn tiền
    NO_SHOW, // Không có mặt (vắng không lên xe)
    EXPIRED // Hết hạn (không thanh toán trong thời gian quy định)
}
