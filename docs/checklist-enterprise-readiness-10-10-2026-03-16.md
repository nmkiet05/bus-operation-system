# Checklist Enterprise Readiness 10-10 (Backend)

## Muc tieu
- Dat muc production-ready theo 4 tru: Security, Reliability, Observability, Governance.
- Trien khai theo commit nho, co rollback an toan.

## 0) Pre-flight checklist
- [ ] Tao commit moc an toan truoc moi dot thay doi.
- [ ] Chot branch migration/hardening rieng.
- [ ] Chot env matrix: dev, staging, prod.
- [ ] Chot SLO toi thieu: p95, error rate, availability.

---

## 1) SecurityConfig hardening
### Checklist
- [ ] Chi permit public dung endpoint can thiet (login/register/refresh-token).
- [ ] Tat permitAll theo wildcard rong.
- [ ] Bo sung security headers co profile theo moi truong.
- [ ] Giu deny-by-default cho cac route con lai.

### File muc tieu
- backend/src/main/java/com/bus/system/config/SecurityConfig.java

### Code du kien
```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers(HttpMethod.POST,
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh-token").permitAll()
    .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
    .anyRequest().authenticated());

http.headers(headers -> headers
    .contentTypeOptions(org.springframework.security.config.Customizer.withDefaults())
    .referrerPolicy(r -> r.policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
    .frameOptions(f -> f.deny())
    .permissionsPolicy(p -> p.policy("geolocation=(), microphone=(), camera=()"))
    .contentSecurityPolicy(csp -> csp
        .policyDirectives("default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; frame-ancestors 'none';")));
```

---

## 2) RateLimitFilter enterprise
### Checklist
- [ ] Dung Redisson RRateLimiter cho distributed quota.
- [ ] Khong goi trySetRate lien tuc moi request.
- [ ] Co fallback local limiter khi Redis loi.
- [ ] Co trusted proxy check, tranh spoof X-Forwarded-For.
- [ ] Co metric cho so lan 429 va so lan fallback.

### File muc tieu
- backend/src/main/java/com/bus/system/common/web/filter/RateLimitFilter.java

### Code du kien
```java
private static final int MAX_REQUESTS_PER_MINUTE = 60;
private final RedissonClient redissonClient;

private final Map<String, AtomicInteger> localFallbackLimiter =
    Collections.synchronizedMap(new LinkedHashMap<String, AtomicInteger>(1024, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, AtomicInteger> eldest) {
            return size() > 10000;
        }
    });

private final Set<String> initializedRateLimiters =
    Collections.newSetFromMap(Collections.synchronizedMap(new LinkedHashMap<String, Boolean>(1024, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, Boolean> eldest) {
            return size() > 10000;
        }
    }));

private String getClientIp(HttpServletRequest request) {
    String xf = request.getHeader("X-Forwarded-For");
    String remote = request.getRemoteAddr();

    // Chi tin X-Forwarded-For neu request den tu trusted proxy
    if (!isTrustedProxy(remote)) {
        return remote;
    }

    if (xf != null && !xf.isBlank()) {
        return xf.split(",")[0].trim();
    }
    return remote;
}

private boolean isTrustedProxy(String remoteAddr) {
    return remoteAddr.startsWith("10.") || remoteAddr.startsWith("192.168.") || "127.0.0.1".equals(remoteAddr);
}
```

---

## 3) JPA Auditing dung kieu du lieu
### Checklist
- [ ] Bat @EnableJpaAuditing voi auditorAwareRef.
- [ ] AuditorAware<Long> khop voi created_by/updated_by type BIGINT.
- [ ] Safe principal cast, khong ep kieu cung.
- [ ] Anonymous/public flow tra Optional.empty() neu cot cho phep null.

### File muc tieu
- backend/src/main/java/com/bus/system/config/JpaAuditingConfig.java
- backend/src/main/java/com/bus/system/config/AuditorAwareImpl.java

### Code du kien
```java
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class JpaAuditingConfig {
    @Bean
    public AuditorAware<Long> auditorAware() {
        return new AuditorAwareImpl();
    }
}
```

```java
@Component
public class AuditorAwareImpl implements AuditorAware<Long> {

    @Override
    @NonNull
    public Optional<Long> getCurrentAuditor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return Optional.empty();
        }

        Object principal = auth.getPrincipal();
        if (principal instanceof User user) {
            return Optional.ofNullable(user.getId());
        }

        return Optional.empty();
    }
}
```

---

## 4) GlobalExceptionHandler an toan production
### Checklist
- [ ] Khong tra root cause/noi dung SQL cho client.
- [ ] Log chi tiet o backend, response thong diep than thien.
- [ ] Chuan hoa ma loi API.

### File muc tieu
- backend/src/main/java/com/bus/system/common/exception/GlobalExceptionHandler.java

### Code du kien
```java
@ExceptionHandler(Exception.class)
public ResponseEntity<ApiResponse<Object>> handleGlobalException(Exception ex) {
    log.error("Unhandled error", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiResponse.error(500, "He thong dang ban. Vui long thu lai sau."));
}

@ExceptionHandler(DataIntegrityViolationException.class)
public ResponseEntity<ApiResponse<Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
    log.error("Data integrity violation", ex);
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(ApiResponse.error(400, "Xung dot du lieu hoac du lieu da ton tai."));
}
```

---

## 5) Cau hinh production profile
### Checklist
- [ ] Tat show-sql trong production.
- [ ] Logging ve INFO theo package can thiet.
- [ ] Tach application-prod.yml rieng.

### File muc tieu
- backend/src/main/resources/application-prod.yml

### Code du kien
```yaml
spring:
  jpa:
    show-sql: false

logging:
  level:
    root: INFO
    org.springframework.security: INFO
    org.springframework.web: INFO
    com.bus.system: INFO
```

---

## 6) Kiem thu va gate truoc merge
### Checklist
- [ ] Build pass: mvnw -DskipTests compile
- [ ] Unit/integration test pass
- [ ] Regression test auth + booking + payment pass
- [ ] Rate limit test pass (429 dung nguong)
- [ ] Security smoke test pass (401/403 theo ky vong)

### Lenh goi y
```powershell
Set-Location backend
.\mvnw.cmd -DskipTests compile
.\mvnw.cmd test
```

---

## 7) Rollout va rollback
### Checklist
- [ ] Deploy staging truoc prod.
- [ ] Theo doi error rate va p95 trong 30-60 phut.
- [ ] Neu vuot nguong canh bao, rollback ve commit moc.
- [ ] Lap bao cao sau dot deploy.

## DoD (Definition of Done)
- [ ] Khong con endpoint nhay cam mo wildcard.
- [ ] Rate limit phan tan hoat dong, co fallback.
- [ ] Audit hoat dong on dinh voi kieu Long.
- [ ] Loi 500 khong lo thong tin noi bo.
- [ ] Log/SQL profile san sang production.
