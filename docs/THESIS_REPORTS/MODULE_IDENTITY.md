# MODULE: ĐỊNH DANH VÀ BẢO MẬT (IDENTITY & SECURITY)

> **Mô tả:** Lớp áo giáp vòng ngoài và mỏ neo cơ sở cấp quyền phân cực (Role-Based Access Control) của toàn bộ hệ thống. Module Identity chi phối quyền lực điện tử lên mọi tài khoản truy nhập, đảm bảo không một lệnh sai trái nào lọt vào trung tâm điều hành. Cắt đôi giao diện Web tĩnh trên nền CSDL quan hệ siêu mỏng nhưng cực kỳ nghiêm ngặt.

## 1. Cấu Trúc Khối Dữ Liệu Nhân Sự Tập Trung (Database Schema)

Module được triển khai theo mô hình Đa Quyền Lực Đơn Khóa (Single Table Multi-role Sub-entities):

1. **`users` (Bảng Chân Thần Tổng Bức)**
   - Mọi thực thể từ con người trần gian (Customer, Admin) tạo Account đều phải ném thông tin cơ bản: Username, Password (Đã băm BCrypt mã hóa Mật mã 1 chiều - Hash Array), Email, Số điện thoại.
   - Cột Cờ Trạng Thái Sinh Tử: `status` (ACTIVE, INACTIVE, LOCKED, DELETED). Một cú Click `LOCKED` từ Giám Đốc sẽ phong tỏa tức thì mọi giao dịch vé mạo danh nhân viên.

2. **Dãy Sub-Entities Mở Rộng Liên Kết (1-To-1 Mapping Profiles)**
   - Tối ưu hóa Database Normalization, Tránh làm bảng Users bị Phình to (The Fat Table Anti-pattern):
   - **`driver_detail`:** Châm ngòi logic pháp luật (Giấy phép lái xe hạn bao lâu, Bằng dấu hạng C, D, E). 
   - **`admin_detail`** & **`customer_detail`**: Tách thuộc tính tùy chỉnh mở rộng riêng dạt sang một bên.

## 2. Đặc Tả Triển Khai Kiến Trúc Backend (Security Implementation)

Trái tim của hàng rào phòng ngự là Spring Security dệt kim với JWT (JSON Web Tokens).

### 2.1 Màng Nhện An Ninh Chặn Lọc Cổng Trước (Stateless API)
- Thiết lập Không phiên (Stateless SessionCreationPolicy). Container API từ bỏ bộ nhớ Cookies. Client phải chủ động kẹp Mã định danh Token vào cụm HTTP Authorization Bearer Title cho mọi gói dữ liệu.
- Phù hợp với Môi trường Mobile (App Tài xế) và Web App (React) hoàn toàn độc lập với Server.

### 2.2 Sơ Đồ Tiện Ích Cây Phân Quyền Vĩ Mô (`AppConstants.java`)
Bảo vệ nhạy cảm từng hàm, từng End-Points bằng Annotation vĩ mô `@PreAuthorize`.
- `HAS_ROLE_ADMIN`: Giao diện Cấp Tài Khoản Hệ Thống, Nắm Quyền Sinh Sát, Xóa Lịch Trình mẫu.
- `HAS_ROLE_STAFF`: Cho Phép thêm sửa vé, duyệt lệnh đổi Chuyến, gán Nhân Sự, cấu hình Phụ Lễ.
- `HAS_ROLE_DRIVER`: App chỉ có quyền trả về "Chuyến của Tôi (`/api/driver/trips/today`)". Khóa mõm Tài Xế truy cập thông tin kinh doanh nhà xe (Doanh thu nội vi).
- Luồng rẽ tắt Đăng Ký Chuyển Nhận: `/api/auth/register` (Tạo Tk GUEST) & `/api/auth/login`.

---

## 3. Bản Khoa Học Tối Ưu Màn Hình Quản Trị Hệ Thống Frontend UI/UX

Kiến trúc liên tục chấn điểm mạnh nhất qua khu vực Nhóm Tính Năng Trực Diện `(auth)` và `admin/users`.

### 3.1. Block Authentication Màn Hình Vào Khóa Tử Môn (`app/(auth)`)
- Thiết kế Component Auth Layout chuẩn chỉ nhập Mật khẩu/Use.
- **Kỹ Thuật Kéo Middleware (Khắc Nghiệt Yêu Ngôn):** Next.js ứng dụng Route Middleware. Khi File Token.txt lưu mảng `localStorage/Cookies` phát hiện tài khoản mang cờ báo Role `STAFF` $\rightarrow$ Nó sẽ Block (Chạm Đáy Tự Phát Cờ 403 Forbidden) chặn hắt không cho User nhảy vào thư mục `admin/users` (Nơi chỉ có Giám đốc ADMIN thao túng tài khoản).
- State Redux/Zustand: FE ngậm chặt JWT Payload, bóc tách chuỗi Token giải mã hiện lên khung viền User góc Header Avatar "Xin chào Điều Hành Viên Nguyễn Văn A".

### 3.2 Bàn Phím Hành Chuyết `admin/users`
- Màn hình dành riêng cho Tổng Quản Nguồn Lực. Lưới Component Ant Design table chia list Bảng Nhóm Staff, Nhân Viên Vé, Tài Xế, Khách Hàng.
- Hiển thị Chức năng Tạo Mới Cấp Account Phụ.
- Frontend Cảnh Báo "Đường Chỉ Đỏ" Khi Admin thao tác thay đổi Role hoặc thu hồi Account nhân sự. Action dội Modal Cảnh Báo Validation Form dội xuống `POST /api/admin/users`. Chuyên nghiệp hơn tất thảy một Website dạng đồ án tĩnh.

## 4. Tự Phản Biện Tổ Hợp Giao Diện (Critique Summary)

Identity Module không chỉ làm mỗi màn Log-In để ghi điểm, mà nó chứng minh bản Lề (Pivot Point) của một sản phẩm Enterprise-Ready. Nếu Backend chặn tốt mà Frontend lỏng lẻo vẽ bừa (Ai cũng thấy nút Tạo Giá, Xóa Tuyến) thì UX phế phẩm. Ngược lại, việc React / NextJS Middleware đồng bộ giấu màn hình đi theo Role (Role-based rendering elements) đã chứng minh kỹ năng Master song nguyên (Fullstack Engineer). Rào ngục này bao trọn vẹn điểm bảo vệ luận văn mảng "Tính An Toàn Của Mã Lệnh Giao Diện Khách".
