# Module Quản lý Định danh & Phân quyền (Identity & Auth)

## 1. Overview
Module Identity quản lý vòng đời của người dùng trong hệ thống (Tạo mới, Xác thực, Phân quyền). Hệ thống sử dụng cơ chế Multi-role (Một người dùng có thể có nhiều vai trò) để phân tách quyền hạn giữa Admin, Nhân viên và Khách hàng.

## 2. Architecture
- **Auth Layer:** Tích hợp trực tiếp với Spring Security. `UserDetailsServiceImpl` load user từ database thông qua `UserRepository`.
- **JWT Provider:** Token được sinh ra với Secret Key và Expiration Time cố định, không lưu trữ (Stateless). Refresh Token lưu trong DB để cấp mới Access Token.

## 3. Key Entities / Components
- `@Entity User`: Lưu trữ thông tin đăng nhập (`username`, `password`, `email`).
- `@Entity UserRole`: Cầu nối n-n giữa User và Role.
- `@Entity Role`: Định nghĩa các quyền `ADMIN`, `STAFF`, `DRIVER`, `CUSTOMER`.
- `JwtUtils`: Component chịu trách nhiệm `generateJwtToken()` và `validateJwtToken()`.
- `AuthTokenFilter`: Middleware chặn trước request để inject `Authentication` vào SecurityContext.

## 4. Business Rules
- **Đăng nhập (Login):** Mật khẩu được mã hóa một chiều bằng `BCryptPasswordEncoder`. Nếu đăng nhập sai quá nhiều lần, Rate Limit sẽ tự động block (cấu hình trong `SecurityConfig`).
- **Xác thực:** Mọi API (ngoại trừ public API như Catalog/Booking public) đều yêu cầu Access Token hợp lệ.
- **Quyền hạn:** 
  - `ADMIN`: Toàn quyền quản trị.
  - `STAFF`: Quyền điều hành, tạo lịch, đổi xe, duyệt vé.

## 5. Technical Notes
- **Lưu ý Security:** Tham khảo chi tiết tại `docs/architecture/SECURITY_AND_AUTH.md`.
- **Thiết kế Sub-type:** Thay vì nhét tất cả thông tin vào bảng `users`, hệ thống dùng các bảng phụ (`staff_detail`, `driver_detail`) có chung `user_id` để tối ưu schema, loại bỏ NULL fields cho các thuộc tính đặc thù.
