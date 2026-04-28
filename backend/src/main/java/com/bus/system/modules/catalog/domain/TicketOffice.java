package com.bus.system.modules.catalog.domain;

import com.bus.system.common.persistence.BaseSoftDeleteEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "ticket_office")
@Getter
@Setter
public class TicketOffice extends BaseSoftDeleteEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id") // Nullable for independent agents
    private BusStation station;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "location_detail", columnDefinition = "TEXT")
    private String locationDetail;

    @Column(length = 20)
    private String phone;

    @Column(length = 20)
    private String status; // 'ACTIVE', 'INACTIVE'
}
