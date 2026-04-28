# Xử lý Đồng thời (Concurrency Control)

## Overview
Hệ thống sử dụng các kỹ thuật Distributed Lock (Khóa phân tán) và Idempotency để xử lý bài toán bán vé đồng thời, tránh 1 ghế bán cho 2 người (Double-booking) hoặc tính tiền 2 lần cho 1 thao tác.

## Chi tiết Triển khai

### 1. Redis Idempotency
- **Vấn đề:** Mạng lag khiến khách hàng nhấn nút "Đặt vé" 2 lần, hoặc App tự động Retry request.
- **Giải pháp:** Client sinh ra một `idempotencyKey` (UUID). Backend dùng Redis lưu khóa này với hạn 1 giờ. Nếu request thứ 2 bay tới có cùng key, backend trả về luôn Booking ID cũ, bỏ qua việc tạo mới.

### 2. Redisson Distributed Lock (Chống Race Condition)
- **Vấn đề:** Giới hạn của Lock SQL bình thường không đáp ứng nổi Flash Sale dịp Tết, đồng thời dễ sinh Deadlock.
- **Giải pháp:** Sử dụng thư viện `Redisson`. 
  - Khóa theo định dạng: `seat-lock:{tripId}:{seatNumber}`
  - **Triệt tiêu Deadlock:** Danh sách ghế được `.sorted()` trước khi lock. Nếu A mua [Ghế 1, Ghế 2] và B mua [Ghế 2, Ghế 1], cả 2 luồng đều sẽ bị ép phải lấy khóa Ghế 1 trước. Người đến sau phải đợi thay vì tạo vòng lặp chết (Deadlock).

### 3. Optimistic Locking
- Là lớp bảo vệ cuối cùng bằng cột `@Version` trong database. Nếu Redis sập, Hibernate vẫn chặn lại được các thao tác update tranh chấp.
