package com.bus.system.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@ConfigurationProperties(prefix = "security.rate-limit")
@Getter
@Setter
public class RateLimitProperties {

    private boolean enabled = true;
    private int maxRequestsPerMinute = 60;
    private int localCacheSize = 10000;
    private String trustedProxies = "127.0.0.1,10.,192.168.";

    public List<String> getTrustedProxyList() {
        return Arrays.stream(trustedProxies.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }
}