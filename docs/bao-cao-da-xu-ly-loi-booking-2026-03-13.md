# Báo Cáo Sửa Lỗi Booking & Operation
**Cập nhật:** 2026-03-13

Dưới đây là tổng hợp những lỗi đã được giải quyết dựa trên tài liệu báo cáo `bao-cao-van-de-operation-booking-2026-03-13.md`.

## 1. Bảo Mật API (Booking Security)
**Vấn đề:** Các endpoint trong `/api/bookings/**` (kể cả thao tác duyệt/hủy) bị cấu hình `permitAll()` toàn bộ, tạo lỗ hổng bảo mật nghiêm trọng.
**Đã xử lý:** 
- Giới hạn lại `SecurityConfig.java`: Chỉ cho `POST /api/bookings` (để khách đặt vé) và `GET /api/bookings/search`, `GET /api/bookings/*` (để tra cứu nhanh vé) là `permitAll()`.
- Sửa role ảo `MANAGER` -> `STAFF` cho endpoint lấy toàn bộ booking nội bộ (`BookingController.java`).

## 2. Lỗi Chuyển Đổi Trạng Thái Booking & Redisson Lock
**Vấn đề:** 
- Hàm `confirmBooking` cho phép duyệt đè đơn đã `CANCELLED` hoặc `EXPIRED`.
- Khối `finally` của Redisson xả khóa nhầm lẫn của luồng khác (`IllegalMonitorStateException`).
**Đã xử lý:**
- Thêm điều kiện cực chặt: Quá trình confirm chỉ hợp lệ với booking đang ở trạng thái `PENDING`. Bất kỳ trạng thái khác đều trả về `BadRequestException`.
- Cập nhật hàm giải phóng Redisson Lock trong `BookingServiceImpl.java` với hàm an toàn:
```java
lock.isHeldByCurrentThread()
```

## 3. Khớp Nối Giao Diện và Dữ Liệu Chuyến Xe (Trip Change)
**Vấn đề:** Admin UI không đọc được lý do duyệt/từ chối do sai lệch biến; và bị lỗi màn hình từ chối vì BE trả void nhưng TS mong chờ TripChangeRequest. Phân vùng thời gian (Urgency Zone) bị trật nhịp.
**Đã xử lý:**
- Cập nhật chuẩn mapping `TripChangeRequest` trong front-end: `reason` -> `requestReason`, `requestedByName` -> `createdBy`, `rejectReason` -> `rejectedReason`. Áp dụng render ID của User do BE không trả về name.
- Đổi kiểu trả về API Client trong tính năng duyệt (`trip-change-service.ts`) về kiểu `void`.
- Đồng bộ lại `ZONE_CONFIG` chuẩn với Entity: `STANDARD`, `URGENT`, `CRITICAL`, `DEPARTED`, `MID_ROUTE`.

## 4. Các Sửa Lỗi Khác
- Sửa lỗi câu query đếm số lượng ghế đã đặt bằng trạng thái sai tạc `PAID` -> trạng thái chuẩn `CONFIRMED` (`TicketRepository.java`).
- Sửa lố pattern validate số điện thoại rác đè nhau (`CreateBookingRequest.java`).
- Gắn biến `REFUNDED` vào Enum status đặt vé ở Typescript.
- Gắn thẻ `@deprecated` vào script getSeatMap cũ để hạn chế gây nhầm lẫn endpoint.

## 5. Đồng Bộ Schema Dữ Liệu (Frontend - Backend)
**Vấn đề:** 
- `TicketStatus` ở Frontend thiếu nhiều trạng thái rẽ nhánh (ACTIVE, CHECKED_IN, REFUNDED, NO_SHOW).
- `TripChangeRequest` ở Frontend (TypeScript) không khớp với `TripChangeResponse` ở Backend (Java), thiếu các trường báo cáo sự cố dọc đường và nhầm lẫn trường dữ liệu gây lỗi hiển thị xe.

**Đã xử lý:** 
- Cập nhật file `frontend/src/features/booking/types.ts`: Bổ sung đầy đủ dải Enum `TicketStatus`.
- Cập nhật file `frontend/src/features/admin/services/trip-change-service.ts`: Xóa `oldBusPlate`, `newBusPlate` và thay bằng `licensePlate`, `routeName`, bổ sung `isEmergency`, `incidentType`, `incidentGps` để tiếp nhận đúng payload từ Backend.

## Kết Luận
Quá trình build Backend lẫn Frontend đều đã hoàn thiện 100%, không còn lỗi. Toàn bộ tính năng thuộc Booking (Redisson/Trạng thái/Bảo mật) và Phân công Xe/Tài xế (Trip Change) hiện tại đã hoạt động an toàn theo quy chuẩn kỹ thuật.
