package com.bus.system.modules.identity.controller;

import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.identity.domain.RefreshToken;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.identity.dto.request.FcmTokenRequest;
import com.bus.system.modules.identity.dto.request.LoginRequest;
import com.bus.system.modules.identity.dto.request.SignupRequest;
import com.bus.system.modules.identity.dto.request.TokenRefreshRequest;
import com.bus.system.modules.identity.dto.response.JwtResponse;
import com.bus.system.modules.identity.mapper.UserMapper;
import com.bus.system.modules.identity.security.JwtUtils;
import com.bus.system.modules.identity.service.AuthService;
import com.bus.system.modules.identity.service.RefreshTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth - Xác thực", description = "Đăng nhập, Đăng ký, FCM Token, Refresh Token")
public class AuthController {

        private final AuthService authService;
        private final RefreshTokenService refreshTokenService;
        private final JwtUtils jwtUtils;
        private final UserMapper userMapper;

        // API 1: Đăng nhập - Trả về 200 OK (không phải tạo mới resource)
        @PostMapping("/login")
        @Operation(summary = "Đăng nhập", description = "Xác thực user và trả về JWT Token + Refresh Token")
        public ResponseEntity<ApiResponse<JwtResponse>> authenticateUser(
                        @Valid @RequestBody LoginRequest loginRequest) {
                JwtResponse jwtResponse = authService.authenticateUser(loginRequest);

                // Tạo Refresh Token
                User user = (User) SecurityContextHolder
                                .getContext().getAuthentication().getPrincipal();
                RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
                jwtResponse.setRefreshToken(refreshToken.getToken());

                return ResponseEntity.ok(ApiResponse.success(jwtResponse, "Đăng nhập thành công!"));
        }

        // API: Lấy profile đầy đủ của user hiện tại (dùng cho form tự động điền)
        @GetMapping("/me")
        @Operation(summary = "Lấy profile hiện tại", description = "Trả về thông tin đầy đủ của user đang đăng nhập (phone, fullName, email...)")
        public ResponseEntity<ApiResponse<JwtResponse>> getCurrentProfile(@AuthenticationPrincipal User currentUser) {
                String token = jwtUtils.generateTokenFromUsername(currentUser.getUsername());
                JwtResponse profile = userMapper.toJwtResponse(currentUser, token, "");
                return ResponseEntity.ok(ApiResponse.success(profile, "Lấy profile thành công"));
        }

        // API 2: Đăng ký - Trả về 201 Created (tạo User mới)
        @PostMapping("/register")
        @Operation(summary = "Đăng ký tài khoản", description = "Tạo tài khoản mới cho hệ thống")
        public ResponseEntity<ApiResponse<User>> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
                authService.registerUser(signUpRequest);
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ApiResponse.success(null, "Đăng ký thành công!"));
        }

        // API 3: Lưu FCM Token - Trả về 200 OK (cập nhật, không phải tạo mới)
        @PostMapping("/fcm-token")
        @Operation(summary = "Lưu FCM Token", description = "Dùng cho Mobile App gửi token để nhận thông báo")
        public ResponseEntity<ApiResponse<Void>> saveFcmToken(
                        @Valid @RequestBody FcmTokenRequest request,
                        @AuthenticationPrincipal User currentUser) {
                authService.saveFcmToken(currentUser.getId(), request);
                return ResponseEntity.ok(ApiResponse.success(null, "Lưu token thành công"));
        }

        // API 4: Refresh Token - Token Rotation
        @PostMapping("/refresh-token")
        @Operation(summary = "Refresh Token", description = "Dùng refresh token để lấy access token mới (token rotation)")
        public ResponseEntity<ApiResponse<JwtResponse>> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
                RefreshToken existingToken = refreshTokenService.findByToken(request.getRefreshToken())
                                .orElseThrow(() -> new BusinessException("Refresh token không tồn tại"));

                // Verify token còn hợp lệ
                refreshTokenService.verifyExpiration(existingToken);

                // Revoke token cũ
                refreshTokenService.revokeToken(existingToken);

                // Tạo token mới (delegate mapping cho UserMapper)
                User user = existingToken.getUser();
                String newAccessToken = jwtUtils.generateTokenFromUsername(user.getUsername());
                RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user.getId());

                JwtResponse response = userMapper.toJwtResponse(user, newAccessToken, newRefreshToken.getToken());

                return ResponseEntity.ok(ApiResponse.success(response, "Token đã được làm mới"));
        }
}
