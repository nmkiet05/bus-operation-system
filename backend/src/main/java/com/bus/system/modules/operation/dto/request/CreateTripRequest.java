package com.bus.system.modules.operation.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Request tạo Trip thủ công (MAIN hoặc REINFORCEMENT)
 */
@Getter
@Setter
public class CreateTripRequest {

    @NotNull(message = "Vui lòng chọn Lịch trình mẫu (trip_schedule_id)")
    private Long tripScheduleId;

    @NotNull(message = "Vui lòng chọn ngày khởi hành")
    private LocalDate departureDate;

    /**
     * Giờ khởi hành thực tế (nếu không nhập sẽ lấy từ Schedule)
     */
    private LocalTime departureTime;

    /**
     * Loại chuyến: MAIN (chuyến chính) hoặc REINFORCEMENT (chuyến tăng cường)
     * Mặc định: MAIN
     */
    private String tripType = "MAIN";

    /**
     * ID xe được gán (không bắt buộc lúc tạo, có thể gán sau)
     */
    private Long busId;

    // [Phase 3] mainDriverId đã xóa — tài xế gán qua DriverAssignment

    /**
     * Ghi chú bổ sung (ví dụ: Lý do tạo chuyến tăng cường)
     */
    private String note;
}
