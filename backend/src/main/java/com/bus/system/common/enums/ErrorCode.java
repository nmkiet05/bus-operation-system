package com.bus.system.common.enums;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    // 1. Nhóm lỗi chung
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống chưa được định nghĩa", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Sai key message rồi bạn ơi", HttpStatus.BAD_REQUEST),

    // 2. Nhóm lỗi Xe (Fleet)
    BUS_TYPE_EXISTED(2001, "Loại xe này đã tồn tại", HttpStatus.BAD_REQUEST),
    BUS_NOT_FOUND(2002, "Không tìm thấy xe", HttpStatus.NOT_FOUND),

    // 3. Nhóm lỗi Vé (Booking) - Sau này thêm tiếp
    ;

    private final int code;
    private final String message;
    private final HttpStatus statusCode;

    ErrorCode(int code, String message, HttpStatus statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}