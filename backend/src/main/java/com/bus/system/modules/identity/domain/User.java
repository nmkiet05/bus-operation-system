package com.bus.system.modules.identity.domain;

import com.bus.system.modules.hr.domain.DriverDetail;
import com.bus.system.modules.identity.contract.UserRole;
import com.bus.system.modules.identity.contract.UserStatus;
import com.bus.system.common.persistence.BaseSoftDeleteEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

import org.springframework.security.core.GrantedAuthority;

import org.springframework.security.core.userdetails.UserDetails;

import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User extends BaseSoftDeleteEntity implements UserDetails {

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(unique = true, length = 100)
    private String email;

    @Column(unique = true, length = 20)
    private String phone;

    /**
     * Mã nhân viên công khai — UNIQUE toàn hệ thống, không phân biệt role.
     * Tài xế, nhân viên, admin dùng chung không gian mã này.
     * Nullable cho khách hàng (customer) hoặc tài khoản chưa có mã.
     */
    @Column(name = "employee_code", unique = true, length = 20)
    private String employeeCode;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    @Enumerated(EnumType.STRING)
    @BatchSize(size = 50)
    private Set<UserRole> roles = new HashSet<>();

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private UserStatus status = UserStatus.ACTIVE;

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("user")
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private DriverDetail driverDetail;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(UserRole::getAuthority)
                .collect(Collectors.toList());
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return UserStatus.ACTIVE.equals(this.status) && !isDeleted();
    }

    public boolean isActive() {
        return isEnabled();
    }

    public boolean hasRole(UserRole role) {
        return roles.contains(role);
    }

    public boolean hasAnyRole(UserRole... checkRoles) {
        return Arrays.stream(checkRoles).anyMatch(roles::contains);
    }
}
