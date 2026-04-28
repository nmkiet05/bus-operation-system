package com.bus.system.modules.operation.dto.request;

import com.bus.system.modules.operation.domain.enums.TripChangeType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho việc tạo yêu cầu thay đổi tài xế/xe.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTripChange {

    @NotNull(message = "Phải chọn chuyến xe")
    private Long tripId;

    @NotNull(message = "Phải chọn loại thay đổi")
    private TripChangeType changeType;

    /** ID tài xế mới (bắt buộc nếu changeType = DRIVER hoặc BOTH) */
    private Long newDriverId;

    /** ID xe mới (bắt buộc nếu changeType = BUS hoặc BOTH) */
    private Long newBusId;

    @NotNull(message = "Phải nhập lý do thay đổi")
    private String reason;
}
