package com.bus.system.config;

import com.bus.system.common.web.filter.CorrelationIdFilter;
import com.bus.system.common.web.filter.RateLimitFilter;
import com.bus.system.modules.identity.security.AuthEntryPointJwt;
import com.bus.system.modules.identity.security.AuthTokenFilter;
import com.bus.system.modules.identity.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.http.HttpMethod;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
@EnableMethodSecurity // Cho phép dùng @PreAuthorize ở Controller
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final AuthEntryPointJwt unauthorizedHandler;
    private final CorrelationIdFilter correlationIdFilter;
    private final RateLimitFilter rateLimitFilter;

    // Bean: Filter kiểm tra Token
    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    // Bean: Provider xác thực (Dùng UserDetails + PasswordEncoder)
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    // Bean: Manager quản lý đăng nhập
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    // Bean: Mã hóa mật khẩu (BCrypt là chuẩn hiện nay)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // --- CẤU HÌNH CHÍNH (QUAN TRỌNG NHẤT) ---
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. Tắt CSRF (Vì dùng JWT nên không cần, Session mới cần)
                .csrf(csrf -> csrf.disable())

                // 2. Cho phép CORS đúng chuẩn Spring Security 6
                .cors(org.springframework.security.config.Customizer.withDefaults())

                // 3. Xử lý lỗi khi chưa đăng nhập (Trả về 401 thay vì trang HTML login)
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))

                // 3. Quản lý Session: Stateless (Không lưu trạng thái, mỗi request phải gửi
                // Token)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 4. Phân quyền đường dẫn (Routing Security)
                .authorizeHttpRequests(auth -> auth
                    // a. Public cho các API auth cốt lõi
                    .requestMatchers(HttpMethod.POST,
                        "/api/auth/login",
                        "/api/auth/register",
                        "/api/auth/refresh-token").permitAll()

                        // b. Cho phép xem tài liệu API (Swagger)
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                        // c. Cho phép PUBLIC truy cập danh mục (Bến xe, Tỉnh, Loại xe) cho dropdown
                        .requestMatchers("/api/catalog/**").permitAll()

                        // d. Cho phép PUBLIC truy cập Tìm kiếm chuyến xe
                        .requestMatchers("/api/operation/trips/search").permitAll()

                        // e. Cho phép PUBLIC xem điểm đón/trả (GET only - POST/PUT/DELETE vẫn cần auth)
                        .requestMatchers(HttpMethod.GET, "/api/planning/routes/*/pickup-points").permitAll()

                        // f. Cho phép PUBLIC xem sơ đồ ghế
                        .requestMatchers("/api/operation/trips/*/seat-map").permitAll()

                        // g. Cho phép PUBLIC đặt vé (Guest booking), tra cứu vé, và xem vé public
                        .requestMatchers(HttpMethod.POST, "/api/bookings").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/bookings/public/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/bookings/search").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/bookings/*").permitAll()

                        // i. Cho phép PUBLIC xác nhận thanh toán (bank-transfer confirm page không cần token)
                        .requestMatchers(HttpMethod.POST, "/api/payments/process").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/payments/simulate").permitAll()

                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // i. Bypassing test endpoints directly
                        .requestMatchers("/api/operation/trips").permitAll()

                        // d. --- BẢO VỆ MODULE FLEET (QUAN TRỌNG) ---
                        // Bắt buộc phải có Token mới được vào khu vực này.
                        // Quyền cụ thể (Admin/Staff) sẽ do Controller check tiếp.
                        .requestMatchers("/api/fleet/**").authenticated()

                        // e. Tất cả các request còn lại đều phải đăng nhập
                        .anyRequest().authenticated());

                http.headers(headers -> {
                    headers.contentTypeOptions(org.springframework.security.config.Customizer.withDefaults());
                    headers.referrerPolicy(referrer -> referrer
                        .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER));
                    headers.frameOptions(frame -> frame.deny());
                    headers.addHeaderWriter(new org.springframework.security.web.header.writers.StaticHeadersWriter(
                        "Permissions-Policy", "geolocation=(), microphone=(), camera=()"));
                    headers.contentSecurityPolicy(csp -> csp
                        .policyDirectives("default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; frame-ancestors 'none';"));
                });

        // 5. Thêm Provider xác thực
        http.authenticationProvider(authenticationProvider());

        // 6. Thêm Filter kiểm tra Token TRƯỚC khi xác thực Username/Pass
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(correlationIdFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Bean: Cấu hình CORS (Cho phép Frontend gọi API)
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Cho phép gửi Cookie/Credential
        config.setAllowCredentials(true);

        // Danh sách các domain được phép gọi API (Frontend React/Vue...)
        // Đọc từ biến môi trường, mặc định cho local development
        String allowedOrigins = System.getenv().getOrDefault(
                "CORS_ALLOWED_ORIGINS",
                "http://localhost:3000,http://localhost:5173");
        config.setAllowedOrigins(List.of(allowedOrigins.split(",")));

        // Cho phép mọi Header và Method (GET, POST, PUT, DELETE...)
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}