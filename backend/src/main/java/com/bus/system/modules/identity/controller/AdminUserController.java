package com.bus.system.modules.identity.controller;

import com.bus.system.modules.identity.contract.UserRole;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.identity.dto.request.CreateUserRequest;
import com.bus.system.modules.identity.dto.response.UserResponse;
import com.bus.system.modules.identity.mapper.UserMapper;
import com.bus.system.modules.identity.service.AuthService;
import com.bus.system.modules.identity.service.UserManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Controller cho Admin quản lý User (Nhân viên)
 * Endpoint: /api/admin/users
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@Slf4j
public class AdminUserController {

    private final AuthService authService; // Vẫn cần cho verifyPassword
    private final UserManagementService userManagementService;
    private final UserMapper userMapper;

    /**
     * API cho Admin tạo User mới (Nhân viên)
     * POST /api/admin/users
     * 
     * **Sudo Mechanism (giống Linux):**
     * - Tạo STAFF/DRIVER/ATTENDANT/CUSTOMER: Không cần xác thực
     * - Tạo ADMIN: Yêu cầu CONFIRM PASSWORD của admin hiện tại (sudo)
     * 
     * @param request CreateUserRequest với role bắt buộc
     * @return User được tạo
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody CreateUserRequest request) {
        log.info("Request tạo user mới: {}, roles: {}", request.getUsername(), request.getRoles());

        // Sudo mechanism: Nếu tạo ADMIN → yêu cầu xác thực password
        if (request.getRoles().stream().anyMatch(r -> UserRole.ADMIN.name().equalsIgnoreCase(r))) {
            // Lấy thông tin admin hiện tại
            Authentication authentication = SecurityContextHolder
                    .getContext().getAuthentication();

            String currentUsername = authentication.getName();

            // Kiểm tra sudoPassword có được gửi lên không
            if (request.getSudoPassword() == null || request.getSudoPassword().isEmpty()) {
                log.warn("Admin {} cố tạo ADMIN nhưng không cung cấp sudo password", currentUsername);
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error(400, "Tạo tài khoản ADMIN yêu cầu xác thực password (sudoPassword)"));
            }

            // Verify password của admin hiện tại
            User currentAdmin = authService.findByUsername(currentUsername);

            boolean passwordMatch = authService.verifyPassword(
                    request.getSudoPassword(),
                    currentAdmin.getPassword());

            if (!passwordMatch) {
                log.warn("Admin {} nhập sai sudo password khi tạo ADMIN", currentUsername);
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error(401, "Sudo password không chính xác"));
            }

            log.info("✓ Admin {} đã xác thực sudo thành công", currentUsername);
        }

        // Sử dụng UserManagementService để tạo user
        User createdUser = userManagementService.createEmployee(request);
        UserResponse response = userMapper.toResponse(createdUser);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo user thành công"));
    }
}
