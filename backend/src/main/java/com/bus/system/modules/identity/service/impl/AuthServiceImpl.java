package com.bus.system.modules.identity.service.impl;

import com.bus.system.modules.identity.contract.UserRole;
import com.bus.system.common.exception.BusinessException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.identity.contract.UserStatus;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.identity.domain.UserDevice;
import com.bus.system.modules.identity.dto.request.FcmTokenRequest;
import com.bus.system.modules.identity.dto.request.LoginRequest;
import com.bus.system.modules.identity.dto.request.SignupRequest;
import com.bus.system.modules.identity.dto.response.JwtResponse;
import com.bus.system.modules.identity.repository.UserDeviceRepository;
import com.bus.system.modules.identity.repository.UserRepository;
import com.bus.system.modules.identity.mapper.AuthMapper;
import com.bus.system.modules.identity.mapper.UserMapper;
import com.bus.system.modules.identity.security.JwtUtils;
import com.bus.system.modules.identity.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;
    private final UserDeviceRepository userDeviceRepository;
    private final UserMapper userMapper;
    private final AuthMapper authMapper;

    @Override
    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        // 1. Xác thực username/password
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        // 2. Lưu thông tin vào Context
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 3. Lấy thông tin User đã xác thực (User implements UserDetails now)
        User user = (User) authentication.getPrincipal();

        // 4. Sinh JWT Token
        String jwt = jwtUtils.generateJwtToken(user);

        // 5. Trả về kết quả (refreshToken sẽ xử lý sau)
        return authMapper.toJwtResponse(jwt, null, user);
    }

    /**
     * Đăng ký Khách hàng (Public Self-Service)
     * LUÔN gán Role = CUSTOMER (bỏ qua role trong request để tránh privilege
     * escalation)
     */
    @Override
    @Transactional
    public User registerUser(SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            throw new BusinessException("Lỗi: Username đã tồn tại!");
        }

        // Tạo User mới
        User user = userMapper.toEntity(signUpRequest);
        user.setPassword(encoder.encode(signUpRequest.getPassword())); // Mã hóa pass

        // FORCE Role = CUSTOMER (BỎ QUA request.getRole() để security)
        user.getRoles().add(UserRole.CUSTOMER);
        user.setStatus(UserStatus.ACTIVE);

        return Objects.requireNonNull(userRepository.save(user));
    }

    @Override
    @Transactional
    public void saveFcmToken(Long userId, FcmTokenRequest request) {
        // 1. Tìm user
        User user = userRepository.findById(Objects.requireNonNull(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // 2. Kiểm tra tồn tại của token
        UserDevice device = userDeviceRepository.findByFcmToken(request.getFcmToken())
                .orElse(new UserDevice());

        // 3. Cập nhật thông tin
        authMapper.updateUserDevice(device, user, request);

        // 4. Lưu xuống DB
        userDeviceRepository.save(device);
    }

    /**
     * Tìm User theo username (dùng cho sudo verification)
     */
    public User findByUsername(String username) {
        return userRepository.findByUsername(Objects.requireNonNull(username))
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    }

    /**
     * Verify password (dùng cho sudo mechanism)
     * 
     * @param rawPassword     Password người dùng nhập (plaintext)
     * @param encodedPassword Password đã hash trong DB
     * @return true nếu match
     */
    public boolean verifyPassword(String rawPassword, String encodedPassword) {
        return encoder.matches(rawPassword, encodedPassword);
    }

}
