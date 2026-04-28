# Database Design (PostgreSQL)

## 1. Overview
Hệ thống sử dụng **PostgreSQL 15** làm hệ quản trị cơ sở dữ liệu chính. Schema được quản lý version qua Flyway (`V1__init_schema.sql`). Kiến trúc DB thiết kế theo hướng **Modular Monolith** kết hợp **Event Sourcing nhẹ** (qua bảng `audit_logs` dùng Trigger).

## 2. Table Architecture by Domain
Dựa vào script khởi tạo DB thực tế, các bảng được chia thành các nhóm chính sau:

### 2.1. Identity & Auth (Quản trị Người dùng)
- `users`: Bảng trung tâm lưu tài khoản, mật khẩu, và `employee_code` (Mã nhân viên công khai duy nhất). Có cột `version` cho Optimistic Locking.
- `user_roles`: Multi-role (1 user có nhiều quyền).
- **Sub-types (Dữ liệu chuyên biệt):** `admin_detail`, `staff_detail` (chứa `job_title` và `station_id`), `driver_detail` (hạn bằng lái), `customer_detail`.
- `refresh_tokens` & `user_devices`: Quản lý JWT refresh và Firebase Cloud Messaging (FCM).

### 2.2. Master Data & Catalog (Danh mục)
- `province` (Tỉnh thành), `bus_station` (Bến xe - có mã `gov_code`).
- `ticket_office`: Quầy vé (thuộc Bến xe hoặc đại lý ngoài).
- `departments`: Phòng ban (Cấu trúc cây cha/con qua `parent_id`).
- `depot`: Bãi đỗ xe (Độc lập hoàn toàn với Bến xe theo Luật).

### 2.3. Fleet & Planning (Đội xe & Kế hoạch)
- `bus_type`: Lưu định nghĩa loại xe. **Sơ đồ ghế (`seat_map`) được lưu dưới dạng `JSONB` array.**
- `bus`: Phương tiện vật lý (ODO, biển số, hạn đăng kiểm).
- `route`: Tuyến đường cố định.
- `pickup_point`: Các điểm dừng dọc đường (Order bằng `sequence_order`).
- `trip_schedule`: Lịch chạy mẫu. Dùng `operation_days_bitmap` (SmallInt) để lưu các ngày chạy trong tuần.

### 2.4. Core Operation (Vận hành & Điều độ)
- `bus_assignment`: **Ca xe** — Quản lý vòng đời xe từ khi xuất bãi (`start_depot_id`) đến khi nhập bãi (`end_depot_id`), theo dõi Fuel & ODO.
- `trip`: **Chuyến xe thực tế** — Sinh ra từ `trip_schedule`. Nối với `bus` và `bus_assignment`.
- `driver_assignment`: Phân công tài xế vào chuyến (Có vai trò `role` và ghế `seat_number`).
- `vehicle_handover`: Bàn giao xe giữa các tài xế (RECEIVE / RETURN).
- `trip_change_request`: Yêu cầu đổi xe/tài xế (Pre-approval workflow, có `urgency_zone`).

### 2.5. Sales & Pricing (Bán vé & Định giá)
- `booking`: Đơn đặt vé (Giữ chỗ 15 phút, trạng thái PENDING/CONFIRMED).
- `ticket`: Vé chi tiết. Liên kết 1-1 với 1 ghế trên 1 chuyến xe.
- `fare_config`: Cấu hình giá tĩnh (Theo Route + BusType + Date).
- `fare_policies`: Chính sách giá động (Refund/Discount). **Điều kiện (`conditions`) và Hành động (`action`) lưu bằng `JSONB`**.
- `refund_transactions`: Lịch sử hoàn tiền.

## 3. Database Patterns & Advanced Features

### JSONB cho Dữ liệu Động
Hệ thống tận dụng triệt để `JSONB` của PostgreSQL để tránh việc tạo quá nhiều bảng EAV (Entity-Attribute-Value):
- `bus_type.seat_map`: Mảng JSON sơ đồ ghế.
- `fare_policies.conditions` / `action`: JSON logic cấu hình giá.
- `staff_detail.attributes`: JSON lưu chứng chỉ, kpi của nhân viên.

### Centralized Audit Logging (Trigger-based)
Thay vì dùng Hibernate Envers (nặng và chậm), hệ thống tự viết hàm PL/pgSQL `log_audit_trail()`:
- Tự động bắt sự kiện `INSERT`, `UPDATE`, `DELETE`, `SOFT_DELETE`, `RESTORE`.
- So sánh `OLD` và `NEW` record.
- Chỉ lưu các trường thực sự thay đổi (`changed_fields` array) và giá trị vào bảng `audit_logs` dưới dạng `JSONB`.
- Bọc trong `EXCEPTION` block để lỗi log không làm crash transaction chính.

### Complex Constraints & Overlap Prevention
Database chịu trách nhiệm bảo vệ toàn vẹn dữ liệu thông qua các hàm PL/pgSQL Triggers khắt khe:
- `trg_check_seat_availability`: Ngăn Overselling (Bán trùng ghế đang được giữ bởi Booking khác).
- `trg_check_trip_overlap`: Ngăn một xe kẹt lịch chạy 2 chuyến cùng lúc.
- `trg_check_handover_overlap`: Chặn trùng lịch biên bản bàn giao xe.
- `trg_trip_assignment_bound_check`: Đảm bảo chuyến xe (`trip`) phải nằm gọn trong khung giờ của Ca xe (`bus_assignment`).
- Các `Partial Unique Index` cực kỳ phổ biến (ví dụ: `WHERE deleted_at IS NULL AND status = 'ACTIVE'`) để xử lý bài toán Soft-Delete.
