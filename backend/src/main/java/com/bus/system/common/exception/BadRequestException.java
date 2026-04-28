package com.bus.system.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception cho các request không hợp lệ từ client (400 Bad Request)
 * Ví dụ: validation fails, business rule violation
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class BadRequestException extends BusinessException {

    public BadRequestException(String message) {
        super(message);
    }
}
