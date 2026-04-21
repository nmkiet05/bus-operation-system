# MODULE: QUY CÁCH GIÁ VÀ DOANH THU (PRICING & SALES) 

> **Mô tả:** Mạch máu tài chính của doanh nghiệp. Nơi giải quyết bài toán cốt tủy: "Giá của vé" (Pricing) và "Việc phát hành vé" (Sales). Việc định giá động và áp thẻ ưu đãi được xử lý bằng thuật toán chồng lớp (SCD Type 2), giải nén triệt để sự cố thất thoát doanh thu trong thời đại chuyển đổi số.

## 1. Cấu Trúc Khối Dữ Liệu Cơ Sở (Database Architecture)

Cơ sở dữ liệu của Pricing & Sales sở hữu cơ chế bảo toàn dữ liệu đồng thời (Concurrency Control) khét tiếng nhất trong ngành Khoa học máy tính.

### 1.1 Khối Pricing (Khởi Tạo Giá Trị)
- **`fare_config` (Bảng Giá Khung Lõi):** Giá chặn cho 1 Tuyến + 1 Loại Xe.
  - Sử dụng mô hình **SCD Type 2 (Slowly Changing Dimension)** qua các trường: `effective_from`, `effective_to`.
  - Nghiệp vụ: Admin không bao giờ *Update* xóa đè một mốc giá cũ (VD giá năm 2025 là 100k). Khi qua năm 2026, vé lên 130k, hệ thống chèn Row mới (130k) trùm cho năm 2026, đôn `effective_to` của Row cũ lại (Nghỉ hưu giá cũ). Giữ lại Audit Trail thần thánh.
- **`fare_policies` (Cổng Khuyễn Mãi/Phụ Thu Hành Lý):**
  - Châm ngòi qua JSONB `conditions` và `action` linh động (Quy tắc Engine tính giá dạng Rules Tree).

### 1.2 Khối Sales Booking (Giao Dịch Thời Gian Thực)
- **`booking` (Giỏ Hàng Toàn Vẹn):** Chứa "Mã PNR Code" thần thánh (Ví dụ vé máy bay Booking Reference). 
  - Khởi điểm với status = `PENDING` (Chờ Thanh Toán). Lock luồng tài nguyên xe trong Time-To-Live (TTL) 10 phút. Quá hạn tự động Auto-Cancel thông qua Scheduler Job.
- **`ticket` (Chứng Chỉ Vận Tải):** Ráp sát lấy cấu hình khóa ngoài `trip_id` (Chuyến đi dự tính), `seat_number` (ID của cái ghế vật lý).
  - Tích hợp **Optimistic Locking (`@Version version`)**: Siêu thuật toán trong Spring Data JPA phân tải tranh chấp khi có 1.000 khách vào tranh 1 cái xe ngày Mùng 1 Tết. Việc dùng Version Variable thay vì Table Mutex Lock ngăn sập toàn bộ Server Database.

---

## 2. Đặc Tả Backend (Engine Thực Thi Vận Hành)

Tại lớp Business Logic Service (`BookingService.java` & `FareConfigController.java`):

* **Thuật toán `POST /api/pricing/fares/upsert`:** Khi gọi lệnh áp giá mới, kịch bản giao dịch (Transaction `REQUIRED`) tìm chắp vá các khoảng đứt gãy hợp lệ của Lịch Sử Giá, tự chốt giá ngày tàn.
* **Quy Trình `POST /api/bookings` (Siêu Lõi):**
  1. Frontend truyền Danh sách Tuyến, Chuyến `#A`, Ghế `A1, A2`.
  2. Bắt đầu Transaction CSDL.
  3. Lọc Check Cứng DB: Ghế `A1`, `A2` trên Chuyến `#A` hiện đang Trống (Không có vé nào mang `status IN (CONFIRMED, PENDING, PAID)`).
  4. Nếu Trống $\rightarrow$ Khởi tạo Ticket với thuộc tính `PENDING`, ráp giá từ `fare_config` sống sót tại giây phút đó.
  5. Commit xuống DB. Chết Database nếu Optimistic Lock chặn đứng. Thành công nếu version nhảy số. Trả PNR Code về App Khách Hàng.

---

## 3. Bản Triển Khai Chức Năng Trên Giao Diện Frontend (Frontend UI/UX)

Để "nuốt" trọn độ khó từ Backend, thư mục `app` trên Frontend rải khắp 3 chân kiềng (Public Web, Admin Web) như sau:

### 3.1. Phân Hệ Người Dùng Mua Vé (`(public)/booking/[tripId]`)
- **Vẽ Ma Trận SeatMap Lập Trình Phức Tạp:** Client giăng bẫy lưới (Grid) đọc từ JSONB BusType API. Lát gạch trực quan 2 tầng xe (Bottom/Top) cho phép khách chấm Click vào ghế. 
- Ngay khi người dùng Click, React State cập nhật dỏ hàng. Dưới góc phải là Thanh Điều Hướng Tính Tiền (Tổng giá dội lên * 130.000đ).
- Khách bấm Submit $\rightarrow$ FE bung Input nhập Thông Tin (Họ tên, SĐT). FE validation chặc chẽ SDT Việt Nam bằng Regex. Bắn API Create Booking $\rightarrow$ Chuyển tiếp tới `/payment/[PNR_Code]`.

### 3.2. Màn Hình Quản Lý Giá Vé (`admin/sales/fare-config`)
- Màn hình dành riêng cho phòng Kế Hoạch Kinh Doanh.
- Lưới Grid hiển thị: Tuyến SG-Lâm Đồng | Xe Limousine | Giá: 300,000 | Tình Trạng Hiện Hành (Active / Expired).
- FE thiết kế riêng Popup **Áp Giá Thời Điểm Lễ Tết**: Giao diện cung cấp thanh trượt (Slider) Tăng bao nhiêu %, Áp dụng từ ngày 28 Tết đến Mùng 6 Tết. Gửi Payload `FareConfigRequest` xuống BE để phân mảng CSDL cực chuẩn.

### 3.3. Tra Trượng Ngôi Sao Đội Call Center (`admin/sales/bookings`)
- Các Telesales tổng đài viên ngồi liên tục trước trang Web Frontend `admin/sales/bookings`. Khách gọi điện check vé đọc Mã Đặt Chỗ, Telesales search realtime theo ô Filter "Mã vé bằng TEXT".
- Thấy khách muốn Cancel đổi Ngày $\rightarrow$ Cung cấp nút `Action: Hủy Vé Chèn (Cancel Tickets)`. Chọc API trả lại chỗ cho xã hội để bán lại. (Hoàn tiền rớt vào bảng `Refund Transactions`). Cực kỳ đầy đủ góc nhìn doanh nghiệp.

## 4. Tự Phản Biện Cấu Trúc Đặt Chỗ (Critique Summary)

Bài toán Đặt vé (Booking) là tử huyệt của toàn dự án bảo vệ đồ án tốt nghiệp. Nhờ áp dụng đồng thời Partial Unique Index, Optimistic Locking ở khâu Backend, và Debounce Click (chống Spam nút Mua vé 100 lần) ở tầng Frontend React, hệ thống Bus Operation này giải quyết mượt mà bài toán Double Booking - Nỗi đau kinh hoàng nhất của các nhà xe truyền thống Nam Bắc. Khả năng bảo toàn đồng nguyên dữ liệu (ACID) của module này làm nên bộ khung bảo vệ điểm tối đa cho sinh viên khoa CNTT.
