# Kiến Trúc Bảo Mật & Hiệu Năng (Security & Performance)

Với hệ thống Core Operation và Bán vé thời gian thực, yếu tố bảo vệ dữ liệu (Privacy) và chịu tải cường độ cao (High Performance) là bắt buộc hiện diện xuyên suốt.

## 1. Cơ Chế Bảo Mật & Xác Thực (Security Architecture)

### Stateless Authentication (JWT API)
* Ứng dụng mô hình **Token-based Authentication (JWT)** thay vì Cookie/Session cổ điển. Module `Identity` được thiết kế Stateless để chịu tải cao qua các Container siêu nhỏ (Micro-services logic).
* Có cơ chế **Refresh Token**: Access Token được cấp phát vòng đời siêu ngắn (nhằm giảm thiểu rủi ro Token bị đánh cắp). Refresh Token được mã hóa dưới PostgreSQL để sẵn sàng xoay vòng.

### Phân Quyền Vai Trò (RBAC - Role Based Access Control)
* Kiểm soát đầu vào API chặng thông qua annotation Spring Security: `@PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)`.
* Dữ liệu trả về Frontend theo đúng cây phân quyền JWT Payload: Khách hàng chỉ xem được Profile (My Bookings) của mình. Driver chỉ thấy Trip của chính Driver.

### Optimistic Locking Khóa Ghế Giữ Chỗ
* Sử dụng trường `@Version version` tại database đối với Vé xe (Ticket). Khi 2 người ở 2 Session khác nhau cùng cố gắng giật một ghế A1 trống trên Frontend: Trình tự DB sẽ lưu người tới trước, đẩy version của dòng ghế A1 từ `0` lên `1`. Object thứ hai nếu cố đẩy lệnh INSERT sẽ bị ném lỗi `ObjectOptimisticLockingFailureException` (Thất bại cập nhật) và báo *"Ghế vừa bị người khác mua"*. Tránh hoàn toàn Deadlock cho Server Database.

## 2. Giải Pháp Tối Ưu Hiệu Năng (Performance Boosting)

### Xử Lý Truy Vấn Siêu Nặng bằng CTE & Native SQL
Ở module **Reports (Doanh thu & Tổng hợp Số ghế)**, Hibernate JPA ORM thể hiện điểm yếu vì N+1 queries khi join quá nhiều bảng (Tickets x Bookings x Trips x FareConfig).
* **Giải pháp:** Bỏ qua JPA, dùng `NamedParameterJdbcTemplate`. Viết các siêu truy vấn sử dụng **CTE (Common Table Expressions - Mệnh đề WITH)** và `FULL OUTER JOIN` của PostgreSQL: Gom cụm Data lại một cục ngay tại Memory của DB trả ngược về 1 ResultSet DUY NHẤT. Giảm số lượng network calls giữa API và DB từ hàng chục lần xuống còn đúng 1 thao tác (Query Time từ hàng chục giây xuống ~5-15ms).

### Cơ Phế Partial Unique Index 
Giúp tái sử dụng lịch sử thay vì Xóa cứng. Khi hủy chuyến bay/vé xe, hệ thống không DELETE mà chuyển thành `Soft-delete (deleted_at IS NOT NULL)`.
* Để đảm bảo các lần đặt ghế tương tự sau này không bị vi phạm Unique Constraints SQL (Cấm trùng Số Ghế trên Số Trip), hệ thống chạy chỉ mục một phần: `CREATE UNIQUE INDEX ticket_active_seat_idx ON ticket(...) WHERE status NOT IN ('CANCELLED', 'EXPIRED')`. Vừa tối ưu tốc độ đọc (Read Index) vừa đảm bảo độ sạch (Durability) của CSDL nghiệp vụ.

### Kiến Trúc Dependency Injection
Thay thế logic tính toán cứng bằng các Resolver/Strategy pattern (Thể hiện qua `TripChangeResolver`). Điều này giúp rẽ nhánh các kịch bản 5 Vùng khẩn cấp mà không làm phình `TripChangeService`, tối ưu hóa Call Stack trên JVM RAM.
