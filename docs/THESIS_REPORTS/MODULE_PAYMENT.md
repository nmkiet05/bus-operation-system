# Module: Payment (Giao Dịch Thanh Toán)

Đảm bảo đối soát dòng tiền trước khi đổi vé cho khách, hoạt động cùng Sales tạo nên "Thanh toán giao hàng".

## Các Controllers Đang Sử Dụng:

### 1. `PaymentController`
- **Mô tả:** Xác thực quá trình chuyển nhận tiền của Client và Server.
- **Nghiệp vụ:**
  - Thường tích hợp với Cổng thanh toán (VNPAY / MOMO hoặc Bank Transfer).
  - Khi Booking (Bên module Sales) được tạo ở trạng thái Pending, Payment module sẽ đứng ra kiểm thử tiền vào, nếu tiền báo thành công, Callback của PaymentController sẽ nhận 1 request để cập nhật lệnh cho DB đổi Booking sang Status: `Thành Công`.
  - Sinh ra mã QR (QR Code Payment) để khách hàng quét.
