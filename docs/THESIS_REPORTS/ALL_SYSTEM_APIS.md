# Toàn Bộ Hệ Thống Cổng Lập Trình (All System APIs)

Tài liệu này liệt kê toàn bộ các API Endpoints được trích xuất trực tiếp từ các `@RestController` trong dự án Backend Spring Boot. Danh sách này bao quát 100% các thao tác có thể thực hiện trên ứng dụng, không tính đến việc giao diện Frontend đã vẽ hay chưa. 

> **Lưu ý:** Các endpoint thường có Prefix là `/api/v1` hoặc `/api` tùy nhánh. Trong danh sách dưới, quy ước sử dụng `/api` làm Root Path.

## 1. Module Catalog (Danh Mục)
Chịu trách nhiệm ở `ProvinceController`, `StationController`, `TicketOfficeController`, `DepotController`.

* **Tỉnh/Thành phố (`/api/catalog/provinces`)**
  - `GET /` — Lấy danh sách toàn bộ Tỉnh (kèm filter/search).
  - `POST /` — Phân bổ một Tỉnh/Thành phổ mới.
  - `DELETE /{id}` — Vô hiệu hóa phân bổ.
* **Bến xe (`/api/catalog/stations`)**
  - `GET /` — Lấy toàn bộ bến xe nội hạt.
  - `POST /` — Thêm bến mới.
  - `DELETE /{id}` — Xóa bến xe.
* **Bãi chứa/Trạm sửa chữa (`/api/catalog/depots`)**
  - `GET /` — Lấy danh sách bãi đỗ xe.
  - `POST /` & `PUT /{id}` & `DELETE /{id}` — CRUD Bãi xe.
* **Phòng Về Đặt Chỗ (`/api/ticket-offices`)**
  - `GET /`, `POST /`, `PUT /{id}`, `DELETE /{id}`.

## 2. Module Fleet (Đoàn Xe)
Nằm ở `BusController` và `BusTypeController`.

* **Phương tiện (`/api/fleet/buses`)**
  - `GET /` — Liệt kê toàn bộ xe theo filter (Biển số, số khung...).
  - `POST /` — Cập nhật xe mới vào mảng với đầy đủ hạn thẻ kiểm định.
  - `PUT /{id}` — Cập nhật xe.
  - `DELETE /{id}` — Xóa mềm một phương tiện đang hỏng/thanh lý.
* **Chuẩn hình xe & Sơ đồ ghế (`/api/fleet/bus-types`)**
  - `GET /`, `GET /{id}`, `POST /`, `PUT /{id}`, `DELETE /{id}`.

## 3. Module Planning (Kế Hoạch & Lịch Trình)
* **Tuyến Đường (`/api/planning/routes`)**
  - `GET /`, `POST /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`.
  - `GET /trash`, `POST /{id}/restore` — Khôi phục Tuyến đã khóa.
* **Đăng Ký Khai Thác Mở Tuyến (`/api/routes/{routeId}/registrations`)**
  - `POST /` — Thêm sổ tuyến.
  - `GET /` & `GET /history` — Tra cứu lịch sử.
  - `PUT /{regId}/revoke` — Thu hồi giấy phép một xe.
* **Lịch Trình Mẫu (`/api/planning/schedules`)**
  - `GET /`, `POST /`, `GET /{trash}`, `PUT /{id}`, `DELETE /{id}`, `POST /{id}/restore`.
* **Gán Xe Vào Một Mẫu Kế Hoạch (`/api/schedules/{scheduleId}/bus-types`)**
  - `POST /`, `GET /`, `GET /history`, `PUT /{sbtId}/end`.

## 4. Module Operation (Điều Hành Lõi - Cốt Lõi Dự Án)
Mạch đi từ tạo chuyến $\rightarrow$ Gán Tài/Xe $\rightarrow$ Xử lý dọc đường $\rightarrow$ Quẹt bàn giao.

* **Sinh Chuyến Động (`/api/operation/trips/generate`)**
  - `POST /` — Request hệ thống auto-gen theo khoảng thời vụ.
* **Quản Lý Chuyến Chạy (`/api/operation/trips`)**
  - `GET /search` — Bộ lọc đa chiều tổng quan trên App cho khách/staff.
  - `GET /{id}` — Trả về mọi thuộc tính trong CSDL chuyến.
  - `POST /{id}/approve` — Mở bán Booking.
* **Resource - Tài nguyên tại Bến (`/api/operation/resources/...`)**
  - `GET /available-buses` — Lọc xe rảnh Depot A.
  - `GET /available-drivers` — Lọc tài xế rảnh, không bị nhốt ca.
* **Assignment - Quản trị Nhập Ca (`/api/operation/...`)**
  - `PATCH /trips/{id}/assignment` — Gán cứng 2 tài/1 xe.
  - `PUT /trips/{id}/reassign-driver` — Thuật toán bắt chết (Deadlock) đổi người bằng người.
* **Quy Trình Khẩn Cấp Báo Lỗi Chuyến (`/api/operation/trip-changes`)**
  - `POST /` — Lệnh Trigger mở Zone xét duyệt 5 Cấp.
  - `POST /incident` — Kích hoạt Zone 5 (Đang chạy hỏng).
  - `POST /{id}/approve` & `/{id}/reject` & `/{id}/review` & `/{id}/rollback`.
  - `GET /compliance/driver/{driverId}` & `GET /compliance/check` — Luồng kiểm tra tuân thủ Giờ làm luật VN.
* **Bàn Giao Trách Nhiệm Xe (`/api/operation/handovers`)**
  - `POST /` — Confirm.
  - `GET /history` — Quẹt lịch sử check km.
* **Nhìn Từ App Tài Xế (`/api/driver/trips/today`)**
  - `GET /` — Load chuyến sắp tới chỉ cho Driver ID này.

## 5. Module Pricing (Áp Giá)
* **Giá Gốc (`/api/pricing/fares`)**
  - `POST /upsert` — Thiết lập mới/Ghi đè.
  - `GET /active` & `GET /` — Truy thu mốc giá.
* **Chính Sách Lạm Phát/Trợ Giá Lễ Mùa (`/api/pricing/policies`)**
  - `GET /`, `POST /`, `PUT /{id}`, `DELETE /{id}`.

## 6. Module Sales (Vé Giao Dịch)
Phân nhánh mạnh phục vụ giao tiếp Public Guest và Private Local.

* **Booking Master (`/api/bookings`)**
  - `POST /` — Lock Ghế, Nhả mã PNR.
  - `GET /{code}` — Chiết suất PNR detail.
  - `POST /{code}/confirm` — Hook đánh giá lại.
  - `GET /search` — Cổng tra mã vé cho trang Web.
  - `GET /` — All List (Cho Admin).
* **Nghiệp vụ Hủy Toàn Phần hoặc Từng Phần**
  - `POST /{id}/cancel` — Hủy Booking nội vi.
  - `POST /public/{code}/cancel` — Hủy nặc danh qua Web Guest + OTP.
  - `POST /{bookingId}/cancel-tickets` — Xóa bớt vé trong chuỗi (Ví dụ đặt 3 giường giường).
  - `POST /tickets/{ticketId}/cancel` & `POST /public/.../cancel`.
* **Kênh Khách Quen (`/api/me`)**
  - `GET /bookings` — Khách login load lịch sử bay bản đồ.

## 7. Module Payment (Thu Ngân)
* **API Xử Lý Tiền**
  - `GET /payment/methods` — Kênh cho phép VNPAY/MoMo.
  - `POST /payment/vnpay/create-payment` — Chuyển IP Gateway Bank.
  - `GET /payment/vnpay/return` — WebHook nghe Bank nhả lệnh Update Booking (`SUCCESS`).

## 8. Module Reports (BI Center)
* **Truy xuất CSDL Báo Cáo (`/api/reports`)**
  - `GET /revenue` — Biểu đồ phân cấp doanh thu tuyến, tiền gộp ròng.
  - `GET /load-factor` — Biểu đồ Capacity lấp đầy hệ thống.

## 9. Module Identity (Xác Thực)
* **Bảo Mật Gateway**
  - `POST /api/auth/login` — Trả JWT Token theo username/pass.
  - `POST /api/auth/register` — Đăng ký Public App.
  - `POST /api/auth/fcm-token` — Trích luồng dữ liệu thông báo App.
* **HR Manager (`/api/admin/users`)**
  - `POST /` — Cấp Account mới.
