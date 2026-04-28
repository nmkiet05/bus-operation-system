package com.bus.system.modules.hr.domain;

import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.hr.domain.enums.JobTitle;
import com.bus.system.modules.catalog.domain.BusStation;
import com.bus.system.modules.catalog.domain.TicketOffice;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "staff_detail")
@Getter
@Setter
public class StaffDetail {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "employee_code", nullable = false, unique = true, length = 20)
    private String employeeCode;

    @Column(name = "department_id")
    private Long departmentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_title", nullable = false, length = 50)
    private JobTitle jobTitle;

    // Biên chế làm việc tại Bến xe
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id")
    private BusStation station;

    // Biên chế làm việc tại Văn phòng vé (Dành cho Sales)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_office_id")
    private TicketOffice assignedOffice;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attributes", columnDefinition = "jsonb")
    private java.util.Map<String, Object> attributes;
}
