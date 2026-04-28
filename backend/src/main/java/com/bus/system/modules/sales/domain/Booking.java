package com.bus.system.modules.sales.domain;

import com.bus.system.modules.sales.domain.enums.BookingStatus;
import com.bus.system.modules.identity.domain.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Đơn đặt chỗ (Booking)
 * Một booking có thể có nhiều tickets (vé ghế)
 */
@Entity
@Table(name = "booking")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Người đặt (nếu có tài khoản)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // Khách vãng lai (không đăng ký)
    @Column(name = "guest_name", length = 100)
    private String guestName;

    @Column(name = "guest_phone", length = 20)
    private String guestPhone;

    @Column(name = "guest_email", length = 100)
    private String guestEmail;

    // Nhân viên xác nhận thanh toán (NULL = auto-confirm qua payment gateway)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_by_id")
    private User confirmedBy;

    // Mã đặt chỗ (PNR) - UNIQUE
    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    // Tổng tiền
    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    // Kênh bán (COUNTER, WEB, APP, ON_BUS)
    @Column(name = "channel", length = 20)
    private String channel = "WEB";

    // Phương thức thanh toán
    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    // Trạng thái đơn
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private BookingStatus status = BookingStatus.PENDING;

    // Thời gian hết hạn giữ chỗ (booking sẽ tự hủy sau thời gian này)
    @Column(name = "expired_at", nullable = false)
    private LocalDateTime expiredAt;

    // Danh sách vé
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Ticket> tickets = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Optimistic Locking - chống update đồng thời
    @Version
    @Column(name = "version")
    private Long version;

    // Helper methods
    public void addTicket(Ticket ticket) {
        tickets.add(ticket);
        ticket.setBooking(this);
    }

    public void removeTicket(Ticket ticket) {
        tickets.remove(ticket);
        ticket.setBooking(null);
    }

    public boolean isPending() {
        return this.status == BookingStatus.PENDING;
    }

    public boolean isConfirmed() {
        return this.status == BookingStatus.CONFIRMED;
    }

    public boolean isCancelled() {
        return this.status == BookingStatus.CANCELLED;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiredAt);
    }
}
