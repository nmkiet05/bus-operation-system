# 🚀 CHECKLIST DỰ ÁN BOS - 60 NGÀY
> **Ngày bắt đầu**: 27/01/2026
> **Ngày kết thúc dự kiến**: 27/03/2026
> **Cập nhật lần cuối**: 27/01/2026

---

## 🟢 GIAI ĐOẠN 1: KHỞI TẠO & NỀN TẢNG HẠ TẦNG (Ngày 1-7)
**Mục tiêu**: Server chạy, Database chuẩn, Deploy được bản rỗng lên Cloud.

### Ngày 1-2: Hạ tầng & Database
- [x] Cài đặt Docker Desktop & Postman
- [x] Khởi tạo Project Spring Boot (Maven, Java 21)
- [x] Chạy script Flyway `V1__init_schema.sql` (Bản Final)
- [x] Kiểm tra (Verify): Kiểm tra DB có đủ bảng `user_devices`, `fare_policies` và các Trigger

### Ngày 3-5: Bảo mật & Xác thực cho Mobile
- [x] Cấu hình BaseEntity (created_at, updated_at, version)
- [x] Cấu hình Spring Security: Đăng nhập trả về JWT (Access + Refresh) dạng JSON (`AuthController` đã có)
- [x] Viết API `POST /api/auth/fcm-token` (Chờ sẵn cho Mobile)
- [x] Viết `GlobalExceptionHandler` (Bắt lỗi Trigger DB trả về tiếng Việt)
- [x] **[REFACTOR]** Tách module `auth` thành `identity` và `hr` (Kiến trúc DDD)
- [x] **[ENTITY]** Tạo Entity `Department` (Phòng ban) & cấu trúc phân cấp (Cha/Con)
- [x] **[ENTITY]** Tạo Entity `AdminDetail` và liên kết với User/Department

### Ngày 6-7: Swagger & Triển khai sớm
- [x] Cấu hình Swagger UI (OpenAPI 3.0) (đã cấu hình, có `@Tag` trên các Controller)
- [x] **[CHIẾN LƯỢC]** Deploy bản "Hello World" lên Render/Railway
- [x] Kết nối ứng dụng trên Cloud với Database trên Cloud (Supabase/Neon/Railway DB)

---

## 🟡 GIAI ĐOẠN 2: LOGIC CỐT LÕI & QUẢN TRỊ (Ngày 8-20)
**Mục tiêu**: Có dữ liệu Xe, Tuyến, Lịch chạy để hiển thị.

### Ngày 8-10: Đội xe & Dữ liệu danh mục
- [x] API CRUD Province (Tỉnh/Thành phố) - ✅ Đầy đủ: POST, GET, PUT, DELETE (Đã kiểm tra 28/01)
- [x] API CRUD Bus Station (Bến xe) - ✅ Đầy đủ: POST, GET, PUT, DELETE (Đã kiểm tra 28/01)
- [x] API CRUD Bus Type (Loại xe) - ✅ Đầy đủ: POST, GET, PUT, DELETE (Đã tạo dữ liệu mẫu)
- [x] API CRUD Bus (Xe khách) - ✅ Đầy đủ: GET, POST, PUT, DELETE (Đã tạo dữ liệu mẫu)
- [x] **[TỐI ƯU]** Dùng thư viện `json-schema-validator` để validate JSON `seat_map` đầu vào

### Ngày 11-13: Tuyến đường & Giá vé (Logic Phức tạp)
- [x] API CRUD Route (Tuyến đường) - ✅ Đầy đủ: GET, POST, PUT, DELETE, GET/{id}
- [x] Logic `FareConfig` (Lưu lịch sử giá vé - SCD Type 2) - ✅ `upsertFare()`, `getActiveFare()`
- [x] API CRUD Fare Policies (Chính sách giá) - ✅ `FarePolicyController` có
- [ ] **[NÂNG CAO]** Dùng JPA Specification cho API Tìm kiếm Tuyến (Lọc: Giờ, Giá, Loại xe)

### Ngày 14-18: Vận hành & Điều độ (Trái tim hệ thống)
- [x] API CRUD Trip Schedule (Lịch chạy cố định) - ✅ `TripScheduleController` có đủ POST, GET, PUT, DELETE
- [x] Logic sinh chuyến tự động từ TripSchedule (theo Bitmap ngày) - ✅ `POST /generate`
- [x] API CRUD Ticket Office (Văn phòng/Đại lý) - ✅ Controller, Service, Repository đã xong
- [x] Logic Điều độ: Gán Xe/Tài xế (Trigger DB sẽ chặn nếu trùng) - ✅ Đã có API `PATCH /assignment`
- [x] API Vehicle Handover (Bàn giao xe) - ✅ Đã xong (Controller/Service/Entity)
- [ ] **[TEST]** Kiểm tra kịch bản tránh Deadlock (Gán lỗi -> Hủy gán -> Gán thành công)
- [ ] **[LEGAL]** Cài đặt xác thực Đăng ký xe & Bằng lái tài xế
- [x] Logic Check in Service (Giới hạn lái tối đa 4h/10h) - ✅ `DriverDutyService`
- [ ] **[SCHEMA]** Bắt buộc NOT NULL các trường pháp lý (Đăng kiểm, Bảo hiểm, Ngày cấp bằng)
- [x] **[CLEAN CODE]** Chuẩn hóa AppConstants & Enums (Phân tách nghiêm ngặt)
    - Liên kết Enum vào Entity (`Trip` ✅, `Bus` ✅)
- [x] **[CLEAN CODE]** Chuẩn hóa Quy tắc đặt tên (`ProvinceController`, `StationController`, `BusServiceImpl`)
- [ ] **[TEST]** Viết Unit Test cho hàm `checkScheduleOverlap` (Java Level) - Bỏ qua, dùng Integration Test
- [x] Viết API `GET /api/driver/trips/today` (Rút gọn cho Mobile) - ✅ `DriverController`
- [x] Logic check thời gian lái xe (max 4h liên tục, 10h/ngày - theo Luật GTĐB) - ✅ `DriverDutyService`
- [x] **[CODE QUALITY]** Rà soát lỗi Null Safety & Thiếu Mapper (User, Staff, Handover) - ✅ Đã fix toàn bộ

### Ngày 19-20: Rà soát & Tối ưu
- [x] Rà soát lại Hiệu năng các câu Query
- [x] Test thử việc Insert trùng lịch để đảm bảo Trigger DB hoạt động
- [x] Kiểm tra log `gov_data_transmission` (chuẩn bị cho gửi GPS)

---

## 🟠 GIAI ĐOẠN 3: WEB CLIENT & CÔNG CỤ ĐẶT VÉ (Ngày 21-35)
**Mục tiêu**: Luồng bán vé hoàn chỉnh trên Web Admin.

### Ngày 21-23: Nền tảng Frontend (Next.js)
- [ ] Dựng Layout Admin (Dashboard)
- [ ] Dựng Layout Client (Trang chủ tìm chuyến)
- [x] Tích hợp API Tìm kiếm chuyến xe - ✅ `TripController.getTrips` đã hỗ trợ lọc theo Tỉnh
- [ ] Hiển thị danh sách chuyến theo ngày

### Ngày 24-28: Sơ đồ ghế Trực quan & Thời gian thực
- [ ] Vẽ sơ đồ ghế từ JSON `seat_map` lên màn hình Web (Grid/Flexbox)
- [ ] Hiển thị trạng thái ghế: `AVAILABLE` (Trống), `LOCKED` (Đang giữ), `BOOKED` (Đã đặt)
- [ ] **[TÍNH NĂNG WOW]** Tích hợp WebSocket (STOMP): Ghế đổi màu ngay lập tức khi User khác chọn

### Ngày 29-32: Đặt vé & Giữ chỗ (Kỹ thuật cao)
- [ ] **[TỐI ƯU]** Dùng thư viện Redisson để xử lý Khóa phân tán (Distributed Lock - Giữ ghế 5 phút)
- [ ] Xử lý Transaction Atomic (Tạo Booking + Ticket cùng lúc)
- [ ] Xử lý tranh chấp dữ liệu bằng `@Version` (Optimistic Locking)
- [ ] API `POST /api/bookings` - Tạo đơn đặt vé
- [ ] API `GET /api/bookings/{code}` - Tra cứu đơn
- [ ] Logic hết hạn Booking (`expired_at`)
- [ ] **[SIMPLE]** Dashboard Điều độ: Hiển thị danh sách chuyến + tỉ lệ lấp đầy real-time

### Ngày 33-35: Hoàn tiền & Thanh toán
- [ ] **[CÔNG CỤ]** Cài đặt Ngrok để public localhost (Test VNPay IPN)
- [ ] Tích hợp VNPay Sandbox
- [ ] API `POST /api/payments/vnpay/create` - Tạo link thanh toán
- [ ] API `GET /api/payments/vnpay/callback` - Xử lý IPN
- [ ] Logic Hủy vé & Hoàn tiền tự động theo RefundPolicy
- [ ] Lưu `refund_transactions` với đúng hạng mục
- [ ] **[MOCK]** Tạo PDF Template hóa đơn từ HTML (Thymeleaf/iText)
- [ ] API `GET /api/tickets/{id}/invoice` - Trả về PDF hóa đơn mẫu

---

## 🔵 GIAI ĐOẠN 4: ỨNG DỤNG FLUTTER (Ngày 36-48)
**Mục tiêu**: App Mobile "thừa hưởng" API để chạy nhanh.

### Ngày 36-38: Cài đặt & App Tài xế (Phần 1)
- [ ] Khởi tạo Project Flutter (GetX hoặc Bloc)
- [ ] Màn hình Đăng nhập (Lưu Token vào Secure Storage)
- [ ] **[CHIẾN LƯỢC]** Dùng Mock Data (Dữ liệu giả) để vẽ xong UI "Lịch chạy" & "Chi tiết chuyến" thật nhanh
- [ ] Cấu hình FCM (Firebase Cloud Messaging)

### Ngày 39-41: App Tài xế (Phần 2 - QR & Bàn giao)
- [ ] Thay thế Mock Data bằng API thật (`/api/driver/trips/today`)
- [ ] Tích hợp Camera: Quét QR Code vé khách -> Gọi API Check-in
- [ ] API `POST /api/tickets/{id}/check-in`
- [ ] Màn hình Bàn giao xe (`vehicle_handover`)
- [ ] Màn hình cập nhật Odometer (số km)

### Ngày 42-46: App Khách hàng (Đặt vé rút gọn)
- [ ] Tái sử dụng logic tìm vé của Web
- [ ] Màn hình tìm kiếm chuyến xe
- [ ] Chọn ghế (Dùng GridView đơn giản hơn Web)
- [ ] Màn hình xác nhận đặt vé
- [ ] Màn hình "Vé của tôi" (Hiển thị QR Code)
- [ ] Lưu FCM Token khi đăng nhập

### Ngày 47-48: Testing Mobile
- [ ] Chạy thử trên Android Emulator
- [ ] Build file `.apk` debug để cài thử lên máy thật
- [ ] Test luồng: Đặt vé -> Thanh toán -> Nhận QR -> Check-in

---

## 🟣 GIAI ĐOẠN 5: THÔNG BÁO & NÂNG CAO (Ngày 49-54)
**Mục tiêu**: Kết nối hệ thống & Báo cáo.

### Ngày 49-51: Hệ thống Thông báo Kép
- [ ] **[CÔNG CỤ]** Tích hợp Telegram Bot: Báo tin cho Admin khi có Booking mới/Lỗi 500
- [ ] Tạo Bot Telegram, lưu Token vào config
- [ ] **[MOBILE]** Tích hợp Firebase (FCM): Bắn thông báo xuống App Khách & Tài xế
- [ ] Thông báo nhắc chuyến xe (trước 2 tiếng)
- [ ] Thông báo khi Trip bị hủy

### Ngày 52-54: Báo cáo & Compliance (Mock GPS)
- [ ] Cấu hình Redis Cache cho các API danh mục (Tỉnh, Bến)
- [ ] **[MOCK]** Job giả lập gửi GPS: In log định dạng bản tin TCĐB
- [ ] API Báo cáo doanh thu theo tuyến/ngày (SQL Aggregation)
- [ ] API Báo cáo tỉ lệ lấp đầy (Occupancy Rate) theo chuyến
- [ ] **[SIMPLE]** Dashboard Admin: Hiển thị 3 biểu đồ cơ bản (Chart.js)
- [ ] API Xuất báo cáo Excel/PDF danh sách hành khách (Manifest)

---

## 🔴 GIAI ĐOẠN 6: ĐÓNG GÓI & BẢO VỆ (Ngày 55-60)
**Mục tiêu**: Mọi thứ sẵn sàng để Demo.

### Ngày 55-56: Triển khai Cuối cùng
- [ ] Docker hóa Backend (`Dockerfile` + `docker-compose.yml`)
- [ ] Docker hóa Web Frontend
- [ ] Deploy bản cuối cùng lên Cloud (Render/Railway)
- [ ] Build file `.apk` bản Release (Signed - Đã ký)
- [ ] Cấu hình SSL/HTTPS cho tên miền

### Ngày 57-58: Tài liệu hóa
- [ ] Vẽ lại ERD bản cuối cùng khớp với code
- [ ] Viết Tài liệu API (Postman Collection hoặc Swagger export)
- [ ] Chụp ảnh màn hình đẹp của Web & App đưa vào Slide
- [ ] Viết `README.md` hướng dẫn cài đặt
- [ ] Chuẩn bị Slide thuyết trình

### Ngày 59-60: Tổng duyệt (Rehearsal)
- [ ] **[DEMO 1]** Kịch bản Real-time: 2 tab Web + 1 App điện thoại cùng chọn ghế
- [ ] **[DEMO 2]** Kịch bản Hủy vé hoàn tiền theo chính sách
- [ ] **[DEMO 3]** Kịch bản Quét QR Code check-in
- [ ] **[DEMO 4]** Kịch bản nhận thông báo FCM trên điện thoại
- [ ] Tập thuyết trình 2-3 lần
- [ ] Backup code lên GitHub (tag `release v1.0`)

---

## 📊 TIẾN ĐỘ TỔNG QUAN

| Giai đoạn | Trạng thái | Hoàn thành |
| :--- | :--- | :--- |
| **Phase 1: Hạ tầng** | ✅ Gần xong | 7/11 |
| **Phase 2: Logic Cốt lõi** | ✅ Gần xong | 17/18 (+1 Code Quality xong) |
| **Phase 3: Web & Đặt vé** | ⬜ Chưa bắt đầu | 1/20 |
| **Phase 4: App Flutter** | ⬜ Chưa bắt đầu | 0/18 |
| **Phase 5: Thông báo** | ⬜ Chưa bắt đầu | 0/9 |
| **Phase 6: Đóng gói** | ⬜ Chưa bắt đầu | 0/15 |

**TỔNG**: 25/90 (~28%)

---

## 📝 GHI CHÚ QUAN TRỌNG

### 🏷️ Ký hiệu
- `[ ]` Chưa hoàn thành
- `[/]` Đang thực hiện
- `[x]` Đã hoàn thành

### 🔖 Tags đặc biệt
- **[CHIẾN LƯỢC]**: Quyết định quan trọng ảnh hưởng toàn dự án
- **[TỐI ƯU]**: Cải tiến hiệu năng hoặc chất lượng code
- **[NÂNG CAO]**: Kỹ thuật phức tạp, cần nghiên cứu thêm
- **[TÍNH NĂNG WOW]**: Tính năng ấn tượng cho demo
- **[TEST]**: Cần viết test
- **[CÔNG CỤ]**: Cần cài đặt công cụ bên ngoài
- **[MOBILE]**: Liên quan đến App Flutter
- **[MOCK]**: Giả lập thay vì tích hợp thật (cho môn học)
- **[SIMPLE]**: Giải pháp đơn giản, tránh over-engineering

### ⚖️ Văn bản pháp luật cần tuân thủ
- **NĐ 10/2020/NĐ-CP**: Lệnh vận chuyển điện tử
- **NĐ 123/2020/NĐ-CP**: Hóa đơn điện tử
- **NĐ 13/2023/NĐ-CP**: Bảo vệ dữ liệu cá nhân
- **Luật GTĐB 2008**: Thời gian lái xe tối đa
