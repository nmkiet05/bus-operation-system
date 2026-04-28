package com.bus.system.modules.identity.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Set;

/**
 * DTO cho Admin tạo User mới (Nhân viên)
 * Khác với SignupRequest: Roles là BẮT BUỘC và được Admin chỉ định
 */
@Data
public class CreateUserRequest {
    @NotBlank(message = "Username không được để trống")
    @Size(min = 3, max = 20, message = "Username phải từ 3-20 ký tự")
    private String username;

    @NotBlank(message = "Password không được để trống")
    @Size(min = 6, max = 40, message = "Password phải từ 6-40 ký tự")
    private String password;

    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    @Email(message = "Email không hợp lệ")
    private String email;

    private String phone;

    /**
     * Roles BẮT BUỘC - Admin phải chỉ định (có thể gán nhiều role)
     */
    @NotEmpty(message = "Roles không được để trống")
    private Set<String> roles;

    /**
     * Password xác thực (Sudo mechanism)
     * BẮT BUỘC khi tạo user có role ADMIN
     * Dùng để xác thực quyền "sudo" của admin hiện tại
     */
    private String sudoPassword;
}
