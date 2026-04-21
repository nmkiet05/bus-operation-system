# MODULE: BÁO CÁO THỐNG KÊ & DỮ LIỆU THÔNG MINH (BI REPORTS)

> **Mô tả:** Nếu các module khác phục vụ luồng nghiệp vụ tạo tiền (Operate to Make Money), thì Module Reports là con mắt Thần Quan Đốc (BI - Business Intelligence) phục vụ Ban Giám Đốc nhìn thấy con số để định hướng chiến lược. Nhiệm vụ tối cao của module là nhào nặn hàng triệu giao dịch lẻ tẻ từ Cụm Booking, Trip, Pricing... tạo ra các biểu đồ chỉ số Kinh Doanh (KPIs) với tốc độ chưa tới 30 mili-giây.

## 1. Cơ Chế Triển Khai Xử Lý Dữ Liệu Lớn Backend (Big-data Ready Architecture)

Backend sở hữu controller độc quyền `ReportController.java` nhưng thứ đáng tiền nhất là cấu trúc Repository chọc thẳng Data Raw ở dưới đáy CSDL:

1. **Hiến Tế ORM - Ứng Dụng `NamedParameterJdbcTemplate`:**
   - *Vấn đề đau đớn:* Hibernate JPA vỡ trận (Out Of Memory) hoặc dính `N+1 Query` kẹt cứng hàng phút đồng hồ khi yêu cầu gộp (Join) khối lượng Tickets lớn theo thời gian Tháng/Năm với FareConfig, Tickets, Policy và Trips.
   - *Giải pháp Đồ Án:* Thiết kế lớp `ReportRepositoryImpl.java` bỏ qua ánh xạ Entity mà truy xuất RDBMS gộp cục bằng **JDBC Template Component**. Trả thẳng ResultSet Data trần.

2. **Truy Vấn CTE Bậc Cao (Common Table Expressions - WITH Clause):**
   - Viết các câu SQL thần thánh dài hàng chục dòng với cú pháp `WITH revenue_base AS (...) SELECT ...`.
   - Giúp cho Engine PostgreSQL tính mảng bảng ảo (Temporary Tables) ngay trên bộ nhớ In-Memory của nó rồi nhả về đúng 1 dòng kết quả Tổng quan. Không mất chi phí độ trễ mạng (Network Latency calls).

3. **Chỉ Số Báo Cáo Cốt Lõi (Core Metrics):**
   - **Báo cáo Doanh Thu Tuyến (`/revenue`)**: Khai quát biến số Giá Gốc (`price`) + Phụ Thu `surcharge` - Chiết Khấu `discount` - Hủy Chuyến Hoàn Tiền `refunds`.
   - **Báo cáo Hệ Số Tải Sàn (`/load-factor`)**: Định lượng Capacity. "Chiếc xe 40 chỗ bán được 20 vé thì Load-Factor = 50%". Đo lường tính hiệu quả (Efficiency). Nếu chuyến thường xuyên < 30%, BGD sẽ ra quyết định loại bỏ tuyến để dồn xe sang chặng khác đông khách hơn.

---

## 2. Bản Triển Khai Dashboard Trên Giao Diện Frontend (Frontend UI/Dashboard)

Tất cả tinh anh tập hợp tại thư mục `app/(admin)/admin/reports` và màn hình `Dashboard`:

### 2.1. Không Gian Biểu Đồ Thống Kê (Visual Analytics UI)
- **Thư Viện Trực Quan Hóa (Charting Library):** Next.js sử dụng các thư viện Canvas đồ họa tiên tiến (như Chart.js, Recharts hoặc Ant Design Charts). 
- **The Revenue Chart (Biểu Đồ Cột Năng Động):** FE gửi hàm Date-Range (Khoảng thời gian) dội vào `GET /api/reports/revenue?from=...&to=...`. Render biểu đồ so sánh doanh thu của "Tuyến SG-Đà Lạt" vs "Tuyến SG-Nha Trang". (Sử dụng biểu đồ đường chạy nhiều màu).
- **The Load Factor Ring (Khuyên Tròn Capacity):** Áp dụng biểu đồ Donut Chart/Gauge để tô màu cảnh báo. Tuyến đắt đỏ tô viền Xanh Lá Cây, Tuyến lỗ vốn báo Đỏ Cam. UX trực quan hóa làm thỏa mãn cái nhìn của CEO Nhà xe. Chạm đúng vào Keyword Đồ án "Bảng Điều Khiển Thông Minh - Smart Dashboard".

### 2.2. Khu Vực Bộ Lọc Dữ Liệu Không Nháy Nháy Chớp (Smooth Filtering)
- Tương tác Web App một trang (SPA): Giao diện có thanh Select Box "Tháng Năm Quý, Lọc theo Route ID, ...". Bấm tìm kiếm $\rightarrow$ React re-rendering biểu đồ dưới nền SVG/Canvas cực mượt, không hề F5 nháy reload lại trang Web.

## 3. Tự Phản Biện Bức Tranh Toàn Cảnh (Critique Summary)

Module BI được kết cấu theo chuẩn "Report Engine" của ngành Data Engineer (Xử lý thô và Nhả Data Cục). Việc chối bỏ JPA/Hibernate để nhúng tay vào CSDL viết Raw SQL + CTE chứng tỏ sinh viên hiểu rất sâu bản chất chịu tải của hệ thống. Đồng thời Frontend không phải hứng rác dữ liệu tính toán mà chỉ đóng đúng vai trò "Vẽ Cái Đẹp". Đây là kiến trúc hoàn hảo nhất về định hướng Single Responsibility Principle (SRP) giữa lớp Backend tính số và lớp Frontend vẽ hình.
