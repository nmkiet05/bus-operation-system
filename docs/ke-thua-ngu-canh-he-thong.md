# Kế Thừa Ngữ Cảnh Hệ Thống BOS

Cập nhật lần cuối: 2026-03-13
Phạm vi: Toàn bộ workspace `bus-operation-system`
Mục tiêu: Giúp người mới hoặc phiên làm việc sau nắm ngữ cảnh nhanh trong 10-15 phút.

## 1. Tổng quan kiến trúc

Hệ thống BOS (Bus Operation System) là monorepo gồm:
- `backend`: Spring Boot (Java 21), cung cấp API nghiệp vụ.
- `frontend`: Next.js (App Router), giao diện khách + admin.
- `docker-compose.yml`: orchestration local cho PostgreSQL, Redis, PgAdmin, backend, frontend.

Stack chính:
- Backend: Spring Boot 3.4, JPA, Security, JWT, Redis/Redisson, Flyway, QueryDSL.
- Frontend: Next.js 15, React 18, TypeScript, Tailwind, React Query, Axios.

## 2. Cách chạy nhanh

### Chạy full hệ thống bằng Docker
- Script nhanh: `start-app.bat`
- Endpoint mặc định:
  - Frontend: `http://localhost:3000`
  - Backend API: `http://localhost:8080/api`
  - Swagger: `http://localhost:8080/swagger-ui/index.html`

### Hạ tầng Docker Compose
- `postgres` (5432)
- `redis` (6379)
- `pgadmin` (5050)
- `backend` (8080)
- `frontend` (3000)

## 3. Cấu trúc backend theo domain

Thư mục chính: `backend/src/main/java/com/bus/system/modules`
- `identity`: đăng nhập, đăng ký, JWT, refresh token.
- `catalog`: tỉnh, bến xe, phòng vé, depot.
- `fleet`: loại xe, xe.
- `planning`: tuyến đường, lịch trình mẫu, điểm đón/trả.
- `operation`: điều hành chuyến, phân công tài nguyên, trip-change, handover.
- `sales`: booking, ticket, seat-map, expire booking.
- `pricing`: bảng giá/chính sách giá.
- `payment`: xử lý thanh toán.
- `hr`, `system`, `notification`.

## 4. Cấu trúc frontend theo vùng chức năng

Thư mục chính: `frontend/src`
- `app/(public)`: trang khách (home, trips, booking, lookup, success).
- `app/(auth)`: login/register.
- `app/(admin)`: trang quản trị.
- `features/booking`: booking flow, form, service booking.
- `features/admin`: service/admin pages cho operation/planning/fleet/sales.
- `services/http/axios.ts`: axios instance + interceptor JWT.
- `middleware.ts`: bảo vệ route dashboard/admin/profile.

## 5. Luồng nghiệp vụ cốt lõi

### 5.1 Booking (Sales)
- Tạo booking qua `POST /api/bookings`.
- Ghế được bảo vệ bằng distributed lock (Redisson), có idempotency key.
- Booking mặc định `PENDING`, có `expiredAt`.
- Job nền `BookingExpiryJob` chạy mỗi phút để expire booking quá hạn.
- Seat-map dùng endpoint: `GET /api/operation/trips/{id}/seat-map`.

Các file trọng tâm:
- `backend/src/main/java/com/bus/system/modules/sales/service/impl/BookingServiceImpl.java`
- `backend/src/main/java/com/bus/system/modules/sales/scheduler/BookingExpiryJob.java`
- `backend/src/main/java/com/bus/system/modules/sales/repository/TicketRepository.java`
- `frontend/src/features/booking/services/booking-service.ts`
- `frontend/src/app/(public)/booking/[tripId]/page.tsx`

### 5.2 Operation (Điều hành)
- Tạo chuyến: `TripGenerationServiceImpl` (auto/manual).
- Điều độ: gán xe/tài xế ở trạng thái `SCHEDULED`.
- Duyệt chuyến: `SCHEDULED -> APPROVED`.
- Vòng đời: `APPROVED -> RUNNING -> COMPLETED`; có thể `CANCELLED` ở giai đoạn hợp lệ.
- Resource availability: lọc theo đăng ký tuyến, loại xe, overlap, scoring.
- Trip-change: vùng khẩn cấp `STANDARD/URGENT/CRITICAL/DEPARTED/MID_ROUTE`.

Các file trọng tâm:
- `backend/src/main/java/com/bus/system/modules/operation/service/impl/TripGenerationServiceImpl.java`
- `backend/src/main/java/com/bus/system/modules/operation/service/impl/TripDispatchServiceImpl.java`
- `backend/src/main/java/com/bus/system/modules/operation/service/impl/TripLifecycleServiceImpl.java`
- `backend/src/main/java/com/bus/system/modules/operation/service/impl/ResourceAvailabilityServiceImpl.java`
- `backend/src/main/java/com/bus/system/modules/operation/service/impl/TripChangeServiceImpl.java`

## 6. Bảo mật và phân quyền hiện tại (điểm quan trọng)

### SecurityConfig
File: `backend/src/main/java/com/bus/system/config/SecurityConfig.java`

Public hiện cho phép:
- `/api/auth/**`
- `/api/catalog/**`
- `GET /api/operation/trips/search`
- `GET /api/operation/trips/*/seat-map`
- `POST /api/bookings`
- `GET /api/bookings/search`
- `GET /api/bookings/*`
- `POST /api/bookings/public/**` (luồng hủy công khai theo mã + SĐT)

Các API booking thao tác nội bộ đã yêu cầu role `ADMIN/STAFF` ở controller.

## 7. Hợp đồng FE-BE đã đồng bộ gần đây

- TripChange frontend đã dùng zone backend:
  - `STANDARD`, `URGENT`, `CRITICAL`, `DEPARTED`, `MID_ROUTE`.
- TripChange field frontend đã đổi theo backend:
  - `requestReason`, `rejectedReason`, `createdBy`.
- Type `approve/reject/rollback` ở frontend service đã đổi `Promise<void>`.
- `BookingStatus` frontend đã có thêm `REFUNDED`.

## 8. Báo cáo và tài liệu hiện có

- Báo cáo tổng hợp lỗi + trạng thái xử lý:
  - `docs/bao-cao-van-de-operation-booking-2026-03-13.md`
- Báo cáo sửa lỗi booking/operation (nếu cần đối chiếu):
  - `docs/bao-cao-da-xu-ly-loi-booking-2026-03-13.md`
- Tài liệu FDD nghiệp vụ backend:
  - `backend/fdd-bos.md`
- OpenAPI snapshot:
  - `bos-openapi-spec.json`

## 9. Checklist kế thừa nhanh cho phiên sau

1. Đọc file này + `docs/bao-cao-van-de-operation-booking-2026-03-13.md`.
2. Kiểm tra `SecurityConfig` trước khi thêm endpoint mới.
3. Khi sửa booking:
   - Rà lock Redisson + idempotency + trạng thái booking.
4. Khi sửa operation:
   - Không phá state machine chuyến.
   - Rà overlap (xe/tài xế) và ràng buộc route registration.
5. Luôn đối chiếu contract FE-BE nếu đổi DTO hoặc enum.
6. Chạy kiểm tra lỗi file vừa sửa bằng Problems/diagnostics trước khi commit.

## 10. Gợi ý cải tiến tiếp theo

- Chuẩn hóa hoàn toàn chính sách auth booking theo một convention duy nhất (route-level tối thiểu + method-level đầy đủ).
- Bổ sung integration test cho endpoint public mới:
  - hủy booking theo `code + phone`
  - hủy vé lẻ theo `code + phone + ticketId`
- Bổ sung regression test cho role-based access toàn bộ `/api/bookings/**`.
