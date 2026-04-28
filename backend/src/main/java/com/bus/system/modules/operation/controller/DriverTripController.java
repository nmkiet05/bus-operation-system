package com.bus.system.modules.operation.controller;

import com.bus.system.common.constants.AppConstants;
import com.bus.system.common.response.ApiResponse;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.operation.domain.DriverAssignment;
import com.bus.system.modules.operation.dto.response.CrewMemberResponse;
import com.bus.system.modules.operation.dto.response.TripResponse;
import com.bus.system.modules.operation.mapper.DriverAssignmentMapper;
import com.bus.system.modules.operation.repository.DriverAssignmentRepository;
import com.bus.system.modules.operation.service.TripQueryService;
import com.bus.system.modules.sales.domain.Ticket;
import com.bus.system.modules.sales.repository.TicketRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/driver/trips")
@RequiredArgsConstructor
@Tag(name = "Driver Portal", description = "Endpoint dành cho Tài xế xem lịch chuyến và thông tin chuyến của mình")
public class DriverTripController {

    private final TripQueryService tripQueryService;
    private final DriverAssignmentRepository driverAssignmentRepository;
    private final DriverAssignmentMapper driverAssignmentMapper;
    private final TicketRepository ticketRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. LỊCH CHUYẾN THEO THÁNG
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Lấy danh sách chuyến được phân công cho tài xế đang đăng nhập.
     * Mặc định trả về toàn bộ chuyến trong tháng hiện tại nếu không truyền ngày.
     */
    @GetMapping("/my-schedule")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF_DRIVER)
    @Operation(
        summary = "Lịch chuyến của tài xế",
        description = "Trả về danh sách chuyến đã được gán cho tài xế đang đăng nhập trong khoảng ngày"
    )
    public ResponseEntity<ApiResponse<List<TripResponse>>> getMySchedule(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        LocalDate from = fromDate != null ? fromDate : LocalDate.now().withDayOfMonth(1);
        LocalDate to   = toDate   != null ? toDate   : LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());

        List<TripResponse> trips = tripQueryService.getTripsByDriver(currentUser.getId(), from, to);
        return ResponseEntity.ok(ApiResponse.success(trips, "Lịch chuyến của tài xế"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ĐỘI NGŨ PHỤC VỤ CHUYẾN (crew)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Lấy danh sách crew (toàn bộ nhân sự) trên một chuyến.
     * Tài xế chỉ xem, không thể thay đổi.
     */
    @GetMapping("/{tripId}/crew")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF_DRIVER)
    @Operation(
        summary = "Đội ngũ phục vụ chuyến",
        description = "Trả về danh sách crew được phân công trên chuyến — tài xế chỉ xem"
    )
    public ResponseEntity<ApiResponse<List<CrewMemberResponse>>> getTripCrew(
            @PathVariable Long tripId) {

        List<DriverAssignment> crew = driverAssignmentRepository.findByTripId(tripId);
        List<CrewMemberResponse> response = driverAssignmentMapper.toCrewMemberResponseList(crew);
        return ResponseEntity.ok(ApiResponse.success(response, "Đội ngũ phục vụ chuyến"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. DANH SÁCH HÀNH KHÁCH
    // ─────────────────────────────────────────────────────────────────────────

    /** DTO đơn giản cho hành khách — chỉ expose thông tin cần thiết */
    @Data
    @Builder
    public static class PassengerInfo {
        private Long ticketId;
        private String ticketCode;
        private String seatNumber;
        private String passengerName;
        private String passengerPhone;
        private String pickupPoint;   // Điểm đón (null = tại bến)
        private String dropoffPoint;  // Điểm trả (null = tại bến)
        private Boolean isCheckedIn;
        private String status;        // ACTIVE, CONFIRMED, CANCELLED
    }

    /**
     * Lấy danh sách hành khách trên chuyến (read-only cho tài xế).
     * Chỉ trả những vé chưa bị hủy (ACTIVE, CONFIRMED, USED).
     */
    @GetMapping("/{tripId}/passengers")
    @PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF_DRIVER)
    @Operation(
        summary = "Danh sách hành khách",
        description = "Trả về danh sách hành khách đặt vé trên chuyến — tài xế chỉ xem"
    )
    public ResponseEntity<ApiResponse<List<PassengerInfo>>> getTripPassengers(
            @PathVariable Long tripId) {

        // Sử dụng JOIN FETCH để tối ưu 100% N+1
        List<Ticket> tickets = ticketRepository.findByTripIdWithPoints(tripId);

        List<PassengerInfo> passengers = tickets.stream()
                // Bỏ qua vé đã hủy/hết hạn
                .filter(t -> t.getStatus() != null
                        && !t.getStatus().name().equals("CANCELLED")
                        && !t.getStatus().name().equals("EXPIRED"))
                .map(t -> {
                        // Ưu tiên tên riêng trên vé, fallback sang tên booking (guest hoặc user)
                        String name = t.getPassengerName();
                        String phone = t.getPassengerPhone();
                        if (name == null && t.getBooking() != null) {
                            if (t.getBooking().getUser() != null) {
                                name = t.getBooking().getUser().getFullName();
                                if (phone == null) phone = t.getBooking().getUser().getPhone();
                            } else {
                                name = t.getBooking().getGuestName();
                                if (phone == null) phone = t.getBooking().getGuestPhone();
                            }
                        }
                        return PassengerInfo.builder()
                                .ticketId(t.getId())
                                .ticketCode("VE-" + String.format("%06d", t.getId()))
                                .seatNumber(t.getSeatNumber())
                                .passengerName(name)
                                .passengerPhone(phone)
                                .pickupPoint(t.getPickupPoint() != null ? t.getPickupPoint().getName() : null)
                                .dropoffPoint(t.getDropoffPoint() != null ? t.getDropoffPoint().getName() : null)
                                .isCheckedIn(t.isCheckedIn())
                                .status(t.getStatus().name())
                                .build();
                })
                .sorted(java.util.Comparator.comparing(PassengerInfo::getSeatNumber))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(passengers,
                "Danh sách " + passengers.size() + " hành khách"));
    }
}
