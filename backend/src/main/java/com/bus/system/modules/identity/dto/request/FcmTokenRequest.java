package com.bus.system.modules.identity.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FcmTokenRequest {
    @NotBlank(message = "FCM Token không được để trống")
    @Schema(description = "Token từ Firebase SDK", example = "dKj9...")
    private String fcmToken;

    @Schema(description = "Loại thiết bị", example = "ANDROID")
    private String deviceType; // ANDROID, IOS, WEB
}
