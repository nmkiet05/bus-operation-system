package com.bus.system.modules.planning.domain;

import com.bus.system.modules.planning.contract.RouteStatus;
import com.bus.system.common.persistence.BaseSoftDeleteEntity;
import com.bus.system.modules.catalog.domain.BusStation;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "route")
@Getter
@Setter
public class Route extends BaseSoftDeleteEntity {

    @Column(name = "code", unique = true, length = 50)
    private String code;

    @Column(name = "name")
    private String name;

    // [FIX DB MATCHING] DB là INTEGER (SERIAL) -> Java dùng Long
    @Column(name = "departure_station_id")
    private Long departureStationId;

    // [FIX DB MATCHING] DB là INTEGER (SERIAL) -> Java dùng Long
    @Column(name = "arrival_station_id")
    private Long arrivalStationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "departure_station_id", insertable = false, updatable = false)
    private BusStation departureStation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "arrival_station_id", insertable = false, updatable = false)
    private BusStation arrivalStation;

    @Column(name = "distance", precision = 10, scale = 2)
    private BigDecimal distance;

    @Column(name = "duration_hours", precision = 4, scale = 1)
    private BigDecimal durationHours;

    @Column(name = "itinerary_detail", columnDefinition = "TEXT")
    private String itineraryDetail;

    @Column(name = "hotline", length = 20)
    private String hotline;

    // [FIX DB MATCHING] DB là BIGINT (BIGSERIAL) -> Java dùng Long
    @Column(name = "default_refund_policy_id")
    private Long defaultRefundPolicyId;

    @Column(name = "status", length = 20)
    private String status;

    public boolean isActive() {
        return RouteStatus.ACTIVE.name().equalsIgnoreCase(this.status) && !isDeleted();
    }

    // [NEW] Quan hệ ngược để lấy danh sách lịch chạy (TripSchedule)
    // Giúp query: "Tuyến này có những khung giờ chạy nào?"
    @OneToMany(mappedBy = "route", fetch = FetchType.LAZY)
    private List<TripSchedule> tripSchedules = new ArrayList<>();
}