package com.bus.system.modules.operation.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
public class TripGenerationRequest {

    @NotNull(message = "Tuyến đường không được để trống")
    private Long routeId;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate fromDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate toDate;

    // Flag này cho phép xóa các chuyến cũ (trạng thái SCHEDULED) để sinh lại
    private Boolean forceRegenerate = false;
}