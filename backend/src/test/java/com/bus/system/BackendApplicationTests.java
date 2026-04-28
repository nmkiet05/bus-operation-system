package com.bus.system;

import org.junit.jupiter.api.Test;
import org.redisson.api.RedissonClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest(properties = {
                "app.jwtRefreshExpirationMs=604800000"
})
class BackendApplicationTests {

    @MockBean
    private RedissonClient redissonClient;

    @Test
    void contextLoads() {
    }

}
