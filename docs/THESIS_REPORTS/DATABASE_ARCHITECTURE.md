# Kiến Trúc Cơ Sở Dữ Liệu (Database Architecture)

Hệ thống Bus Operation System sử dụng **PostgreSQL** làm hệ quản trị cơ sở dữ liệu quan hệ (RDBMS). Kiến trúc Database được thiết kế với chuẩn Normalized cao (3NF) nhưng vẫn linh hoạt sử dụng NoSQL-style (`JSONB`) ở một số cột đặc thù và các view/CTE để phục vụ nghiệp vụ Reporting cường độ cao. Cấu trúc được chia làm 5 Cụm Bảng (Table Clusters) chính:

## 1. Cụm Định Danh & Nhân Sự (Identity & HR)
Là nền tảng kiểm soát phân quyền và nhân lực.
- **`users`**: Bảng trung tâm chứa thông tin người dùng (Khách, Nhân viên, Tài xế). Mọi tài khoản đều có chung `id`.
- **`user_roles`**: Phân quyền hệ thống theo mô hình One-to-Many Muti-Role.
- Khai triển thực thể con (Sub-entities) liên kết 1-1 với `users`:
  - **`driver_detail`**: Lưu số bằng lái, hạng bằng lái (D, E, FC), ngày hết hạn.
  - **`staff_detail`**: Định danh nhân viên bán vé, điều hành thuộc phòng vé/bến xe. Thư viện sử dụng cột `attributes` (JSONB) linh hoạt lưu metadata mở rộng.
  - **`admin_detail`**, **`customer_detail`**: Điểm thưởng, cấp độ truy cập.
- **`departments`**: Sơ đồ tổ chức nhân sự hình cây (Parent-Child).

## 2. Cụm Master Data (Catalog)
Dữ liệu ít thay đổi, là xương sống của các giao dịch.
- **`province`** & **`bus_station`**: Bến xe luôn gắn liền với Tỉnh thành.
- **`ticket_office`**: Phòng vé gắn với Bến xe hoặc đại lý ngoài.
- **`depot`**: Bãi đỗ/Bảo dưỡng xe độc lập chuyên biệt.

## 3. Cụm Phương Tiện & Kế Hoạch (Fleet & Planning)
Quy định loại xe, tuyến đường và lịch chạy.
- **`bus_type`**: Chứa sơ đồ ghế tĩnh dưới dạng JSON (`seat_map`), cấu hình sức chứa.
- **`bus`**: Lưu thông số vật lý (ODO, Xăng), ràng buộc pháp lý `insurance_expiry_date`, `registration_expiry_date`.
- **`route`**: Tuyến đường (Bến đi - Bến đến).
- **`pickup_point`**: Các điểm đón trả nhỏ lẻ rải rác trên `route`.
- **`trip_schedule`**: Bộ khung thời gian (Schedule) lặp lại liên tục, sinh ra chuyến thực tế thông qua Job Trigger.
- Cấu hình giá tĩnh: **`fare_policies`** (Chính sách linh động), **`fare_config`** (Cấu hình giá chặn).

## 4. Cụm Điều Hành Chuyến (Operation & Action)
Chịu tải transaction lớn nhất do cập nhật theo thời gian thực (Real-time tracking).
- **`trip`**: Chuyến xe thực tế, sinh ra từ `trip_schedule`. Theo dỏi Trạng thái: SCHEDULED → RUNNING → COMPLETED.
- **`driver_assignment`**: Mapping `N-N` giữa `users (driver)` và `trip`. Ràng buộc luật làm việc.
- **`bus_assignment`**: Gắn `bus` vào các `depot` xuất bãi và nhập bãi.
- **`vehicle_handover`**: Lưu biên bản bàn giao xe (số km, nhiên liệu).
- **`trip_change_request`**: Điểm nghẽn xử lý thay đổi bất thường (5 Vùng thời gian: Khẩn, Cấp, Sự cố).
- **`driver_trip_log`**: Nhật ký số giờ cầm vô lăng của tài xế. (Đảm bảo < 10h/ngày theo Luật Giao Thông).

## 5. Cụm Kinh Doanh (Sales, Booking & Payment)
Dữ liệu mang lại doanh thu.
- **`booking`**: Đơn hàng giữ chỗ. Liên kết khóa ngoài với `users` (nếu có tài khoản) hoặc lưu Data trần (`guest_name`, `guest_phone`). Gắn biến Timeout khóa tài nguyên.
- **`ticket`**: Ánh xạ 1 Đơn hàng - Nhiều Vé. Gắn trực tiếp vào `trip` và `pickup_point`.
- **`payment_history`**: Phiếu thu, giao dịch VNPAY/MoMo.
- **`refund_transactions`**: Giao dịch hoàn hủy, chiết khấu và tự động cộng dồn doanh thu lệch.

## 6. Cơ Chế Đặc Trưng & Tối Ưu
- **Partial Unique Index**: Được áp dụng (vd: `booking`, `ticket`) dùng cú pháp `WHERE deleted_at IS NULL` để dọn đường cho thuật toán Khóa ghế độc quyền nhưng vẫn duy trì Soft-Delete.
- **Optimistic Locking**: Bảng quan trọng (`booking`, `trip`, `bus`, `users`) sở hữu trường `version` tự tăng để ngăn chặn xung đột (Deadlock/Lost update) trong môi trường xử lý đồng thời (Concurrent Bookings).
- **JSONB Column**: Gói gọn thuộc tính động vào CSDL (Ví dụ sơ đồ ghế `seat_map`, đặc quyền `action` của Voucher...) giúp tránh Over-Normalization gây phình bảng không cần thiết.
- **Trigger Tự Động**: Auto-Logging cho Bảng Audit Log, truy vết người dùng tạo/xóa bản ghi.
