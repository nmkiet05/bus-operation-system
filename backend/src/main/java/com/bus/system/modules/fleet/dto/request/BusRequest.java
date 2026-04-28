package com.bus.system.modules.fleet.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class BusRequest {
    @NotBlank(message = "Biển số xe bắt buộc")
    private String licensePlate;

    @NotNull(message = "Phải chọn loại xe (Bus Type ID)")
    private Long busTypeId; // Gửi ID loại xe thay vì nhập tên hãng

    private String transportBadgeNumber;
    private LocalDate badgeExpiryDate;
    private String gpsDeviceId;

    @NotBlank(message = "Số khung bắt buộc")
    private String vinNumber;

    @NotBlank(message = "Số máy bắt buộc")
    private String engineNumber;

    private Integer manufacturingYear;

    @NotNull(message = "Ngày hết hạn bảo hiểm bắt buộc")
    private LocalDate insuranceExpiryDate;

    @NotNull(message = "Ngày hết hạn đăng kiểm bắt buộc")
    private LocalDate registrationExpiryDate;
    private LocalDate nextMaintenanceDueAt;
    private String status;
}