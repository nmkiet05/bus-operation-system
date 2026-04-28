package com.bus.system.modules.identity.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Set;

@Data
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private String refreshToken;
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private Set<String> roles;

    // Constructor phụ cho gọn
    public JwtResponse(String accessToken, String refreshToken, Long id, String username, String email,
            String fullName, String phone, Set<String> roles) {
        this.token = accessToken;
        this.refreshToken = refreshToken;
        this.id = id;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.phone = phone;
        this.roles = roles;
    }
}
