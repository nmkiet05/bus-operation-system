package com.bus.system.modules.identity.service;

import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.identity.dto.request.CreateUserRequest;

/**
 * Service quản lý User dành cho Admin
 * Tách biệt với AuthService (chuyên về xác thực)
 */
public interface UserManagementService {

    /**
     * Tạo nhân viên mới (Admin managed)
     * 
     * @param request Thông tin tạo user
     * @return User đã tạo
     */
    User createEmployee(CreateUserRequest request);
}
