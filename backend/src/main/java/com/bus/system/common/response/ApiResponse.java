package com.bus.system.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // Quan trọng: Nếu data null thì không hiện field data
public class ApiResponse<T> {

    private int code; // Business Code (VD: 1000 - Thành công, 9999 - Lỗi không xác định)
    private String message;
    private T result; // Dùng từ 'result' hoặc 'data' đều được
    private long timestamp;

    // --- Các hàm tạo nhanh (Factory Methods) ---

    // 1. Thành công - Có dữ liệu
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .code(1000) // Quy ước 1000 là thành công
                .message("Success")
                .result(data)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    // 2. Thành công - Có dữ liệu & Message tùy chỉnh (Data luôn đứng trước)
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .code(1000)
                .message(message)
                .result(data)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    // 3. Thành công - Không có dữ liệu (Chỉ thông báo)
    public static ApiResponse<Void> success(String message) {
        return ApiResponse.<Void>builder()
                .code(1000)
                .message(message)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    // 4. Lỗi (Dùng cho Exception Handler)
    public static <T> ApiResponse<T> error(int code, String message) {
        return ApiResponse.<T>builder()
                .code(code)
                .message(message)
                .timestamp(System.currentTimeMillis())
                .build();
    }
}