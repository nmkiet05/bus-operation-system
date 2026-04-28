package com.bus.system.modules.operation.domain;

import com.bus.system.common.persistence.BaseSoftDeleteEntity;
import com.bus.system.modules.planning.domain.Route;
import com.bus.system.modules.planning.domain.TripSchedule;
import com.bus.system.common.exception.BusinessException;
import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.identity.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import com.bus.system.common.utils.CodeGeneratorUtils;
import lombok.Getter;
import lombok.Setter;

import com.bus.system.modules.operation.domain.enums.CrewRole;
import com.bus.system.modules.operation.domain.enums.DriverAssignmentStatus;
import com.bus.system.modules.operation.domain.enums.TripStatus;
import com.bus.system.modules.operation.domain.enums.TripType;
import com.querydsl.core.annotations.QueryInit;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Entity
@Table(name = "trip")
@Getter
@Setter
public class Trip extends BaseSoftDeleteEntity {

    @Column(name = "code", unique = true)
    private String code;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_schedule_id")
    @QueryInit({ "route.departureStation.province", "route.arrivalStation.province" })
    private TripSchedule tripSchedule;

    @Column(name = "bus_id")
    private Long busId;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_id", insertable = false, updatable = false)
    private Bus bus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_assignment_id")
    private BusAssignment busAssignment; // NOT NULL khi status >= APPROVED

    // [Phase 3] Crew — ai phục vụ chuyến này (trực tiếp, không qua BusAssignment)
    @OneToMany(mappedBy = "trip")
    private List<DriverAssignment> crew = new ArrayList<>();

    // [REMOVED Phase 2] mainDriverId → Tài xế giờ quản lý qua
    // busAssignment.driverAssignments

    @Column(name = "departure_date", nullable = false)
    private LocalDate departureDate;

    @Column(name = "actual_departure_time")
    private LocalTime actualDepartureTime;

    @Column(name = "arrival_time")
    private LocalDateTime arrivalTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "trip_type", length = 20)
    private TripType tripType; // MAIN, REINFORCEMENT

    @Column(name = "electronic_transport_order_code", unique = true, length = 100)
    private String electronicTransportOrderCode;

    /**
     * Factory method để tạo Trip mới (Encapsulation logic khởi tạo).
     */
    public static Trip create(TripSchedule schedule, LocalDate departureDate, LocalTime actualDepartureTime,
            TripType tripType) {
        Trip trip = new Trip();
        trip.setTripSchedule(schedule);
        trip.setDepartureDate(departureDate);

        // Giờ khởi hành: ưu tiên từ tham số, fallback về schedule
        LocalTime depTime = actualDepartureTime != null ? actualDepartureTime : schedule.getDepartureTime();
        trip.setActualDepartureTime(depTime);

        // Validate & Set Trip Type
        trip.setTripType(tripType);

        // Set Status Default
        trip.setStatus(TripStatus.SCHEDULED);

        trip.calculateAndSetExpectedArrivalTime();

        return trip;
    }

    /**
     * Factory method tạo Virtual Trip (Chuyến ảo) dùng cho tính toán mô phỏng.
     *
     * Virtual Trip không được lưu xuống DB (ID = -1), dùng để check conflict.
     *
     */
    public static Trip createVirtual(LocalDate departureDate, LocalTime departureTime, long durationMinutes) {
        if (departureDate == null || departureTime == null) {
            throw new BusinessException("Ngày giờ khởi hành là bắt buộc");
        }
        if (durationMinutes <= 0) {
            throw new BusinessException("Thời lượng chuyến đi phải lớn hơn 0");
        }

        Trip trip = new Trip();
        trip.setId(-1L);
        trip.setDepartureDate(departureDate);
        trip.setActualDepartureTime(departureTime);

        LocalDateTime start = LocalDateTime.of(departureDate, departureTime);
        trip.setArrivalTime(start.plusMinutes(durationMinutes));

        return trip;
    }

    public void setTripType(TripType tripType) {
        if (tripType == null) {
            this.tripType = TripType.MAIN;
        } else {
            this.tripType = tripType;
        }
    }

    @Column(name = "qr_code_data", columnDefinition = "TEXT")
    private String qrCodeData;

    @Column(name = "odometer_start", precision = 10, scale = 1)
    private BigDecimal odometerStart;

    @Column(name = "odometer_end", precision = 10, scale = 1)
    private BigDecimal odometerEnd;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private TripStatus status;

    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    private String cancelReason;

    @Column(name = "dispatch_note", columnDefinition = "TEXT")
    private String dispatchNote; // Lý do gán xe: "Quay đầu từ CT, score=0"

    // =========================================================================
    // HELPER METHODS (CLEAN CODE)
    // =========================================================================

    public boolean hasBus() {
        return this.busId != null;
    }

    /**
     * [Phase 3] Lấy tài xế chính qua trip.crew (direct FK).
     * Match cả PENDING (mới gán) và ACTIVE (đã duyệt chuyến).
     *
     * @return Optional chứa User (driver) hoặc empty nếu chưa có phân công
     */
    public Optional<User> getMainDriver() {
        return this.crew.stream()
                .filter(da -> da.getRole() == CrewRole.MAIN_DRIVER)
                .filter(da -> da.getStatus() == DriverAssignmentStatus.ACTIVE
                        || da.getStatus() == DriverAssignmentStatus.PENDING)
                .map(DriverAssignment::getDriver)
                .findFirst();
    }

    public boolean hasMainDriver() {
        return getMainDriver().isPresent();
    }

    public Long getRouteId() {
        if (this.tripSchedule != null && this.tripSchedule.getRoute() != null) {
            return this.tripSchedule.getRoute().getId();
        }
        return null;
    }

    /**
     * Lấy Route từ TripSchedule.
     * Dùng cho DriverDutyService validation.
     */
    public Route getRoute() {
        if (this.tripSchedule != null) {
            return this.tripSchedule.getRoute();
        }
        return null;
    }

    // =========================================================================
    // DOMAIN METHODS (AGGREGATE ROOT BEHAVIOR)
    // =========================================================================
    // Các quy tắc nghiệp vụ (Business Rules) được đóng gói trực tiếp trong Entity
    // thay vì nằm rải rác ở Service, giúp đảm bảo tính nhất quán (Invariants).

    /**
     * Gán xe vào chuyến.
     * 
     * Thực hiện kiểm tra các quy tắc nghiệp vụ:
     * 1. Xe phải đang hoạt động (Active).
     * 2. Xe phải còn hạn đăng kiểm tính đến ngày khởi hành.
     * 
     * @param bus Entity Xe (để kiểm tra hợp lệ)
     * @throws BusinessException nếu xe không thỏa mãn điều kiện.
     */
    public void assignBus(Bus bus) {
        validateModificationAllowed();

        if (bus == null) {
            this.busId = null;
            return;
        }

        // 1. Kiểm tra trạng thái xe
        if (!bus.isActive()) {
            throw new BusinessException(
                    "Xe " + bus.getLicensePlate() + " đang không hoạt động (Inactive).");
        }

        // 2. [LEGAL] Kiểm tra đăng kiểm
        if (bus.getRegistrationExpiryDate() != null &&
                bus.getRegistrationExpiryDate().isBefore(this.departureDate)) {
            throw new BusinessException(
                    "Xe " + bus.getLicensePlate() + " đã hết hạn đăng kiểm ngày " +
                            bus.getRegistrationExpiryDate() + ". Không thể điều độ.");
        }

        this.busId = bus.getId();
    }

    /**
     * Gán lại xe cho chuyến (dùng cho TripChange flow).
     *
     * Cho phép cả APPROVED/RUNNING — KHÔNG gọi validateModificationAllowed().
     * Validate: xe phải active + còn hạn đăng kiểm.
     *
     * @param bus Entity Xe mới
     * @throws BusinessException nếu xe không hợp lệ
     */
    public void reassignBus(Bus bus) {
        if (bus == null) {
            this.busId = null;
            return;
        }

        if (!bus.isActive()) {
            throw new BusinessException(
                    "Xe " + bus.getLicensePlate() + " đang không hoạt động (Inactive).");
        }

        if (bus.getRegistrationExpiryDate() != null &&
                bus.getRegistrationExpiryDate().isBefore(this.departureDate)) {
            throw new BusinessException(
                    "Xe " + bus.getLicensePlate() + " đã hết hạn đăng kiểm ngày " +
                            bus.getRegistrationExpiryDate() + ". Không thể điều độ.");
        }

        this.busId = bus.getId();
    }

    /**
     * [Phase 2] Gỡ bỏ xe khỏi chuyến.
     * Tài xế giờ quản lý qua DriverAssignment, không cần unassign ở đây.
     */
    public void unassignResources() {
        if (this.status == TripStatus.APPROVED) {
            throw new BusinessException("INVALID_STATUS", "Không thể gỡ tài nguyên khi chuyến đã duyệt.");
        }
        this.busId = null;
    }

    /**
     * Kiểm tra xem chuyến này có quá sát với chuyến khác không.
     * 
     * @param other         Chuyến cần so sánh
     * @param minGapMinutes Khoảng cách tối thiểu (phút) — lấy từ
     *                      OperationProperties
     * @return true nếu khoảng cách < minGapMinutes
     */
    public boolean isTooCloseTo(Trip other, long minGapMinutes) {
        LocalDateTime thisEnd = this.getExpectedArrivalTime();
        LocalDateTime otherStart = other.getStartDateTime();

        if (thisEnd == null || otherStart == null) {
            return false;
        }

        long gapMinutes = java.time.Duration.between(thisEnd, otherStart).toMinutes();
        return gapMinutes < minGapMinutes;
    }

    /**
     * [Phase 2] Giải phóng chuyến cho deadlock resolution.
     * Tài xế giờ quản lý qua DriverAssignment, chỉ cần chuyển status về SCHEDULED.
     */
    public void releaseForDeadlockResolution() {
        if (this.status != TripStatus.SCHEDULED) {
            throw new BusinessException("INVALID_STATUS",
                    "Chỉ có thể release từ chuyến APPROVED hoặc SCHEDULED");
        }
        this.status = TripStatus.SCHEDULED;
    }

    /**
     * Bắt đầu chuyến: APPROVED → RUNNING, ghi giờ thực tế.
     *
     * Invariants:
     * - Trip phải ở trạng thái APPROVED.
     * - Phải có tài xế chính (MAIN_DRIVER) đã gán.
     * - Phải có xe (Bus) đã gán.
     */
    public void start() {
        if (this.status != TripStatus.APPROVED) {
            throw new BusinessException("INVALID_STATUS", "Chỉ có thể bắt đầu chuyến đi đã được duyệt.");
        }
        if (this.busId == null) {
            throw new BusinessException("MISSING_BUS", "Chuyến chưa được gán xe. Không thể khởi hành.");
        }
        if (!hasMainDriver()) {
            throw new BusinessException("MISSING_DRIVER", "Chuyến chưa có tài xế chính. Không thể khởi hành.");
        }
        this.status = TripStatus.RUNNING;
        this.actualDepartureTime = LocalTime.now();
    }

    /**
     * Hoàn thành chuyến: RUNNING → COMPLETED, ghi giờ đến.
     */
    public void complete() {
        if (this.status != TripStatus.RUNNING) {
            throw new BusinessException("INVALID_STATUS", "Chuyến xe chưa bắt đầu hoặc đã kết thúc!");
        }
        this.status = TripStatus.COMPLETED;
        this.arrivalTime = LocalDateTime.now();
    }

    /**
     * Hủy chuyến: SCHEDULED|APPROVED → CANCELLED.
     */
    public void cancel() {
        if (this.status != TripStatus.SCHEDULED && this.status != TripStatus.APPROVED) {
            throw new BusinessException("INVALID_STATUS",
                    "Chỉ có thể hủy chuyến đang ở trạng thái SCHEDULED hoặc APPROVED.");
        }
        this.status = TripStatus.CANCELLED;
    }

    /**
     * Kiểm tra xem chuyến có cho phép sửa đổi không.
     * Chỉ cho phép sửa khi trạng thái là {@link TripStatus#SCHEDULED}.
     */
    private void validateModificationAllowed() {
        if (this.status != TripStatus.SCHEDULED) {
            throw new BusinessException(
                    "Chỉ có thể điều chỉnh khi chuyến đang ở trạng thái CÓ LỊCH (SCHEDULED).");
        }
    }

    /**
     * Lấy thời gian bắt đầu (LocalDateTime) tiện ích.
     * 
     * @return LocalDateTime hoặc null nếu thiếu dữ liệu ngày/giờ.
     */
    public LocalDateTime getStartDateTime() {
        if (this.departureDate == null || this.actualDepartureTime == null) {
            return null;
        }
        return LocalDateTime.of(this.departureDate, this.actualDepartureTime);
    }

    /**
     * Tính toán và set giá trị arrivalTime bằng expected (dự kiến) ngay khi khởi
     * tạo chuyến.
     * Logic dựa trên {@link #getScheduledDurationMinutes()}.
     */
    public void calculateAndSetExpectedArrivalTime() {
        if (this.departureDate == null || this.actualDepartureTime == null)
            return;

        LocalDateTime start = LocalDateTime.of(this.departureDate, this.actualDepartureTime);
        this.arrivalTime = start.plusMinutes(getScheduledDurationMinutes());
    }

    /**
     * Lấy thời gian kết thúc (LocalDateTime) với logic fallback.
     * 
     * Logic ưu tiên:
     * 1. Thực tế: Nếu arrivalTime đã có (do hoàn thành chuyến hoặc set tay), trả về
     * giá trị này.
     * 2. Dự kiến: Nếu chưa có arrivalTime, tính toán dựa trên getStartDateTime +
     * getDurationMinutes.
     * 
     * @return LocalDateTime thời gian đến (dự kiến hoặc thực tế).
     */
    public LocalDateTime getExpectedArrivalTime() {
        if (this.arrivalTime != null) {
            return this.arrivalTime;
        }
        // Fallback calculation if arrivalTime is explicitly null
        LocalDateTime start = getStartDateTime();
        if (start == null)
            return null;

        return start.plusMinutes(getDurationMinutes());
    }

    /**
     * Tính thời lượng chuyến đi (phút).
     * 
     * Centralized Logic: Dùng cho cả tính lương, kiểm tra luật lái xe, thống kê...
     * Logic Fallback 3 tầng:
     * - 1. Thực tế (Actual): Nếu đã có giờ đến (arrivalTime), tính chênh lệch thực
     * tế.
     * - 2. Cấu hình (Config): Nếu chưa chạy, lấy thời gian quy định của Tuyến
     * (Route).
     * - 3. Mặc định (Default): Nếu tuyến không có cấu hình, mặc định 4 tiếng (240p)
     * để an toàn.
     * 
     * @return thời lượng tính bằng phút.
     */
    public long getDurationMinutes() {
        // 1. Ưu tiên tính thực tế nếu đã có giờ đến
        if (this.arrivalTime != null && this.actualDepartureTime != null) {
            LocalDateTime start = getStartDateTime();
            if (start != null) {
                return java.time.Duration.between(start, this.arrivalTime).toMinutes();
            }
        }

        // 2. Fallback: Lấy thời gian theo cấu hình (Route)
        return getScheduledDurationMinutes();
    }

    /**
     * Helper Method: Lấy thời lượng dự kiến theo cấu hình Tuyến (Route).
     * 
     * Tách riêng để tái sử dụng cho both getDurationMinutes (khi fallback)
     * và calculateAndSetArrivalTime (khi khởi tạo).
     * 
     * Default: 4 tiếng (240 phút) nếu không có cấu hình.
     */
    private long getScheduledDurationMinutes() {
        if (this.tripSchedule != null && this.tripSchedule.getRoute() != null) {
            BigDecimal routeDuration = this.tripSchedule.getRoute().getDurationHours();
            if (routeDuration != null) {
                return (long) (routeDuration.doubleValue() * 60);
            }
        }
        return 4 * 60; // Default fallback
    }

    @PrePersist
    public void generateCode() {
        if (this.code == null && this.departureDate != null) {
            this.code = CodeGeneratorUtils.generateTripCode(this.departureDate);
        }
    }
}