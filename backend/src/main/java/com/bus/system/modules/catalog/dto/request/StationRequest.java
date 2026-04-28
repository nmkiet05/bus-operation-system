package com.bus.system.modules.catalog.dto.request;

import com.bus.system.modules.catalog.domain.enums.StationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StationRequest {
    @NotBlank(message = "Mã bến (gov_code) không được để trống")
    private String govCode; // Mã bến do nhà nước cấp

    @NotBlank(message = "Tên bến không được để trống")
    private String name;

    private String address;

    @NotNull(message = "Phải chọn Tỉnh/Thành phố (ID)")
    private Long provinceId;

    private StationStatus status; // Dùng Enum thay vì String
}