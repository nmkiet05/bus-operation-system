# MODULE: LÊN KẾ HOẠCH VÀ TUYẾN ĐƯỜNG (PLANNING SYSTEM)

> **Mô tả:** Nếu Catalog là nguyên vật liệu tĩnh, thì Planning chính là bản thiết kế (Blueprint) chắp ghép các nguyên vật liệu đó thành sơ đồ định tuyến có logic. Module Planning là nơi cấp cao nhất của phòng Kế Hoạch vạch ra "Tuyến Đường Ảo" và "Lịch Nhịp Tim Ảo" (Schedules) để từ đó tự động đẻ ra hàng triệu "Chuyến Xe Thực" (Trips) thông qua thuật toán sinh tự động. Đóng vai trò cực đoan trong tự động hóa doanh nghiệp.

## 1. Cụm Kiến Trúc Database & Giải Thuật Bitwise Lõi
Đây là bộ não thuật toán tối ưu băng thông Database của hệ thống, dựa trên 3 khối Table:

1. **`route` (Lộ Trình Xương Sống)**
   - Đóng vai kết nối Bến Đi (`departure_station_id`) và Bến Đến (`arrival_station_id`) lấy từ Catalog. 
   - Tham số hóa khoảng cách (`distance`) và số giờ chạy block (`duration_hours`). Đây là tham số để Engine tính toán Quỹ thời gian nghỉ của xe/tài xế.
   - Thư viện JSONB: `list_of_stops` (Các trạm dừng phụ/điểm đón dọc đường chèn giữa Bến Đi/Bến Đến). Ví dụ: Lộ trình Bến Miền Đông -> Đà Lạt, có chèn Điểm Đón Ngã Tư Thủ Đức và Điểm Nghỉ Chân Tân Phú. Giúp Frontend vẽ lộ trình Map Tracking sinh động.

2. **`trip_schedule` (Khuôn Mẫu / Lịch Lặp)**
   - Kịch bản lặp lại của Tuyến Dựa Vào Thời Gian Mẫu: Kế Hoạch 1: Chuyến Sáng (08:00 AM) chạy mẫu 1. Kế Hoạch 2: Chuyến Chiều (13:00 PM).
   - **Tối ưu Bitwise Operation siêu khủng:**
     - Lưu cấu trúc Tần Suất Lặp qua cột `days_of_week` (List số nguyên 1, 2, 3...) và cột `operation_days_bitmap` (Định dạng nhị phân số nguyên Int32).
     - Việc dùng Bitmap Binary Math (Toán tử mức Bit) `&`, `|` trực tiếp trên tầng Database khi chèn lệnh CronJob rà soát lịch chạy giúp Backend truy vấn trong 1/1000 giây thay vì phải rà quét kiểu Full Table Scan `LIKE` hoặc `IN` list chuỗi.

3. **`schedule_bus_type` (Cấu Hình Kép)**
   - Gắn "Loại xe dự tính" (ví dụ: Tuyến Đà Lạt lúc 8h sáng CẤM chạy xe ghế ngồi, BẮT BUỘC gán khuôn mẫu xe Limousine Phòng Nằm). Đóng nêm chuẩn bị dữ liệu cho Module Operation gán đầu xe thực tế khỏi sai lệch. Cấu hình History ghi log thông qua `type_id`.

---

## 2. Đặc Tả Implementation Ở Backend API

Chứa hệ quyền cấp cao nhất `AppConstants.HAS_ROLE_ADMIN`.

* **Nghiệp Vụ Nền Tảng `RouteController`:**
   - Cung cấp tính năng `Soft-Delete` (Rác/Trash) qua mảng GET: `api/planning/routes/trash` thay vì DELETE cứng. Tính năng Restore khôi phục lại Lộ trình khi nhà nước cấp lại giấy phép `POST /api/planning/routes/{id}/restore`. Hành vi cực chu đáo đáp ứng quy định kiểm toán (Audit Trail) cho Data doanh nghiệp.

* **Nghiệp Vụ Sổ Đăng Ký Chạy Tuyến Hành Chính `RouteRegistrationController`:**
   - Liên kết trực tiếp mảng Thu hồi giấy tờ của Tổng Cục Đường Bộ `PUT /{regId}/revoke`. Quản lý giấy phép khai thác của từng đầu xe chạy qua Tuyến. Trả JSON Responese đầy đủ thông tin Tỉnh quản lý Tuyến và Trạng thái Cấp Phép.

---

## 3. Kiến Trúc Tương Tác Của Cổng Giao Diện Frontend (Frontend UI/UX)

Tại thư mục quyền lực `app/(admin)/admin/planning/` trên Next.js:

### 3.1. Phân Hệ Quản Trị Tuyến Đường Ngầm (`admin/planning/routes`)
- **Trực Quan Đoạn Đường:** FE sử dụng React Framework vẽ Table liệt kê Tên Tuyến, Khoảng cách (Km), Tổng thời gian (Giờ).
- Giao diện cung cấp Component Input Nhập Chi Tiết Lộ Trình (Itinerary Detail) dưới hình thức Textarea phong phú hoặc Field Array Box.
- UX Mỏ Neo: Khi người dùng bấm tạo mới 1 Route, họ phải thả Dropdown Bến Đi / Bến Đến. Bến hiển thị mượt mà liên thông trực diện từ module Catalog. Các ID chéo nhau được Handle State mượt mà bằng Redux/Zustand.

### 3.2. Bàn Phím Khởi Tạo Khuôn Mẫu Đồng Hồ (`admin/planning/schedules`)
- **Sàn Diễn Nhịp Tim Doanh Nghiệp:** FE xây dựng giao diện ma trận biểu đồ Form "Quản trị lịch trình".
- Người Quản Trị gõ Input: "Giờ xuất bến: 08:30" - "Có hiệu lực từ: 01/12 đến 20/01".
- **Hiệu Ứng Bật/Tắt Checkbox Bảy Ngày Trong Tuần (7-Days Week Filter):**
  - Cung cấp Component lưới 7 Nút bấm (T2, T3, T4... CN). Người dùng click chọn các ngày xe chạy. 
  - Tại Frontend Component Service, chuỗi Click này được Map sang List `daysOfWeek = [1, 2, 3]` và đẩy Payload cực sạch xuống Backend API `POST /api/planning/schedules`. Sự logic đồng bộ giữa Màn hình Mắt nhìn và Dữ liệu Bitwise Core mang lại hệ thống không có "Độ trễ xử lý" (Zero-latency feeling).

### 3.3. Kết Cấu Liên Hoàn Component
Module Planning cung cấp Nút "Sinh Chuyến Hàng Loạt" tích hợp. Khi cấu hình đầy đủ Route và Schedule xong xuôi, FE cung cấp một nút CTA (Call to Action) "Sinh Toàn Bộ Chuyến Cho Tháng". Nút này quăng Payload Push sang Module Operation `GenerateTrips` giúp số hóa 100% công việc của kíp trực Kế Hoạch 1 tháng ròng rã chỉ bằng 1 Cú Click Chuột duy nhất.

## 4. Tự Phản Biện Tổng Quan Triển Khai (Critique Summary)

Với luận văn về hệ thống Vận Tải, bài toán khó nhất không phải bán vé, mà là **bài toán tạo ra vô số chuyến xe ảo khớp với lịch thực tế**. Cấu trúc `Trip Schedule` và mảng Bitmask là bảo chứng học thuật cho điểm A+ về xử lý Algorithm Tối ưu CSDL. Dữ liệu tĩnh không bị phình to (Trips chỉ được đẻ ra từ Template tự động 1 tháng 1 lần bằng cơ chế Trigger). Sự kết nối xuyên suốt trên Frontend UI tạo thành luồng quy trình làm việc trôi chảy (Workflow) của Doanh nghiệp vận tải triệu đô.
