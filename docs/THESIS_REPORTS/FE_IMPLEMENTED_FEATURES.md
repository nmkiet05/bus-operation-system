# Kiến Trúc Giao Diện 3 Cổng (3-Portal UI/UX Architecture)

> **Phân Tích Cấu Trúc Tổng Quan:** Khác với các hệ thống đồ án truyền thống thường dồn mọi chức năng vào một trang Web duy nhất, dự án Bus Operation System được phân rã kiến trúc Frontend (Next.js) thành **3 Giao Diện Chính (3 Portals)** độc lập. Sự phân tách này tối ưu hóa trải nghiệm người dùng (UX) theo ngữ cảnh và đảm bảo an ninh bảo mật cấp độ doanh nghiệp (nhờ phân tách Routing và Middleware Middleware bảo vệ từng luồng phân quyền).

Dưới đây là đặc tả chi tiết 3 giao diện cốt lõi của hệ thống:

---

## 1. Giao Diện Quản Lý (Management Portal)
- **Tên thư mục cấu trúc:** `app/(admin)/...`
- **Đối tượng cấp phép (Role):** Dùng chung cho `ADMIN` (Ban giám đốc/Hệ thống) và `STAFF` (Nhân viên điều hành/Giao dịch viên).
- **Mục tiêu UX/UI:** Hiển thị khối lượng dữ liệu khổng lồ (Data-heavy). Giao diện tối ưu cho Màn hình Desktop (Máy tính bàn tại văn phòng/Bến xe) với Menu dọc (Sidebar) Sidebar Collapse và Lưới dữ liệu (Data Grid) của Ant-Design.

**Các chức năng hiển thị (Modules triển khai):**
1. **Quản lý Nhân sự (`admin/users`):** (Chỉ Admin) Cấp tài khoản cho Staff và Driver. Khóa/Mở tài khoản định danh Hệ thống.
2. **Quản lý Nguồn Lực Đội Xe (`admin/fleet` & `admin/catalog`):** Sơ đồ hình dạng cấu trúc ghế ngồi xe, số VIN, ngày hết hạn bảo hiểm, danh sách bến bãi.
3. **Quản lý Tuyến và Khung Giờ Mẫu (`admin/planning`):** Tự động hóa lịch sinh chuyến hàng tháng dựa trên phép toán Bitwise (`daysOfWeek`). Cấu hình bến đi - bến đến.
4. **Trung Tâm Xử Lý Lệnh Khẩn (`admin/operation`):** Đây là mảng cốt lõi của Management Portal. Các Staff điều hành ngồi trực trang Web này để xem **5 Vùng Cảnh Báo Chuyến Xe Khẩn Cấp (5-Zone Emergency)**. FE dội màn hình cảnh báo đỏ rực nếu Trip bị thủng do Tài Xế/Xe gặp sự cố trước 15-60 phút xuất bến.
5. **Cấu Hình Bán Vé (`admin/sales` & `admin/reports`):** Tăng giảm giá vé dịp Lễ Tết (Fare Config), Xử lý hoàn hủy giữ chỗ của khách gọi qua tổng đài, và Hiển thị biểu đồ phân bố Doanh thu / KPI Load-Factor gửi Giám đốc.

---

## 2. Giao Diện Khai Thác Chuyến (Driver Portal)
- **Tên thư mục cấu trúc:** `app/(driver)`
- **Đối tượng cấp phép (Role):** Dành riêng tuyệt đối cho `DRIVER`.
- **Mục tiêu UX/UI:** Thiết kế Mobile-First Design (Dành riêng cho màn hình điện thoại vuốt dọc). Giao diện cực kỳ to, rõ, các Nút bấm (CTA) mang kích cỡ lớn để tài xế có thể nhấp chạm dễ dàng trong môi trường làm việc ngoài trời hoặc rung lắc trên cabin.

**Các chức năng hiển thị (Modules triển khai):**
1. **Lịch Trình Trong Ngày (`Today Trips`):** Ngay khi Driver đăng nhập, giao diện chỉ dội đúng 1 API cấp chặng: `GET /api/driver/trips/today`. Tài xế không bị phân tâm, chỉ thấy duy nhất "Chuyến 8h Sáng nay tôi phải chạy".
2. **Bàn Giao Phương Tiện (Handover):** Quy trình nhận/trả xe khép kín. Giao diện đưa ra Form Input Số Kilomet trên đồng hồ và Mức nhiên liệu (Xăng/Dầu). Tài xế quẹt lệnh $\rightarrow$ Hệ thống cập nhật vòng đời hao mòn của xe phục vụ tính KPI.
3. **Trigger Báo Cáo Sự Cố Dọc Đường (Mid-Route Incident):** Cung cấp Nút Báo Cáo Khẩn (Động cơ hỏng, Nổ lốp). Tín hiệu lập tức Ping lên màn hình `admin/operation` của Management Portal ở vùng Z5 (Mid-Route Zone).

---

## 3. Giao Diện Bán Vé Chạm Đa Khách Hàng (Sales & Booking Portal)
- **Tên thư mục cấu trúc:** `app/(public)`
- **Đối tượng cấp phép (Role):** Mở toang cho **Tất cả các Role** (Bao gồm GUEST vãng lai, CUSTOMER có tài khoản, và cả STAFF/ADMIN muốn tự trải nghiệm luồng mua vé trực tiếp).
- **Mục tiêu UX/UI:** E-Commerce Checkout Flow (Mô hình rỏ hàng thương mại điện tử). UX được làm cực kỳ bắt mắt, tốc độ tải SPA (Single Page Application) chớp nhoáng phục vụ hàng ngàn người lướt chọn vé nghỉ lễ đồng thời.

**Các chức năng hiển thị (Modules triển khai):**
1. **Cổng Cỗ Máy Tìm Kiếm (Search Hero-Banner):** Giao diện Homepage với Ô Textbox Auto-complete Chọn Tuyến, Chọn Ngày. Thiết kế dạng Debounce không làm sập Database.
2. **Lưới Sơ Đồ Ghế Động Đa Nền Tảng (`/booking/[tripId]`):** Trải phẳng sơ đồ 2 tầng (Tầng trên / Tầng dưới). Hệ thống FE xử lý Click nhạy bén. Tích hợp Component Giỏ Hàng nổi Float dưới góc màn hình tổng tiền vé.
3. **Cổng Trực Tuyến Giao Dịch (`/payment`):** Luồng luân chuyển sau Form Điền thông tin PNR (Mã đặt chỗ). Trả màn hình Quét mã QR Transfer VNPAY / Momo. Giao diện lắng đọng thông điệp "Xin giữ trong 10 Phút" đếm ngược đe dọa khách hàng bằng hình thức kích thích thanh toán. Đạt chuẩn FOMO UX.
4. **Lịch Sử Chuyển Động (`/trips` & `Me/Bookings`):** Khách hàng vãng lai sau khi đăng nhập có thể xem lịch sử đi lại cá nhân bằng giao diện Card ListView.

### Tổng Kết Về Kiến Trúc 3 Cổng
Việc rẽ nhánh hệ thống thành: `(admin)` cho khối điều hành, `(driver)` cho nhân lực tại hiện trường, và `(public)` cho khách hàng và đại chúng giúp Hệ Thống Đạt Chuẩn Công Nghiệp (Enterprise-ready). Nếu một phân nhánh bị tấn công (DDoS vào trang Public), toàn bộ mạch máy chủ Private của Điều Hành (Admin) và Tài xế (Driver) vẫn chạy mượt mà bất tử. Đây là luận điểm chốt hạ ăn điểm tuyệt đối trong việc phản biện Cơ Chế Điều Phối Mã Nguồn Web Frontend trước Giảng viên phản biện.
