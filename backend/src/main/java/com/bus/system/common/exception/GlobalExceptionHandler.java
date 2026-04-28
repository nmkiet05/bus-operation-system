package com.bus.system.common.exception;

import com.bus.system.common.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException; // <--- Import mới
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // 1. Bắt lỗi tìm không thấy (404)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), ex.getMessage()));
    }

    // 2. Bắt lỗi logic nghiệp vụ (400)
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Object>> handleBusinessException(BusinessException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(ApiResponse.error(ex.getStatus().value(), ex.getMessage()));
    }

    // 3. Bắt lỗi Validate (khi @Valid fail)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        String firstError = errors.values().stream().findFirst().orElse("Lỗi dữ liệu đầu vào");
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), firstError));
    }

    // 4. [MỚI] Bắt lỗi JSON sai định dạng (Ví dụ: Gửi text vào chỗ số, thiếu dấu
    // ngoặc...)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Object>> handleJsonError(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(400, "Dữ liệu JSON gửi lên bị lỗi cú pháp hoặc sai định dạng."));
    }

    // 5. Bắt lỗi sai Method (VD: Gọi PUT vào link chỉ có GET)
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ApiResponse.error(
                        HttpStatus.METHOD_NOT_ALLOWED.value(),
                        "Phương thức " + ex.getMethod()
                                + " không được hỗ trợ. Vui lòng kiểm tra lại URL hoặc Method."));
    }

    // 6. Bắt lỗi Optimistic Lock (trùng version — 2 người cùng sửa 1 bản ghi)
    @ExceptionHandler({ObjectOptimisticLockingFailureException.class, OptimisticLockingFailureException.class})
    public ResponseEntity<ApiResponse<Object>> handleOptimisticLock(Exception ex) {
        log.warn("Optimistic lock conflict: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(409,
                        "Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang và thử lại."));
    }

    // 7. Bắt lỗi Database (Trùng lặp dữ liệu, khóa ngoại...)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.error("Data integrity violation", ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error(400, "Xung đột dữ liệu hoặc dữ liệu đã tồn tại."));
    }

    // 7. Bắt lỗi đăng nhập sai (Security)
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(401, "Tài khoản hoặc mật khẩu không chính xác!"));
    }

    // 8. Bắt lỗi không đủ quyền (403)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(403, "Bạn không có quyền truy cập vào tài nguyên này"));
    }

    // 9. Bắt tất cả các lỗi lạ khác (500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGlobalException(Exception ex) {
        log.error("Unhandled error", ex);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error(500, "Hệ thống đang bận. Vui lòng thử lại sau."));
    }
}