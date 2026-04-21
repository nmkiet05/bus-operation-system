# Module: Pricing (Cấu Hình Giá Cước)

Quản lý một ma trận giá vé linh động để đáp ứng nhu cầu cung - cầu thị trường.

## Các Controllers Đang Sử Dụng:

### 1. `FareConfigController`
- **Mô tả:** Bảng định giá gốc.
- **Nghiệp vụ:** Tính toán giá vé linh hoạt dựa trên khoảng cách Station-to-Station (Chặng). Khách hàng lên ở trạm giữa sẽ không phải trả giá bằng khách đi từ đầu đến cuối tuyến. Mức giá này cấu hình gốc cho các Booking tính toán rổ hàng.

### 2. `FarePolicyController`
- **Mô tả:** Thay thế mốc giá áp dụng trong các chu kỳ khác nhau.
- **Nghiệp vụ:** Các kịch bản tăng/giảm giá (ví dụ: Ngày lễ Tết, Dịp kỷ niệm) được tạo dưới dạn Policy, có thời hạn (FromDate - ToDate). Khi mua vé, hệ thống tự động đánh giá Policy nào đang có hiệu lực cao nhất để áp giá đó lên vé gửi khách.
