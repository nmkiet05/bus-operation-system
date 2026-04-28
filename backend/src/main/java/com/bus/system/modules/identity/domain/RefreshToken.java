package com.bus.system.modules.identity.domain;

import com.bus.system.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
public class RefreshToken extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(name = "expiry_date", nullable = false)
    private Instant expiryDate;

    @Column(nullable = false)
    private Boolean revoked = false;

    public boolean isExpired() {
        return expiryDate.isBefore(Instant.now());
    }

    public boolean isUsable() {
        return !isExpired() && !revoked;
    }

    public void revoke() {
        this.revoked = true;
    }
}
