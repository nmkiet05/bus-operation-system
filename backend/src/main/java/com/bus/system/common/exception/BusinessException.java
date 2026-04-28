package com.bus.system.common.exception;

import lombok.Getter;
import lombok.NonNull;
import org.springframework.http.HttpStatus;

@Getter
public class BusinessException extends RuntimeException {
    @NonNull
    private final HttpStatus status;
    private final String message;
    private String errorCode;

    // Mặc định là lỗi 400 (Bad Request)
    public BusinessException(String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
        this.message = message;
    }

    // Constructor với Error Code
    public BusinessException(String errorCode, String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
        this.errorCode = errorCode;
        this.message = message;
    }

    // Nếu muốn tùy chỉnh mã lỗi (ví dụ 409 Conflict)
    public BusinessException(@NonNull HttpStatus status, String message) {
        super(message);
        this.status = status;
        this.message = message;
    }
}