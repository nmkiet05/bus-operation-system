# Module Kế Hoạch & Đội Xe (Planning & Fleet)

## 1. Overview
Module này là xương sống của hệ thống vận tải, quản lý từ thông tin vật lý (Xe, Loại xe) đến thông tin quy hoạch (Tuyến đường, Lịch chạy, Điểm đón trả). Dữ liệu của module này là nền tảng để module Sales (Bán vé) và Operation (Điều độ) hoạt động.

## 2. Planning Domain (Tuyến đường & Lịch chạy)

### 2.1. Quản lý Tuyến đường (Route)
Tuyến đường cố định được thiết lập dựa trên Bến xuất phát và Bến đích.
- **Logic sinh mã tuyến tự động (`RouteServiceImpl.createRoute`)**: Nếu user không nhập mã, hệ thống tự sinh mã theo chuẩn Tổng cục Thống kê (GSO).
  - Định dạng: `{Mã Tỉnh Đi}{Mã Tỉnh Đến}-{Số thứ tự}`.
  - *Ví dụ:* Tuyến Sài Gòn (79) đi Đà Lạt (68) sẽ có mã `7968-0001`.
- **An toàn dữ liệu:** Dùng Soft Delete (`deleted_at`). Trigger trong DB sẽ chặn xóa tuyến nếu đang có chuyến hoạt động.

### 2.2. Lịch chạy mẫu (Trip Schedule)
Đây là "bản mẫu" (template) để hệ thống tự động sinh ra các Chuyến xe thực tế (Trip) hàng ngày. 
- **Quy tắc Giãn cách chuyến (`TripScheduleServiceImpl.validateOverlap`)**:
  - Hệ thống thực thi quy tắc **chống Clustering** (xe chạy quá sát nhau).
  - Bắt buộc các lịch chạy trên cùng một tuyến phải cách nhau tối thiểu **30 phút**.
  - QueryDSL `BooleanBuilder` được sử dụng để kiểm tra chồng lấn thời gian hiệu lực (`effectiveFrom` -> `effectiveTo`) kết hợp với chồng lấn giờ chạy hằng ngày (`departureTime +/- 30 phút`).

## 3. Fleet Domain (Phương tiện vật lý)

### 3.1. Danh mục Loại xe (BusType)
- Định nghĩa các mẫu xe chuẩn (Ví dụ: Limousine 34 phòng, Giường nằm 40 chỗ).
- **Kỹ thuật lưu trữ:** Sơ đồ ghế (Seat Map) không được chia thành bảng nhỏ `seat` mà lưu thành mảng `JSONB` trực tiếp trong bảng `bus_type`. Điều này giúp giảm hàng triệu rows dư thừa và tăng tốc truy vấn khi vẽ sơ đồ ghế trên Frontend.

### 3.2. Quản lý Xe (Bus)
- Lưu thông tin pháp lý: Biển số, Số khung/máy, Hạn bảo hiểm, Hạn đăng kiểm.
- **Tối ưu hóa Truy vấn Vị trí xe (`BusServiceImpl.getAllBuses`)**:
  - Thay vì lưu tĩnh cột `current_depot_id` (rất dễ sai lệch), hệ thống truy xuất vị trí bãi đỗ thực tại của xe thông qua lịch sử vận hành.
  - Sử dụng Batch Fetching: Truy vấn `findLastCompletedPerBus` vào bảng `bus_assignment` để lấy ca xe hoàn thành gần nhất, từ đó trích xuất ra bãi đỗ (`end_depot_id`) rồi map ngược lại vào DTO cho Client. Giúp giảm thiểu lỗi N+1 Query.

## 4. Giao tiếp giữa các Module
- **Với Operation:** `TripSchedule` được module Operation đọc định kỳ (CronJob) để gen ra các chuyến `Trip` cho N ngày tiếp theo dựa trên bitmask `operation_days_bitmap` (Thứ 2 đến Chủ nhật).
- **Với Sales:** `Route` và `BusType` được dùng làm khóa ngoại để lookup giá vé trong bảng `fare_config`.
