# Module Báo cáo Phân tích (Reports & Analytics)

## 1. Overview
Hệ thống Báo cáo (Reports) của Bus Operation System được thiết kế để xử lý dữ liệu lớn (OLAP) mà không làm ảnh hưởng đến hiệu năng của luồng chạy chính (OLTP). Để đạt được điều này, toàn bộ module Reports **tuyệt đối không sử dụng JPA/Hibernate** nhằm tránh lỗi N+1 Query và Memory Leak.

Thay vào đó, hệ thống sử dụng **`NamedParameterJdbcTemplate`** kết hợp với **Native SQL (PostgreSQL)** để tận dụng sức mạnh xử lý dữ liệu trực tiếp tại tầng Database.

## 2. Kiến trúc Kỹ thuật (Technical Architecture)

### 2.1. Sử dụng CTE (Common Table Expressions)
Mọi báo cáo (Doanh thu, Hệ số lấp đầy) đều sử dụng cấu trúc `WITH ... AS (...)` của PostgreSQL.
- CTE đóng vai trò như các bảng tạm trên RAM siêu tốc.
- Giúp tổ chức các câu truy vấn phức tạp (JOIN 6-7 bảng) thành các block logic rõ ràng, tính toán gom nhóm (Group By) trước khi SELECT cuối cùng.

### 2.2. Xử lý Dữ liệu Sơ đồ ghế động (JSONB LATERAL)
Vì sơ đồ ghế (`seat_map`) của mỗi loại xe được lưu dưới dạng JSON Array (Ví dụ: `[{"seat_number": "A01"}, ...]`), việc đếm chính xác số lượng ghế trống/bán đòi hỏi kỹ thuật cao:
- Sử dụng `LEFT JOIN LATERAL jsonb_array_elements(coalesce(bt.seat_map, '[]'::jsonb)) sm(elem)`
- Hàm này "cắt nhuyễn" mảng JSON thành nhiều dòng (mỗi vị trí ghế là 1 dòng), sau đó JOIN trực tiếp với `seat_number` của bảng Ticket để map dữ liệu.

### 2.3. Dynamic SQL Filter trong Database Engine
Thay vì dùng Java để nối chuỗi SQL (if-else rườm rà dễ sinh lỗi SQL Injection), hệ thống truyền thẳng mọi tham số xuống DB.
Ví dụ:
```sql
AND (CAST(:routeId AS BIGINT) IS NULL OR r.id = CAST(:routeId AS BIGINT))
```
- Nếu Frontend không lọc theo Route (truyền `null`), vế trái TRUE, biểu thức OR đúng toàn bộ. Database Planner (Engine) của Postgres cực kỳ thông minh, nó sẽ tự cắt bỏ nhánh WHERE này trước khi thực thi truy vấn mà không tốn chi phí rà quét dữ liệu.

## 3. Các Luồng Báo Cáo Chính

### 3.1. Báo cáo Doanh thu (Revenue Report)
Hệ thống tính toán 3 chỉ số trong cùng 1 câu SQL:
- **Gross Revenue (Doanh thu gộp):** `sum(t.price)` từ các vé đã bán.
- **Refund Amount (Tiền hoàn):** Lấy từ bảng `refund_transactions` với status `SUCCESS`.
- **Net Revenue (Doanh thu ròng):** `Gross - Refund`.
Dữ liệu được đếm chính xác nhờ `count(distinct (tr.id, upper(trim(t.seat_number))))` để tránh tình trạng 1 ghế bị đếm 2 lần nếu có join dư thừa.

### 3.2. Báo cáo Hệ số lấp đầy (Load Factor)
Tính toán tỷ lệ % số ghế đã bán trên tổng số ghế cung ứng.
- **available_rows (Số ghế cung ứng):** Join với `jsonb_array_elements` đếm toàn bộ cấu hình ghế của chuyến xe đó.
- **sold_rows (Số ghế đã bán):** Đếm từ các vé `CONFIRMED`/`ACTIVE`.
- Sử dụng **`FULL OUTER JOIN`** để merge 2 tập kết quả theo `report_date`, `route_id`, `bus_type_id`.
- Công thức: `round((sold_seats::numeric / available_seats) * 100, 2)`.

## 4. Bảo mật dữ liệu
- Tất cả truy vấn đều tuân thủ nguyên tắc bỏ qua dữ liệu Soft-Deleted (`deleted_at IS NULL`).
- Việc truyền tham số hoàn toàn sử dụng `MapSqlParameterSource` của Spring JDBC, triệt tiêu 100% rủi ro SQL Injection khi Admin thao tác với bộ lọc.
