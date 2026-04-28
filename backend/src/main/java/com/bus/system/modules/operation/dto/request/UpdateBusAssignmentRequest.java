package com.bus.system.modules.operation.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * DTO cập nhật Ca xe.
 * Cho phép đổi thời gian, ghi chú (không đổi xe → logic phức tạp).
 */
@Getter
@Setter
public class UpdateBusAssignmentRequest {

    private LocalDateTime scheduledStart;

    private LocalDateTime scheduledEnd;

    private String notes;
}
