package com.bus.system.modules.operation.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO tạo Ca xe thủ công.
 * tripIds: (tùy chọn) danh sách trip SCHEDULED cần gán ngay khi tạo ca.
 */
@Getter
@Setter
public class CreateBusAssignmentRequest {

    @NotNull(message = "busId không được để trống")
    private Long busId;

    private Long startDepotId;

    @NotNull(message = "Thời gian bắt đầu ca không được để trống")
    private LocalDateTime scheduledStart;

    @NotNull(message = "Thời gian kết thúc ca không được để trống")
    private LocalDateTime scheduledEnd;

    private String notes;

    /** Danh sách trip IDs gán ngay khi tạo ca (tùy chọn) */
    private List<Long> tripIds;
}
