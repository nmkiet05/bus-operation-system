package com.bus.system.modules.sales.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Lịch sử thanh toán
 * Lưu trữ thông tin giao dịch thanh toán qua các cổng (VNPAY, MOMO...)
 */
@Entity
@Table(name = "payment_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Thuộc booking nào
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    // Số tiền thanh toán
    @Column(name = "amount", precision = 15, scale = 2)
    private BigDecimal amount;

    // Trạng thái giao dịch (SUCCESS, FAILED, PENDING)
    @Column(name = "status", length = 20)
    private String status;

    // Mã giao dịch ngân hàng/Ví
    @Column(name = "transaction_code", length = 100)
    private String transactionCode;

    // Cổng thanh toán (VNPAY, MOMO, CASH...)
    @Column(name = "provider", length = 50)
    private String provider;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
