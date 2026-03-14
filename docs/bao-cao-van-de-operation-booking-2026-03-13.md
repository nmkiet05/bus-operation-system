# Báo Cáo Vấn Đề Operation Và Booking

Ngày cập nhật: 2026-03-13
Phạm vi: `backend/src/main/java/com/bus/system/modules/operation/**`, `backend/src/main/java/com/bus/system/modules/sales/**`, frontend booking/operation liên quan.

## Tóm tắt

Đã thực hiện sửa nhanh các lỗi ưu tiên cao về bảo mật booking và đồng bộ một phần contract frontend-backend.

Kết quả hiện tại:
- Đã xử lý: 11/12 mục trong danh sách theo dõi.
- Còn theo dõi: 1 mục (mức Medium) liên quan chuẩn hóa chính sách auth tổng thể.

## Cập nhật đã triển khai trong đợt này

1. Siết quyền API booking thao tác nội bộ:
- Thêm `@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")` cho:
  - `POST /api/bookings/{id}/cancel`
  - `POST /api/bookings/{code}/confirm`
  - `POST /api/bookings/tickets/{ticketId}/cancel`
  - `POST /api/bookings/{bookingId}/cancel-tickets`
- File: `backend/src/main/java/com/bus/system/modules/sales/controller/BookingController.java`

2. Giữ luồng khách vãng lai (public) theo `mã + SĐT`:
- Thêm endpoint public mới:
  - `POST /api/bookings/public/{code}/cancel?phone=...`
  - `POST /api/bookings/public/{code}/tickets/{ticketId}/cancel?phone=...`
- File: `backend/src/main/java/com/bus/system/modules/sales/controller/BookingController.java`

3. Mở whitelist route-level cho endpoint public mới:
- Thêm `POST /api/bookings/public/**` vào permitAll.
- File: `backend/src/main/java/com/bus/system/config/SecurityConfig.java`

4. Cập nhật frontend lookup để gọi endpoint public mới:
- Trang tra cứu vé đổi từ cancel theo `bookingId/ticketId` sang cancel theo `code + phone`.
- File: `frontend/src/app/(public)/booking/lookup/page.tsx`
- File: `frontend/src/features/booking/services/booking-service.ts`

## Trạng thái 12 vấn đề (đã rà lại)

### 1) [Critical] Toàn bộ API booking bị public quá rộng

- Trạng thái: **Đã xử lý phần chính**.
- Đã loại bỏ cấu hình public toàn bộ `/api/bookings/**` từ trước, và hiện chỉ public các endpoint cần thiết (`create`, `search`, `public/*`).
- Cập nhật mới: endpoint thao tác nội bộ đã gắn `@PreAuthorize` rõ ràng.

### 2) [Critical] Confirm booking cho phép chuyển trạng thái không hợp lệ

- Trạng thái: **Đã xử lý**.
- Chỉ cho phép `PENDING -> CONFIRMED`, trạng thái khác trả lỗi.
- File: `backend/src/main/java/com/bus/system/modules/sales/service/impl/BookingServiceImpl.java`

### 3) [Critical] Unlock lock Redisson không an toàn

- Trạng thái: **Đã xử lý**.
- Đã check `lock.isHeldByCurrentThread()` trước khi unlock.
- File: `backend/src/main/java/com/bus/system/modules/sales/service/impl/BookingServiceImpl.java`

### 4) [High] Query đếm ghế dùng status không tồn tại (`PAID`)

- Trạng thái: **Đã xử lý**.
- Đã đổi sang `CONFIRMED`.
- File: `backend/src/main/java/com/bus/system/modules/sales/repository/TicketRepository.java`

### 5) [High] Mismatch role `MANAGER`

- Trạng thái: **Đã xử lý**.
- Đã chuẩn hóa sang `ADMIN/STAFF` cho endpoint admin booking list.
- File: `backend/src/main/java/com/bus/system/modules/sales/controller/BookingController.java`

### 6) [High] Mismatch urgency zone FE-BE (Trip Change)

- Trạng thái: **Đã xử lý**.
- Frontend đã dùng zone backend: `STANDARD/URGENT/CRITICAL/DEPARTED/MID_ROUTE`.
- File: `frontend/src/app/(admin)/admin/operation/trip-changes/page.tsx`

### 7) [High] Mismatch tên field Trip Change response

- Trạng thái: **Đã xử lý**.
- Frontend đã chuyển sang `requestReason`, `rejectedReason`, `createdBy`.
- File: `frontend/src/features/admin/services/trip-change-service.ts`
- File: `frontend/src/app/(admin)/admin/operation/trip-changes/page.tsx`

### 8) [Medium] Sai type approve/reject/rollback ở FE Trip Change service

- Trạng thái: **Đã xử lý**.
- Đã đổi về `Promise<void>`.
- File: `frontend/src/features/admin/services/trip-change-service.ts`

### 9) [Medium] Tồn tại 2 luồng seat-map API

- Trạng thái: **Đã xử lý**.
- Hàm ở `trips.ts` đã chuyển đúng endpoint và gắn `@deprecated`.
- File: `frontend/src/services/api/trips.ts`

### 10) [Medium] Role-check BookingController chưa thống nhất tuyệt đối với route-level

- Trạng thái: **Còn theo dõi (đã cải thiện mạnh)**.
- Hiện tại đã bổ sung `@PreAuthorize` cho endpoint thao tác nội bộ và tách endpoint public riêng.
- Phần còn lại là chuẩn hóa triệt để policy theo một convention duy nhất (route-level tối thiểu + method-level đầy đủ) để dễ bảo trì lâu dài.

### 11) [Low] FE thiếu `REFUNDED` trong BookingStatus

- Trạng thái: **Đã xử lý**.
- File: `frontend/src/features/booking/types.ts`

### 12) [Low] Duplicate annotation phone trong `CreateBookingRequest`

- Trạng thái: **Đã xử lý**.
- File: `backend/src/main/java/com/bus/system/modules/sales/dto/request/CreateBookingRequest.java`

## Kiểm tra nhanh sau sửa

Đã kiểm tra lỗi trên các file chỉnh trong đợt này:
- `backend/src/main/java/com/bus/system/config/SecurityConfig.java`
- `backend/src/main/java/com/bus/system/modules/sales/controller/BookingController.java`
- `frontend/src/features/booking/services/booking-service.ts`
- `frontend/src/app/(public)/booking/lookup/page.tsx`

Kết quả: không phát hiện lỗi biên dịch/phân tích tĩnh ở các file trên.

## Đề xuất bước tiếp theo

1. Chốt convention bảo mật cuối cùng cho module booking (route-level vs method-level) và áp dụng đồng bộ.
2. Bổ sung test tích hợp cho 2 endpoint public mới (`cancel booking`, `cancel ticket` theo `code + phone`).
3. Bổ sung test regression cho quyền truy cập anonymous/authenticated trên toàn bộ `/api/bookings/**`.
