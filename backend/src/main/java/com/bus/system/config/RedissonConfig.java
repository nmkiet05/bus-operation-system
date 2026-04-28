package com.bus.system.config;

import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Redisson Configuration cho Distributed Locking
 * Dùng để lock ghế khi booking (tránh double-booking)
 */
@Configuration
public class RedissonConfig {

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Bean
    public RedissonClient redissonClient() {
        Config config = new Config();
        // Single server mode (không dùng cluster cho project này)
        // Production simulation settings
        config.useSingleServer()
                .setAddress("redis://" + redisHost + ":" + redisPort)
                .setConnectionPoolSize(32) // Tăng pool size để chịu tải cao
                .setConnectionMinimumIdleSize(8) // Giữ kết nối idle để tránh tạo mới liên tục
                .setTimeout(3000) // Timeout lệnh Redis (3s)
                .setConnectTimeout(10000) // Timeout kết nối ban đầu (10s)
                .setRetryAttempts(5) // Retry 5 lần nếu lỗi mạng
                .setRetryInterval(1000); // Chờ 1s giữa các lần retry

        return Redisson.create(config);
    }
}
