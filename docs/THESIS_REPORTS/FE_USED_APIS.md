# Tổng Hợp Các API Thực Tế Được Sử Dụng Tại Frontend (Active APIs)

Tài liệu này tổng hợp các API endpoint được gọi thông qua các Axios Services tương ứng trên Frontend. Chỉ chọn lọc những APIs được tích hợp tại các page thực sự đang hoạt động và có luồng tương tác với người dùng (Public Booking & Payment Flow, Admin Operation, Reports & Dashboard), bỏ qua các APIs của page rác, nháp hoặc chưa tích hợp lên giao diện.

## 1. Dòng Khách Hàng (Public - B2C)

Đây là các API phục vụ hành trình mua vé của khách hàng (Luồng không cần Login). Các API này được cấu hình **không cần Token** (`skipAuth: true`) hoặc truyền Public params:

### Module Operation & Catalog
*Tìm kiếm chuyến và tra cứu điểm lộ trình:*
- `GET /api/catalog/provinces` - Lấy danh sách điểm đi/đến để đổ vào combobox SearchWidget.
- `GET /api/catalog/pickup-points` - Load các điểm đón/trả tương ứng với tuyến đường khách đã chọn.
- `GET /api/operation/trips/search` - Trả về danh sách chuyến xe phù hợp với tiêu chí ngày/giờ/nơi đi.
- `GET /api/operation/trips/{tripId}/seat-map` - Hiển thị bản đồ ghế (Ghế đã bán, ghế trống) phục vụ chọn chỗ.

### Module Sales (Booking)
*Giữ chỗ và quản lý vé chờ thanh toán:*
- `POST /api/sales/bookings` - Tạo Booking giữ chỗ (10 phút Lock) khi khách hàng ấn "Tiếp tục".
- `GET /api/sales/bookings/search` - Tra cứu vé công khai (cần PNR code và SĐT của khách hàng).
- `POST /api/sales/bookings/public/{code}/cancel` - Khách hủy vé công cộng.
- `POST /api/sales/bookings/public/{code}/tickets/{ticketId}/cancel` - Khách hủy 1 ghế đơn lẻ trên web.

### Module Payment
*Thanh toán đơn hàng:*
- `POST /api/payment/vnpay/create-payment` - Tạo Redirect URL sang cổng VNPAY.
- `GET /api/payment/vnpay/return` - Xử lý IPN / Return (Callback) kiểm tra chữ ký và cập nhật trạng thái Booking -> THÀNH CÔNG.

---

## 2. Dòng Thành Viên (Member - Authenticated)

Khách hàng đã đăng nhập để quản lý vé (Module Identity/Sales). Cần truyền **Bearer Token**.

- `GET /api/me/bookings` - Lịch sử mua vé của người dùng đó.
- `GET /api/identity/auth/me` - Kiểm tra thông tin JWT Token.

---

## 3. Dòng Quản Trị Hệ Thống (Admin/Staff Portal)

Giao diện vận hành (`/admin/...`) sử dụng các API thiết yếu cho các page đang hoạt động. Bắt buộc có quyền `ADMIN` hoặc `STAFF`.

### Dashboard & Theo Dõi Xuyên Suốt (Module Reports)
*Tích hợp tại `/admin/reports`:*
- `GET /api/reports/revenue` - Dữ liệu biểu đồ doanh thu, vé bán ra, tổng tiền (Tích hợp Recharts).
- `GET /api/reports/load-factor` - Báo cáo số chỗ trống và tỉ lệ lấp đầy xe theo thời gian.

### Quản Lý Vận Hành & Lịch Trình (Module Operation / Planning)
*Tích hợp tại `/admin/operation/...` và `/admin/planning/...`:*
- `GET /api/planning/trip-schedules` - Quản lý khung giờ xe chạy mẫu theo ngày.
- `GET /api/planning/routes` - Quản lý cấu hình tuyến đường của các bến (Tích hợp tại: `/admin/planning/routes`).
- `GET /api/catalog/stations` - Quản lý danh mục Bến xe khởi hành.

### Quản Lý Giá (Module Pricing)
*Tích hợp tại `/admin/sales/fare-config`:*
- `GET /api/pricing/fare-configs` - Cấu hình mức giá cơ sở cho từng chặng.

*(Ghi chú: Các API thuộc các tính năng CRUD chưa được xây giao diện FE hoàn chỉnh hoặc các page chỉ có UI tĩnh đã được chủ động loại bỏ khỏi danh sách này để đảm bảo bám sát thực trạng dự án thực tế).*
