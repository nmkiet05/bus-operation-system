package com.bus.system.modules.identity.domain;

import com.bus.system.common.persistence.BaseSoftDeleteEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_devices")
@Getter
@Setter
public class UserDevice extends BaseSoftDeleteEntity {

    @Column(name = "fcm_token", nullable = false, length = 500)
    private String fcmToken;

    @Column(name = "device_type", length = 20)
    private String deviceType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;
}
