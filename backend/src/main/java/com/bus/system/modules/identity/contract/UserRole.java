package com.bus.system.modules.identity.contract;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

public enum UserRole {
    ADMIN, // Quản trị viên - Có quyền sudo (tạo ADMIN bằng password confirmation)
    MANAGER, // Quản lý - Vận hành nghiệp vụ, không can thiệp hệ thống (IT)
    STAFF, // Nhân viên
    DRIVER, // Tài xế
    ATTENDANT, // Phụ xe
    CUSTOMER; // Khách hàng

    public SimpleGrantedAuthority getAuthority() {
        return new SimpleGrantedAuthority("ROLE_" + this.name());
    }

    /** Precomputed lookup map — build 1 lần khi JVM load, O(1) mỗi lần tra cứu */
    private static final Map<String, UserRole> LOOKUP = Arrays.stream(values())
            .collect(Collectors.toMap(
                    role -> role.name().toUpperCase(),
                    Function.identity()));

    /**
     * Parse string → UserRole (case-insensitive).
     * Dùng HashMap lookup thay vì try/catch — không tạo Exception, không GC
     * pressure.
     */
    public static Optional<UserRole> fromString(String value) {
        if (value == null)
            return Optional.empty();
        return Optional.ofNullable(LOOKUP.get(value.toUpperCase()));
    }

    /**
     * Convert Set\<UserRole\> → Set\<String\>
     */
    public static Set<String> toStrings(Set<UserRole> roles) {
        return roles.stream()
                .map(Enum::name)
                .collect(Collectors.toSet());
    }
}
