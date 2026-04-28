package com.bus.system.modules.operation.domain;

import com.bus.system.modules.identity.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * [LUẬT GTĐB 2008 - Điều 65]
 * Nhật ký lái xe chi tiết để chứng minh:
 * - Không lái liên tục quá 4 giờ.
 * - Không lái quá 10 giờ/ngày.
 */
@Entity
@Table(name = "driver_trip_log")
@Getter
@Setter
public class DriverTripLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private User driver;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes; // Tự động tính khi endTime được cập nhật

    @Column(name = "start_location_gps")
    private String startLocationGps;

    @Column(name = "end_location_gps")
    private String endLocationGps;

    @Column(name = "is_night_driving")
    private Boolean isNightDriving; // Cờ đánh dấu lái đêm (22h-6h) để tính phụ cấp nếu cần
}
