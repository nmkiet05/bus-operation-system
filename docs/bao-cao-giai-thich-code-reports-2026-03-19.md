# Báo cáo Phân tích và Giải thích Code Báo Cáo Kinh Doanh (Từng dòng)
**Thời gian lập:** 19/03/2026
**File nguồn phân tích:** `ReportAnalyticsRepository.java`

Quá trình truy xuất dữ liệu báo cáo kinh doanh của chúng ta sử dụng `NamedParameterJdbcTemplate` của Spring thay vì JPA/Hibernate. Quyết định này giúp chúng ta vượt qua giới hạn của JPA khi chạy báo cáo phân tích đa chiều (OLAP) và hoàn toàn điều khiển được hiệu năng của hệ cơ sở dữ liệu. 

Dưới đây là phần giải thích chi tiết, đập tan mọi dòng code T-SQL đang được nhúng trong Java.

---

## 1. Constants (Các trường bóc tách dữ liệu JSON)
Cơ sở dữ liệu lưu cấu hình ghế ngồi trong một mảng JSONB ở trường `seat_map` thuộc bảng `bus_type`. Để query qua SQL, Backend sử dụng thủ thuật Regex / JSON Extract.

```java
private static final String SEAT_CLASS_EXPR = "upper(coalesce(sm.elem->>'seat_class', sm.elem->>'seatClass', sm.elem->>'class', sm.elem->>'type', 'ECONOMY'))";
private static final String SEAT_NO_EXPR = "upper(trim(coalesce(sm.elem->>'seat_number', sm.elem->>'seatNumber', sm.elem->>'seat_no', sm.elem->>'number', sm.elem->>'code', '')))";
```
- **Giải thích:**  
  - `sm.elem`: Là một biến alias đại diện cho 1 chiếc ghế trong mảng JSON của cấu hình xe ngồi.
  - `->>`: Toán tử của Postgres để "móc" dữ liệu Text từ trong trường JSON.
  - `coalesce(...)`: Hàm dự phòng. Lần lượt tìm kiếm các key như `seat_class`, nếu không có thì tìm thẻ `seatClass`, nếu không có nữa thì lấy mặc định là `'ECONOMY'`. Phục vụ tính linh động cho hệ thống xe từ nhiều nhà cung cấp có cấu trúc JSON khác nhau.
  - `upper(trim(...))`: Viết hoa và xóa khoảng trắng 2 đầu để việc Group By không bị phân mảnh do lỗi gõ phím.

---

## 2. Truy vấn Nền tảng Doanh thu: `baseCte()`
Đây là "linh hồn" của toàn bộ 3 API báo cáo Doanh Thu (Summary, Series, Breakdown). CTE (`WITH revenue_rows AS ...`) đóng vai trò tạo ra một chiếc bảng tạm ở trong RAM của Postgres trước khi tính toán các kết quả nhánh.

```sql
WITH revenue_rows AS (
    SELECT tr.departure_date AS report_date, -- 1. Lấy ngày khởi hành làm ngày báo cáo doanh thu.
           r.id AS route_id, r.name AS route_name, -- 2. Trích xuất thông tin Tuyến Xe.
           bt.id AS bus_type_id, bt.name AS bus_type_name, -- 3. Trích xuất Loại xe.
           %s AS seat_class, -- 4. Móc Hạng Ghế từ Constant JSON.
           
           sum(t.price) AS gross_revenue, -- 5. BÁN ĐƯỢC BAO NHIÊU? Cộng toàn bộ giá tiền trên cuốn vé. 
           coalesce(sum(rt.amount),0) AS refund_amount, -- 6. BỊ HỦY HOÀN MẤT BAO NHIÊU? Cộng dồn bảng refund.
           
           count(distinct (tr.id, upper(trim(t.seat_number)))) AS sold_seats, -- 7. Số ghế đã bán: Đếm tổ hợp [Mã Chuyến đi + Số Ghế]. Dùng DISTINCT để chống đúp (double-counting).
           count(distinct b.id) AS booking_count -- 8. Tổng số lượt khách đã bấm Đặt Vé.
           
    -- ============ KHỐI KẾT NỐI (JOIN) ============
    FROM ticket t
    JOIN booking b ON b.id = t.booking_id -- Lấy vé phải tìm mảng Booking cha.
    JOIN trip tr ON tr.id = t.trip_id -- Kéo xem vé đó đi xe nào, máy bay nào.
    JOIN trip_schedule ts ON ts.id = tr.trip_schedule_id 
    JOIN route r ON r.id = ts.route_id -- Kéo từ Lịch trình về Bảng Tuyến đường.
    LEFT JOIN bus bs ON bs.id = tr.bus_id
    LEFT JOIN bus_type bt ON bt.id = bs.bus_type_id
    
    -- XÉ LẺ JSONB: Biến 1 chiếc xe (Chứa array 40 ghế) thành 40 dòng độc lập trong quá trình JOIN.
    LEFT JOIN LATERAL jsonb_array_elements(coalesce(bt.seat_map, '[]'::jsonb)) sm(elem)
           ON %s = upper(trim(t.seat_number)) -- Mapping thẳng tên ghế trên vé với mã ghế trong JSONB.
           
    -- Kết nối bảng Hoàn Tiền (Và chắt lọc chỉ những giao dịch SUCCESS mới được tính trừ tiền)
    LEFT JOIN refund_transactions rt ON rt.ticket_id = t.id AND rt.status = 'SUCCESS'
    
    -- ============ KHỐI BỘ LỌC (WHERE) ============
    WHERE tr.deleted_at IS NULL -- Không tính xe đã bị xóa mềm.
      AND tr.departure_date BETWEEN :fromDate AND :toDate -- Cắt dao bằng chốt Ngày Tháng của Bộ lọc.
      AND tr.status IN ('SCHEDULED','APPROVED','RUNNING','COMPLETED') -- Chuyến đi phải hợp lệ (Chưa bị CANCEL).
      AND bt.id IS NOT NULL
      AND b.status = 'CONFIRMED' -- Booking đã trả tiền.
      AND t.status IN ('ACTIVE','CONFIRMED') -- Vé còn sống (Chưa bị hủy hay hết hạn).
      
      -- Các bộ lọc linh động phụ thuộc người dùng truyền vào từ giao diện.
      AND (CAST(:routeId AS BIGINT) IS NULL OR r.id = CAST(:routeId AS BIGINT))
      AND (CAST(:busTypeId AS BIGINT) IS NULL OR bt.id = CAST(:busTypeId AS BIGINT))
      AND (CAST(:seatClass AS TEXT) IS NULL OR %s = upper(CAST(:seatClass AS TEXT)))
      
    -- Nhóm tất cả các dữ liệu trên thành từng cục nhỏ (Block) để tính SUM/COUNT
    GROUP BY tr.departure_date, r.id, r.name, bt.id, bt.name, %s
)
```

**Tại sao lại dùng DYNAMIC SQL `AND (CAST(:routeId...) IS NULL OR ...)`?**
Kỹ thuật này siêu việt ở chỗ: Nếu một mảng người dùng Frontend không nhập thẻ Lọc "Tuyến Đường", biến `:routeId` sẽ bằng `NULL`. Phép logic `NULL IS NULL` sẽ trả về `TRUE`, do đó `TRUE OR cái gì cũng được` = `TRUE`. Postgres sẽ khôn ngoan tự động bỏ qua dòng Where đó mà không cần Backend phải viết chuỗi đứt khúc `if (routeId != null) sql += "..."`. Code cực kỳ thanh lịch!

---

## 3. Các Hàm Tiêu Thụ Dữ Liệu Thực Tế

Sau khi tạo được Bảng Tạm RAM (`revenue_rows`), Repository bắt đầu chế biến nó lôi ra 3 kiểu hiển thị (Summary tổng hợp, Series biểu đồ đường, Breakdown biểu đồ cột).

### Ví dụ: `revenueSummary()` (Widget góc trái màn hình thẻ Tổng Hợp)
```sql
, agg AS (
    -- Bước 2: Nhóm lại bảng RAM ở trên theo Tuyến và Loại Xe, sau đó Tính Net Revenue (Thực thu)
    SELECT report_date, route_id, route_name, bus_type_id, bus_type_name, seat_class,
           sum(gross_revenue) AS gross_revenue,
           sum(refund_amount) AS refund_amount,
           sum(gross_revenue) - sum(refund_amount) AS net_revenue, -- TRỪ TIỀN
           sum(sold_seats) AS sold_seats,
           sum(booking_count) AS booking_count
    FROM revenue_rows
    GROUP BY report_date, route_id, route_name, bus_type_id, bus_type_name, seat_class
)
SELECT
  -- Bước 3 Cột sống: Tính Tổng Mọi Thứ toàn bộ bảng Aggregate (agg) thành 1 Row suy nhất gởi xuống UI
  coalesce(sum(gross_revenue),0) AS gross_revenue,
  coalesce(sum(refund_amount),0) AS refund_amount,
  coalesce(sum(net_revenue),0) AS net_revenue,
  coalesce(sum(sold_seats),0) AS sold_seats,
  coalesce(sum(booking_count),0) AS booking_count,
  
  -- Bước 4: Chặn lùng chia 0 cho Giá Vé Trung Bình
  CASE WHEN coalesce(sum(sold_seats),0) = 0 THEN 0
       ELSE round(coalesce(sum(net_revenue),0) / sum(sold_seats), 2) END AS avg_ticket_price
FROM agg
```

---

## 4. Truy vấn Nền tảng Tỉ lệ Lấp Đầy: `loadFactorBaseCte()`
Đây là "trái tim" của hệ thống báo cáo "Ghế Trống - Ghế Kín". Nó phức tạp hơn doanh thu vì cần tính CẢ NHỮNG GHẾ CHƯA BÁN. Nên nó phải tách thành 2 CTE song song.

```sql
WITH available_rows AS (
    -- CTE 1: Đếm tổng ghế xe cung ứng. Không cần Join Bảng Ticket. Chỉ đếm từ Sơ Đồ Xe.
    SELECT tr.departure_date AS report_date,
           r.id AS route_id, r.name AS route_name,
           bt.id AS bus_type_id, bt.name AS bus_type_name,
           %s AS seat_class,
           count(*)::bigint AS available_seats -- Cứ 1 phần tử trong JSON Sơ đồ là 1 Ghế.
    FROM trip tr
    -- ... (Các lệnh Join lấy thông tin hình dáng xe tải y hệt mảng doanh thu) ...
    -- LƯU Ý: JSONB xẻ mảng có ON true = Không quan tâm có ai ngồi chưa, cứ bung rập là được.
    LEFT JOIN LATERAL jsonb_array_elements(coalesce(bt.seat_map, '[]'::jsonb)) sm(elem) ON true
),
sold_rows AS (
    -- CTE 2: Y hệt doanh thu. Đếm xem có bao nhiêu người cầm vé thật sự.
    SELECT tr.departure_date AS report_date, ...
          count(distinct (tr.id, upper(trim(t.seat_number))))::bigint AS sold_seats
    FROM ticket t ...
)
```

Và cuối cùng tại Hàm `loadFactorSeries()`:
```sql
, merged AS (
    -- Ghép 2 cái bảng Ảo (Available và Sold) bằng FULL OUTER JOIN để lấp ngày tháng không khớp.
    SELECT coalesce(a.report_date,s.report_date) AS report_date,
           coalesce(a.available_seats,0) AS available_seats,
           coalesce(s.sold_seats,0) AS sold_seats
    FROM available_rows a
    FULL OUTER JOIN sold_rows s 
      ON a.report_date = s.report_date
     AND a.route_id = s.route_id
     AND a.bus_type_id = s.bus_type_id
     AND a.seat_class = s.seat_class
)
-- Biến đổi ra KPI Tỉ lệ lấp đầy
SELECT report_date,
       sum(sold_seats) AS sold_seats,
       sum(available_seats) AS available_seats,
       
       -- KPI LÕI CHÍNH CỦA LOAD FACTOR
       CASE WHEN sum(available_seats) = 0 THEN 0
            ELSE round((sum(sold_seats)::numeric / sum(available_seats)) * 100, 2) END AS load_factor
FROM merged
GROUP BY report_date
ORDER BY report_date
```
- Toán tử `::numeric` của Postgres được dùng để Ép Kiểu Phân Số trước khi thực hiện phép chia. Nếu lấy `Integer / Integer` trong Postgres sẽ bị cắt mất số thập phân, ép về 0.

## Tổng Kết
Kiến trúc tính toán này cung cấp 1 giải pháp Báo Cáo Không Chậm Trễ (Real-time No-Lag). Nó hoàn toàn bỏ qua ORM cồng kềnh, tối ưu thẳng xuống Database Engine, xứng đáng là cấu trúc lõi chuẩn Enterprise.
