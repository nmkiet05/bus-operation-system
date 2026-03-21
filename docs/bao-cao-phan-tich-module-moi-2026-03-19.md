# Báo cáo Phân tích Module `seed` và `reports`

Dựa trên quá trình rà soát mã nguồn thực tế của hai module `seed` và `reports` vừa được bổ sung vào hệ thống Bus Operation System, dưới đây là báo cáo đánh giá kiến trúc và phân tích công thức tính toán báo cáo kinh doanh.

## 1. Đánh giá Module `seed` (Sinh dữ liệu giả lập)

### Cấu trúc hiện tại:
Module bao gồm các lớp như `SeedRunner`, `SeedDatasetPlanner`, `SeedServiceLayerGatewayImpl`, sử dụng `ApplicationRunner` để can thiệp trực tiếp vào quá trình khởi động của Spring Boot nhằm nạp (seed) dữ liệu thông qua các Service nghiệp vụ tổng hoặc chạy Script SQL rác (`executeDemoSeedScript`).

### Khuyến nghị: KHÔNG NÊN GIỮ TRONG LOGIC PRODUCTION (NÊN LOẠI BỎ HOẶC CÁCH LY)
**Lý do:**
- **Rủi ro An toàn Dữ liệu:** Việc tích hợp một bộ máy sinh dữ liệu tự động ngay trong code chính của App là một Anti-pattern (lỗi thiết kế) phổ biến ở cấp độ Doanh nghiệp. Nếu có sai sót cấu hình trên Production (ví dụ biến môi trường `seed.runner.enabled=true` vô tình bị bật), hệ thống sẽ nhồi nhét hàng ngàn dòng dữ liệu rác vào Database đang vận hành thật, hoặc thậm chí ghi đè dữ liệu kinh doanh.
- **Trách nhiệm (Separation of Concerns):** Việc làm giàu Database ảo để phục vụ quá trình test/phát triển nên nằm ở một Module rời bên ngoài nhánh chính (ví dụ như thư mục `src/test/java`). Do đó, không nên gói chung module này vào file jar khi Release bản Production.

**Hành động đề xuất:** Hãy xóa hoặc loại bỏ `seed` khỏi codebase chính. Nếu cần chạy test, hãy tách chúng sang `src/test/java` hoặc dùng các công cụ Migration chuyên dụng cho DB như Flyway hay Liquibase.

---

## 2. Đánh giá Module `reports` (Báo cáo kinh doanh)

### Cấu trúc tổ chức thư mục: ĐÚNG CHUẨN VÀ RẤT TỐT
Module `reports` tuân thủ hoàn hảo mô hình phân lớp hiện đại (Layered Architecture):
- `/controller`: Điểm chạm RESTful API (`ReportController`).
- `/dto`: Chứa các Model ánh xạ Filter (`ReportsFilter`) và sơ đồ kết quả JSON trả về (`LoadFactorReportResponse`, `RevenueReportResponse`).
- `/repository`: Truy xuất dữ liệu (`ReportAnalyticsRepository`). Việc bạn chọn sử dụng `NamedParameterJdbcTemplate` thay vì dùng *JPA Entity/Hibernate* ở đây là một quyết định **xuất sắc** về mặt kiến trúc phần mềm! Hệ thống báo cáo (OLAP) thường sử dụng ngôn ngữ truy vấn tổng hợp SQL phức tạp (Ví dụ: cú pháp `WITH revenue_rows AS...`); nếu cố gắng ép các truy vấn này dùng JPA sẽ làm giảm hiệu năng khủng khiếp (N+1 query problem). Lựa chọn Native SQL Template là đỉnh cao của độ ổn định.
- `/service`: Nơi cung cấp các class tính toán nghiệp vụ (`ReportAnalyticsServiceImpl`).

---

## 3. Các Công thức Báo Cáo Kinh Doanh (Metric Formulas)

Phân tích trực tiếp từ các câu lệnh SQL Native T-SQL/PostgreSQL (Ví dụ CTE `WITH revenue_rows AS`) trong lớp `ReportAnalyticsRepository.java`, các công thức (Formulas) cốt lõi đang được hệ thống backend sử dụng để báo cáo như sau:

### 3.1 Nhóm Công thức Doanh Thu (Revenue Metrics)
Chỉ tính toán doanh thu trên những chiếc vé (`ticket`) có trạng thái là `ACTIVE` hoặc `CONFIRMED`, và thuộc về các Booking đã xác nhận thanh toán (`status = CONFIRMED`).

**1. Tổng doanh thu Gộp (Gross Revenue):**
> `gross_revenue` = Tổng thu của cột `price` (giá ghế ngồi) nhân với tất cả số ghế bán ra.

**2. Tổng tiền hoàn lại (Refund Amount):**
> `refund_amount` = Bằng hàm `coalesce` tính Tổng `amount` trong bảng giao dịch hoàn tiền `refund_transactions` (với điều kiện bắt buộc `status = 'SUCCESS'`).

**3. Doanh thu Thuần (Net Revenue):**
> `net_revenue` = `gross_revenue` - `refund_amount` (Lấy Tổng Thu Gộp trừ đi Tiền Hoàn).

**4. Số lượng ghế bán ra (Sold Seats):**
> `sold_seats` = `count(distinct (trip_id, seat_number))` - Đây là một thủ thuật đếm rất cẩn thận, loại trừ các lỗi dữ liệu trùng của Database. Nó đảm bảo 1 chỗ ngồi duy nhất trên 1 chuyến di chuyển chỉ được đếm làm 1 ghế bán ra. 

**5. Giá trị trung bình 1 vé (Avg Ticket Price):**
> `avg_ticket_price` = `net_revenue` ÷ `sold_seats` (Làm tròn 2 chữ số thập phân).

### 3.2 Nhóm Công thức Tỉ lệ Lấp đầy (Load Factor Metrics)
Khai thác dữ liệu trực tiếp từ file thuộc tính của xe tải (Sơ đồ ghế định dạng JSONB `seat_map` trong bảng `bus_type`). Dùng hàm `jsonb_array_elements` để trải phẳng sơ đồ xe thành từng ghế lẻ.

**1. Số lượng ghế cung ứng (Available Seats):**
> `available_seats` = Đếm tổng số lượng mảng cấu trúc JSON `seat_map` (tương đương đếm có bao nhiêu chiếc ghế thật ở ngoài đời) của chiếc xe tải đang chạy chuyến đó. Trả về dưới dạng số lượng có sẵn (`count(*)`).

**2. Tỉ lệ Lấp đầy (Load Factor):**
> `load_factor` = `(sold_seats` ÷ `available_seats)` × 100 (%) 

Công thức này đang kiểm tra chặt chẽ điều kiện `CASE WHEN available_seats = 0 THEN 0...` giúp Database tránh được lỗi kinh điển DevideByZero (khi tổng số chia bằng 0). Thể hiện tay nghề SQL cực cao của người triển khai tính năng này trên Backend.
