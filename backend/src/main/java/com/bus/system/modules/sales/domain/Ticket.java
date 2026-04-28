package com.bus.system.modules.sales.domain;

import com.bus.system.modules.sales.domain.enums.TicketStatus;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.planning.domain.PickupPoint;
import com.bus.system.modules.pricing.domain.FareConfig;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Vé xe chi tiết (Ticket)
 * Mỗi ghế trên một chuyến là một vé
 */
@Entity
@Table(name = "ticket")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {

    // Business Constants
    public static final BigDecimal DEFAULT_VAT_RATE = new BigDecimal("0.08"); // VAT 8%

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Thuộc đơn hàng nào
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    // Cho chuyến xe nào
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    // Áp dụng cấu hình giá nào
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fare_config_id")
    private FareConfig fareConfig;

    // Điểm đón khách (NULL = đón tại bến)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pickup_point_id")
    private PickupPoint pickupPoint;

    // Điểm trả khách (NULL = trả tại bến)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dropoff_point_id")
    private PickupPoint dropoffPoint;

    // Số ghế/giường
    @Column(name = "seat_number", nullable = false, length = 10)
    private String seatNumber;

    // Giá bán thực tế
    @Column(name = "price", nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    // Thuế GTGT (mặc định 8%)
    @Column(name = "vat_rate", precision = 4, scale = 2)
    private BigDecimal vatRate = DEFAULT_VAT_RATE;

    // Đã lên xe chưa
    @Column(name = "is_checked_in")
    private Boolean isCheckedIn = false;

    // Tên hành khách thực tế ngồi ghế này (từ Step 3)
    @Column(name = "passenger_name", length = 100)
    private String passengerName;

    // SĐT hành khách thực tế ngồi ghế này
    @Column(name = "passenger_phone", length = 20)
    private String passengerPhone;

    // Trạng thái vé
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private TicketStatus status = TicketStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Optimistic Locking
    @Version
    @Column(name = "version")
    private Long version;

    // Helper methods
    public boolean isActive() {
        return this.status == TicketStatus.ACTIVE;
    }

    public boolean isConfirmed() {
        return this.status == TicketStatus.CONFIRMED;
    }

    public boolean isCancelled() {
        return this.status == TicketStatus.CANCELLED;
    }

    public boolean isCheckedIn() {
        return this.isCheckedIn != null && this.isCheckedIn;
    }

    public BigDecimal getTotalWithVat() {
        BigDecimal vat = price.multiply(vatRate);
        return price.add(vat);
    }
}
