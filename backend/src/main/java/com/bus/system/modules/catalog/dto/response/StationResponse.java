package com.bus.system.modules.catalog.dto.response;

import com.bus.system.modules.catalog.domain.enums.StationStatus;
import lombok.Data;

@Data
public class StationResponse {
    private Long id;
    private String govCode; // Mã bến do nhà nước cấp
    private String name;
    private String address;

    // Flatten dữ liệu để Frontend dễ hiển thị
    private Long provinceId;
    private String provinceName;

    private StationStatus status; // Dùng Enum thay vì String
}