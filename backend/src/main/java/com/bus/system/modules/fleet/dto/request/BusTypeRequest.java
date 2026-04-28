package com.bus.system.modules.fleet.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class BusTypeRequest {

    @NotBlank(message = "Tên loại xe không được để trống")
    private String name;

    @NotNull(message = "Số ghế không được để trống")
    @Positive(message = "Số ghế phải lớn hơn 0")
    private Integer totalSeats;

    // Sơ đồ ghế ngồi dạng JSON
    // Ví dụ: [{"row": 1, "col": "A", "type": "VIP"}, ...]
    private List<Map<String, Object>> seatMap;
}
