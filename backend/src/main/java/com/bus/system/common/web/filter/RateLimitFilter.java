package com.bus.system.common.web.filter;

import com.bus.system.config.RateLimitProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RRateLimiter;
import org.redisson.api.RateIntervalUnit;
import org.redisson.api.RateType;
import org.redisson.api.RedissonClient;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Order(1)
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final RedissonClient redissonClient;
    private final RateLimitProperties properties;

    private final Map<String, AtomicInteger> localFallbackLimiter;
    private final Set<String> initializedRateLimiters;
    private volatile long lastLocalResetTime = System.currentTimeMillis();

    public RateLimitFilter(RedissonClient redissonClient, RateLimitProperties properties) {
        this.redissonClient = redissonClient;
        this.properties = properties;

        final int cacheSize = Math.max(1000, properties.getLocalCacheSize());

        this.localFallbackLimiter = Collections.synchronizedMap(
                new LinkedHashMap<String, AtomicInteger>(1024, 0.75f, true) {
                    @Override
                    protected boolean removeEldestEntry(Map.Entry<String, AtomicInteger> eldest) {
                        return size() > cacheSize;
                    }
                });

        this.initializedRateLimiters = Collections.newSetFromMap(
                Collections.synchronizedMap(new LinkedHashMap<String, Boolean>(1024, 0.75f, true) {
                    @Override
                    protected boolean removeEldestEntry(Map.Entry<String, Boolean> eldest) {
                        return size() > cacheSize;
                    }
                }));
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        if (!properties.isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        boolean isAllowed = true;
        int remaining = properties.getMaxRequestsPerMinute();

        try {
            String cacheKey = "rate_limit:" + clientIp;
            RRateLimiter rateLimiter = redissonClient.getRateLimiter(cacheKey);

            if (initializedRateLimiters.add(cacheKey)) {
                rateLimiter.trySetRate(
                        RateType.OVERALL,
                        properties.getMaxRequestsPerMinute(),
                        1,
                        RateIntervalUnit.MINUTES);
                rateLimiter.expireAsync(Duration.ofMinutes(5));
            }

            isAllowed = rateLimiter.tryAcquire();
            remaining = (int) rateLimiter.availablePermits();
        } catch (Exception e) {
            log.warn("Redis rate limiter unavailable, fallback local limiter for IP={}", clientIp);
            isAllowed = checkLocalFallbackLimiter(clientIp);
            remaining = -1;
        }

        if (!isAllowed) {
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(429);
            response.getWriter().write(
                    "{\"status\":429,\"message\":\"Quá nhiều request. Vui lòng thử lại sau.\",\"data\":null}");
            return;
        }

        response.setHeader("X-RateLimit-Limit", String.valueOf(properties.getMaxRequestsPerMinute()));
        if (remaining >= 0) {
            response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, remaining)));
        }

        filterChain.doFilter(request, response);
    }

    private synchronized boolean checkLocalFallbackLimiter(String clientIp) {
        long now = System.currentTimeMillis();
        if (now - lastLocalResetTime > 60_000) {
            localFallbackLimiter.clear();
            lastLocalResetTime = now;
        }

        return localFallbackLimiter
                .computeIfAbsent(clientIp, k -> new AtomicInteger(0))
                .incrementAndGet() <= properties.getMaxRequestsPerMinute();
    }

    private String getClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (!isTrustedProxy(remoteAddr)) {
            return remoteAddr;
        }

        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return remoteAddr;
    }

    private boolean isTrustedProxy(String remoteAddr) {
        if (remoteAddr == null) {
            return false;
        }
        return properties.getTrustedProxyList().stream().anyMatch(remoteAddr::startsWith);
    }
}
