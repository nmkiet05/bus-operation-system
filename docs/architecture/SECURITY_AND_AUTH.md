# Security & Authentication

## 1. Overview
Kiến trúc bảo mật của Bus Operation System được xây dựng dựa trên **Spring Security 6** và **JSON Web Token (JWT)**, hoạt động theo cơ chế **Stateless**. Mọi request cần quyền truy cập đều phải đính kèm token trong header `Authorization: Bearer <token>`.

## 2. Authentication Flow (JWT Stateless)
Luồng xác thực được cấu hình tại `SecurityConfig.java`:

- **Đăng nhập (`/api/auth/login`):** Dùng `AuthenticationManager` với `DaoAuthenticationProvider` để kiểm tra tài khoản qua `UserDetailsServiceImpl`.
- **Mã hóa mật khẩu:** Sử dụng `BCryptPasswordEncoder`.
- **Sinh JWT (`JwtUtils.java`):** Sinh token với thuật toán mã hóa `HS256` dựa trên `jwtSecret` và `jwtExpirationMs` lấy từ `application.yml`.
- **Bộ lọc (`AuthTokenFilter`):** Kế thừa `OncePerRequestFilter`, đứng trước `UsernamePasswordAuthenticationFilter` để giải mã JWT, lấy `username`, load roles và gán đối tượng `UsernamePasswordAuthenticationToken` vào `SecurityContextHolder`.

## 3. Endpoint Authorization & CORS

### CORS Configuration
CORS được cấu hình global thông qua `CorsFilter` bean:
- Cho phép `AllowCredentials(true)`.
- Các domain hợp lệ: Đọc từ biến môi trường `CORS_ALLOWED_ORIGINS` (mặc định cho Next.js và Vite: `http://localhost:3000, http://localhost:5173`).
- Cho phép mọi Header và Method.

### Routing Security
- **Public API (`permitAll()`):**
  - Auth: `/api/auth/login`, `/register`, `/refresh-token`
  - Public Data: `/api/catalog/**` (Danh mục bến xe, loại xe)
  - Booking & Search: `/api/operation/trips/search`, `/api/bookings/public/**`
  - Webhooks/Callbacks: `/api/payments/process`, `/api/payments/simulate`
  - Swagger UI: `/v3/api-docs/**`, `/swagger-ui/**`

- **Protected API (`authenticated()`):** Tất cả các endpoint còn lại đều bị chặn nếu không có Token. Xử lý lỗi 401 qua `AuthEntryPointJwt`.

## 4. Method-Level Security (RBAC)
Ngoài bảo vệ theo đường dẫn (URL), hệ thống sử dụng phân quyền đến từng hàm (Method-level Security) thông qua annotation `@PreAuthorize`. Spring Boot được kích hoạt tính năng này nhờ `@EnableMethodSecurity`.

Quyền được định nghĩa sẵn trong `AppConstants.java`:
- `@PreAuthorize("isAuthenticated()")`: Dùng cho user tự xem thông tin (Ví dụ: `MeController.java`).
- `@PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)`: Dành cho nhân viên điều hành, bán vé hoặc admin. (Ví dụ: Tạo cấu hình giá, duyệt thay đổi chuyến).
- `@PreAuthorize(AppConstants.HAS_ROLE_ADMIN)`: Quyền lực tối cao, chỉ dành riêng cho Admin (Ví dụ: Xóa tuyến, cấp quyền nhân viên, ép duyệt request khẩn cấp).

## 5. Security Headers & Defense in Depth
Hệ thống tự động inject các HTTP Response Headers bảo mật chặt chẽ chuẩn OWASP:
- **CSRF:** Bị vô hiệu hóa (`csrf.disable()`) vì JWT không phụ thuộc vào Cookie, miễn nhiễm với CSRF.
- **X-Frame-Options:** `DENY` (Chống Clickjacking).
- **Referrer-Policy:** `NO_REFERRER` (Chống lộ URL nhạy cảm qua header referrer).
- **Content-Security-Policy (CSP):** `default-src 'self'; frame-ancestors 'none';`
- **Permissions-Policy:** Khóa `geolocation`, `microphone`, `camera`.

## 6. Lớp Bảo Vệ Vòng Ngoài (Custom Filters)
Trước khi request chạm đến bộ lọc xác thực `AuthTokenFilter`, nó phải đi qua các lớp:
1. `CorrelationIdFilter`: Gắn mã tracking `X-Correlation-ID` cho mỗi request để trace log trên Kibana/Datadog.
2. `RateLimitFilter`: Giới hạn tốc độ request (Rate Limiting) theo IP/User, cấu hình thông qua properties (mặc định 60 requests/phút) để chống Brute-force và DDoS.
