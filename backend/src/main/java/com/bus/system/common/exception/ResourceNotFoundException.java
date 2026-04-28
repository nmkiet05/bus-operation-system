package com.bus.system.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

    // Ví dụ: new ResourceNotFoundException("User", "id", 1);
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s không tồn tại với %s: '%s'", resourceName, fieldName, fieldValue));
    }

    // Ví dụ: new ResourceNotFoundException("Không tìm thấy chuyến xe này");
    public ResourceNotFoundException(String message) {
        super(message);
    }
}