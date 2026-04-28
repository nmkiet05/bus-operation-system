# Module Định giá & Chính sách (Pricing)

## 1. Overview
Module Pricing quản lý cấu trúc giá vé và các chính sách phụ thu/chiết khấu động. Hệ thống cho phép thiết lập giá vé theo tuyến đường (Route), loại xe (BusType) và hỗ trợ tự động áp dụng chính sách dựa trên các điều kiện JSON linh hoạt.

## 2. Architecture
Module được thiết kế để tách biệt phần "Định giá cơ sở" (Fare Config) và phần "Khuyến mãi/Phụ thu" (Fare Policy). Khi Booking Service yêu cầu giá, Pricing Service sẽ lấy giá cơ sở và pipeline qua các Policy đang active.

## 3. Key Entities / Components
- `@Entity FareConfig`: Cấu trúc giá tĩnh, gắn liền với `Route` và `BusType`.
- `@Entity FarePolicy`: Chính sách giá động (ví dụ: Phụ thu 20% vào dịp Lễ/Tết, Giảm 10% cho Sinh viên).
- Cột `conditions` (JSONB): Mảng điều kiện để kích hoạt policy (ví dụ `{"type": "date_range", "from": "2026-02-01", "to": "2026-02-15"}`).
- Cột `action` (JSONB): Hành động khi thỏa điều kiện (ví dụ `{"type": "percentage", "value": 20}`).

## 4. Business Rules
- **Kiểm tra trùng lặp Giá cơ sở:** Không cho phép tạo 2 `FareConfig` đang active cho cùng một cặp `Route` và `BusType` trong cùng một khoảng thời gian hiệu lực.
- **Tính toán Giá cuối (Final Price):** `Final Price = Base Price + (Base Price * Phụ Thu %) - (Base Price * Giảm Giá %)`.
- Các chính sách đã vô hiệu hóa (Soft-deleted hoặc hết hạn) sẽ không được apply vào ticket mới.

## 5. Technical Notes
- **Sử dụng Type 2 SCD (Slowly Changing Dimensions):** Khi thay đổi giá cơ sở của một tuyến, hệ thống không `UPDATE` đè giá cũ (vì sẽ làm hỏng báo cáo doanh thu trong quá khứ). Thay vào đó, hệ thống gán `effectiveTo` cho bản ghi cũ bằng thời điểm hiện tại và tạo bản ghi `FareConfig` mới với `effectiveFrom` là hiện tại.
- Kỹ thuật lưu trữ `conditions` và `action` dưới dạng JSONB cho phép mở rộng quy tắc khuyến mãi không giới hạn mà không cần sửa schema DB.
