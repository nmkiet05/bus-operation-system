package com.bus.system.modules.planning.domain;

import com.bus.system.common.persistence.BaseEntity;
import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.planning.contract.RegistrationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Đăng ký khai thác tuyến (Route Bus Registration).
 *
 * Theo NĐ 10/2020, NĐ 158/2024: xe phải có phù hiệu tuyến cố định
 * và nằm trong danh sách phương tiện đã đăng ký với Sở GTVT.
 *
 * Thiết kế lưu lịch sử: không xóa bản ghi.
 * - Thu hồi → status = REVOKED + revokedAt + revokeReason
 * - Đăng ký lại → tạo bản ghi mới (bản cũ REVOKED vẫn còn)
 * - Partial unique index: chỉ 1 ACTIVE per (route, bus)
 */
@Entity
@Table(name = "route_bus_registration")
@Getter
@Setter
public class RouteRegistration extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    private Route route;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_id", nullable = false)
    private Bus bus;

    @Column(name = "badge_number", length = 50)
    private String badgeNumber;

    @Column(name = "registered_at", nullable = false)
    private LocalDate registeredAt;

    @Column(name = "expired_at")
    private LocalDate expiredAt;

    @Column(name = "revoked_at")
    private LocalDate revokedAt;

    @Column(name = "revoke_reason", columnDefinition = "TEXT")
    private String revokeReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private RegistrationStatus status;

    // ==================== DOMAIN METHODS ====================

    public boolean isActive() {
        return status == RegistrationStatus.ACTIVE
                && (expiredAt == null || !expiredAt.isBefore(LocalDate.now()));
    }

    /**
     * Thu hồi đăng ký. Ghi lại lý do và ngày thu hồi.
     */
    public void revoke(String reason) {
        this.status = RegistrationStatus.REVOKED;
        this.revokedAt = LocalDate.now();
        this.revokeReason = reason;
    }

    /**
     * Đánh dấu hết hạn.
     */
    public void expire() {
        this.status = RegistrationStatus.EXPIRED;
    }

    // ==================== FACTORY ====================

    public static RouteRegistration create(Route route, Bus bus, String badgeNumber, LocalDate expiredAt) {
        RouteRegistration reg = new RouteRegistration();
        reg.setRoute(route);
        reg.setBus(bus);
        reg.setBadgeNumber(badgeNumber);
        reg.setRegisteredAt(LocalDate.now());
        reg.setExpiredAt(expiredAt);
        reg.setStatus(RegistrationStatus.ACTIVE);
        return reg;
    }
}
