# Module Bán Vé & Xử lý Đồng thời (Sales & Concurrency)

## 1. Overview
Module Sales chịu trách nhiệm cốt lõi nhất của hệ thống: **Giữ chỗ và Bán vé**. Với đặc thù của hệ thống vé xe (High Traffic, Flash Sales vào dịp Lễ/Tết), module này được thiết kế với các cơ chế bảo vệ nghiêm ngặt chống lại **Race Condition** và **Duplicate Requests**.

## 2. Kiến trúc Chống Xung Đột (Concurrency Control)
Luồng đặt vé (`BookingServiceImpl.createBooking`) được bảo vệ qua 4 lớp:

### Lớp 1: Idempotency (Chống Duplicate Request)
Khi Client gọi API đặt vé nhưng bị rớt mạng và tự động retry (hoặc user bấm liên tục), hệ thống sử dụng **Redis** để chặn:
- Mỗi request từ Client cần gửi kèm một `idempotencyKey` (UUID).
- Hệ thống check Redis. Nếu đã tồn tại key này tức là request đã được xử lý thành công trước đó, trả về luôn mã Booking cũ (từ Cache hoặc DB) thay vì tạo mới.
- Cấu hình TTL của key: 1 giờ (`app.booking.cache.idempotency-ttl-hours`).

### Lớp 2: Distributed Lock (Redisson) & Anti-Deadlock
Để tránh tình trạng 2 khách hàng đặt cùng 1 ghế cùng thời điểm (Race Condition):
- Mỗi ghế được cấp một ổ khóa (Lock) riêng trên Redis với Key: `seat-lock:{tripId}:{seatNumber}`.
- **Kỹ thuật Anti-Deadlock:** Nếu User A đặt [Ghế 1, Ghế 2] và User B đặt [Ghế 2, Ghế 1] cùng lúc, có thể xảy ra Deadlock (User A giữ khóa ghế 1 đợi ghế 2, User B giữ khóa ghế 2 đợi ghế 1). Để giải quyết, danh sách ghế luôn được **sắp xếp (sorted)** trước khi xin khóa (`locks.stream().sorted().map(...)`). Điều này ép hệ thống cấp khóa theo đúng thứ tự tuần tự, triệt tiêu Deadlock.
- Khóa có Wait Timeout = 10s (Sau 10s sẽ quăng lỗi High Traffic) và Lease Time = 5 phút (Tự nhả khóa nếu server sập).

### Lớp 3: Critical Section Double-Check
Ngay khi nắm được khóa Redis, hệ thống gọi hàm `ticketRepository.isSeatBooked` để truy vấn DB lần cuối xem ghế thực sự còn trống không (kiểm tra status `ACTIVE` và booking `expiredAt`). Đây là bước xác nhận vật lý trên Database.

### Lớp 4: Optimistic Locking
Lớp bảo vệ cuối cùng là annotation `@Version` trên các Entity (`Booking`, `Ticket`). Dù có lỗi đồng bộ cache, lúc thực thi lệnh `UPDATE` hoặc `INSERT`, Hibernate sẽ check version, nếu có thay đổi ngầm sẽ văng `OptimisticLockException` và rollback toàn bộ transaction.

## 3. Kiến trúc Modular Monolith & Loose Coupling
Một điểm sáng của Module Sales là sự tuân thủ ranh giới miền (Domain Boundaries):
- `BookingServiceImpl` **KHÔNG** import trực tiếp các Repository của module khác (như `TripRepository`, `FareConfigRepository`).
- Thay vào đó, nó sử dụng các **Integration Clients** mô phỏng Microservices (như `OperationServiceClient`, `PricingServiceClient`, `PlanningServiceClient`).
- Việc này giúp cô lập logic, dễ dàng tách Module Sales thành một Microservice độc lập trên một server khác trong tương lai nếu cần scale.

## 4. Tối ưu Hiệu năng (Performance Optimizations)
- **Truy vấn lấy Sơ đồ ghế (`getSeatMap`)**: Thay vì gọi count từng vé, hệ thống dùng Query lọc sẵn các Ticket đang `ACTIVE` và dùng Java Stream để gom nhóm. Nếu chuyến xe chưa được gán loại xe cứng, hệ thống biết tự fallback lấy `totalSeats` từ `ScheduleBusType`.
- **Chống N+1 Query**: Các thao tác tra cứu Booking được viết riêng hàm Repository (`findByCodeWithFullDetails`) sử dụng `JOIN FETCH` để bốc toàn bộ `Ticket -> Trip -> Route -> BusStation` trong 1 câu SQL duy nhất, triệt tiêu N+1 Query khi trả về DTO.
- **Auto-Cancellation**: Việc hủy vé (Cancel Ticket) sẽ tự động trigger vòng lặp kiểm tra: nếu toàn bộ vé trong Booking đã hủy, Booking sẽ tự động chuyển sang trạng thái `CANCELLED` và cập nhật lại `totalAmount`.
