package com.bus.system.modules.catalog.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProvinceRequest {
    @NotBlank(message = "Tên tỉnh không được để trống")
    private String name;

    @NotBlank(message = "Mã tỉnh GSO không được để trống")
    private String govCode; // Mã tỉnh theo Tổng cục Thống kê
}