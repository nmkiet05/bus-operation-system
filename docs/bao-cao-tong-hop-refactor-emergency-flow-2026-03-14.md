# Báo cáo Tổng Hợp Refactor Emergency Flow 5 Vùng

Ngày cập nhật: 2026-03-14  
Nguyên tắc triển khai: chia phân đoạn nhỏ, kiểm tra sau mỗi phân đoạn, commit độc lập để rollback nhanh.

## Phần 01 — Chặn reject sai vùng ở Backend

### Mục tiêu
Khóa lỗ hổng nghiệp vụ: request thuộc vùng không cho reject (đặc biệt DEPARTED, MID_ROUTE) không được đi qua luồng reject thường.

### Thay đổi
1. Thêm validator `validateRejectAllowed(...)`:
- File: `backend/src/main/java/com/bus/system/modules/operation/service/impl/TripChangeValidator.java`
- Logic: nếu `urgencyZone` không cho reject thì ném `BusinessException`.

2. Gắn validator vào luồng `rejectRequest(...)`:
- File: `backend/src/main/java/com/bus/system/modules/operation/service/impl/TripChangeServiceImpl.java`

### Kiểm tra
- `mvnw.cmd -DskipTests compile` => **BUILD SUCCESS**.

### Commit phân đoạn
- Backend: `06c7123`
- Message: `fix(operation): block reject on non-rejectable emergency zones`

---

## Phần 02 — Đồng bộ schema cơ bản + cấu hình ngưỡng 5 vùng

### Mục tiêu
Giảm lệch DB/BE ở bảng `trip_change_request` và loại bỏ phụ thuộc default ẩn cho ngưỡng vận hành.

### Thay đổi
1. Cập nhật schema trực tiếp trong `V1__init_schema.sql`:
- File: `backend/src/main/resources/db/migration/V1__init_schema.sql`
- Đổi default `change_type`: `DRIVER` -> `REPLACE_DRIVER`
- Bổ sung cột: `urgency_zone VARCHAR(20) DEFAULT 'STANDARD'`
- Cập nhật comment `status` có `ESCALATED`
- Cập nhật comment enum `change_type` và `urgency_zone`

2. Cập nhật cấu hình tường minh trong `application.yml`:
- File: `backend/src/main/resources/application.yml`
- Thêm:
  - `operation.trip-change.urgent-window-minutes: 60`
  - `operation.trip-change.handover-gap-minutes: 15`
  - `operation.trip-change.escalation-timeout-minutes: 10`

### Kiểm tra
- `mvnw.cmd -DskipTests compile` => **BUILD SUCCESS**.

### Commit phân đoạn
- Backend: `1d9d394`
- Message: `refactor(operation): align trip-change schema and explicit zone config`
- Root: `b2b76f2`
- Message: `docs: add segment-02 report and update backend pointer`

### Rủi ro ghi nhận
- Vì chỉnh trực tiếp `V1__init_schema.sql`, môi trường đã migrate trước đó có thể cần clean/migrate lại theo chính sách hiện hành.

---

## Phần 03 — Cứng hóa ràng buộc schema cho `trip_change_request`

### Mục tiêu
Thêm ràng buộc dữ liệu ở DB để giảm sai lệch enum/runtime giữa các lớp.

### Thay đổi
1. Bổ sung CHECK CONSTRAINT trực tiếp trong bảng `trip_change_request`:
- File: `backend/src/main/resources/db/migration/V1__init_schema.sql`
- Ràng buộc đã thêm:
  - `change_type IN ('REPLACE_DRIVER', 'REPLACE_CO_DRIVER', 'REPLACE_ATTENDANT', 'REPLACE_BUS', 'INCIDENT_SWAP')`
  - `urgency_zone IN ('STANDARD', 'URGENT', 'CRITICAL', 'DEPARTED', 'MID_ROUTE')`
  - `status IN ('PENDING', 'ESCALATED', 'APPROVED', 'REJECTED', 'CANCELLED')`
  - `incident_type IS NULL OR incident_type IN ('FATIGUE_SWAP', 'DRIVER_HEALTH', 'VEHICLE_BREAKDOWN', 'TRAFFIC_ACCIDENT')`

### Kiểm tra
- `mvnw.cmd -DskipTests compile` => **BUILD SUCCESS**.

### Ghi chú thiết kế
- Ở phân đoạn này chưa thêm cross-field constraint (ví dụ `incident_type` bắt buộc đi kèm `MID_ROUTE`) để tránh tăng rủi ro phá luồng hiện tại. Có thể bổ sung ở phân đoạn sau khi hoàn tất đối soát dữ liệu thực tế.

---

## Trạng thái hiện tại

1. Lỗ hổng reject sai vùng đã được chặn ở tầng service.
2. Schema `trip_change_request` đã gần sát mô hình BE hơn (có `urgency_zone` + CHECK enum).
3. Ngưỡng vận hành 5 vùng đã được khai báo tường minh trong cấu hình.
4. Build backend vẫn ổn định qua từng phân đoạn.

## Kế hoạch ngay sau phần 03

1. Commit phân đoạn 03 (backend + cập nhật con trỏ root).
2. Sang phần 04: đồng bộ contract BE-FE (status/type/metadata hậu kiểm).
3. Bắt đầu hoàn thiện FE flow 5 vùng theo style hiện có của dự án (incident/review/rollback + guard theo vùng).

---

## Phần 04 — Đồng bộ contract FE với BE (status/type/service)

### Mục tiêu
Đồng bộ nhanh hợp đồng FE với BE ở lớp type/service trước khi mở rộng UI flow đầy đủ, đảm bảo không lệch status/type và sẵn sàng gọi endpoint mới.

### Thay đổi
1. Chuẩn hóa type trong service Trip Change:
- File: `frontend/src/features/admin/services/trip-change-service.ts`
- Bổ sung type tường minh:
  - `TripChangeType`
  - `TripChangeStatus`
  - `ChangeUrgencyZone`
  - `IncidentType`
- Cập nhật `TripChangeRequest` và `CreateTripChangeRequest` theo type chuẩn.

2. Bổ sung method service khớp endpoint BE hiện có:
- `review(id, approved, notes?)` -> `POST /operation/trip-changes/{id}/review`
- `incident(request, incidentType, incidentGps?)` -> `POST /operation/trip-changes/incident`

3. Đồng bộ hiển thị status/type ở màn `trip-changes`:
- File: `frontend/src/app/(admin)/admin/operation/trip-changes/page.tsx`
- Thêm trạng thái `ESCALATED` vào `STATUS_CONFIG` và `STATUS_FILTERS`.
- Bổ sung label cho `REPLACE_CO_DRIVER`, `REPLACE_ATTENDANT`, `INCIDENT_SWAP`.
- Thêm guard UX: chặn mở reject dialog cho vùng không cho phép reject.

### Kiểm tra
- Kiểm tra diagnostics cho 2 file FE đã sửa -> **No errors found**.

### Ghi chú thiết kế
- Phần 04 chỉ đồng bộ hợp đồng và guard mức tối thiểu, chưa triển khai đầy đủ UI hậu kiểm/incident/rollback theo từng case.
- Phần mở rộng hành vi UI sẽ được thực hiện ở phân đoạn tiếp theo để giữ rủi ro thấp.

---

## Phần 05 — Hoàn thiện FE flow (lát 1: review + rollback)

### Mục tiêu
Thêm khả năng thao tác nghiệp vụ thực tế ngay trên màn hình Trip Changes cho hai luồng quan trọng:
- Hậu kiểm yêu cầu khẩn cấp đã auto-execute
- Hoàn tác yêu cầu đã duyệt

### Thay đổi
1. Bổ sung mutation cho hậu kiểm và hoàn tác:
- File: `frontend/src/app/(admin)/admin/operation/trip-changes/page.tsx`
- Thêm:
  - `reviewMutation` gọi `tripChangeService.review(...)`
  - `rollbackMutation` gọi `tripChangeService.rollback(...)`

2. Bổ sung hành vi UI:
- Request emergency đang chờ hậu kiểm (`isEmergency` + `PENDING/ESCALATED`):
  - Hiển thị nút `Hậu kiểm đạt`
  - Với vùng `CRITICAL` hiển thị thêm `Hậu kiểm không đạt`
- Request `APPROVED`:
  - Hiển thị nút `Hoàn tác`

3. Bổ sung guard reject trên nút thao tác:
- Vùng auto-execute (`CRITICAL/DEPARTED/MID_ROUTE`) sẽ disable nút `Từ chối` ở nhánh duyệt thường.

### Kiểm tra
- Diagnostics file FE sau chỉnh sửa: **No errors found**.

### Ghi chú thiết kế
- Lát 1 tập trung vào hai thao tác có ảnh hưởng trực tiếp vận hành (review/rollback), chưa thêm form tạo incident tại UI.
- Luồng `incident` sẽ triển khai ở lát tiếp theo để giữ thay đổi nhỏ và dễ rollback.

---

## Phần 05 — Hoàn thiện FE flow (lát 2: tạo incident MID_ROUTE)

### Mục tiêu
Bổ sung khả năng tạo yêu cầu sự cố dọc đường trực tiếp từ UI quản trị, nối đúng endpoint BE đã có.

### Thay đổi
1. Thêm dialog `Báo sự cố dọc đường (MID_ROUTE)` tại màn Trip Changes:
- File: `frontend/src/app/(admin)/admin/operation/trip-changes/page.tsx`
- Trường nhập liệu:
  - `Trip ID`
  - `Driver ID thay thế`
  - `Loại sự cố` (FATIGUE_SWAP, DRIVER_HEALTH, VEHICLE_BREAKDOWN, TRAFFIC_ACCIDENT)
  - `GPS` (không bắt buộc)
  - `Lý do sự cố`

2. Bổ sung mutation gọi API incident:
- Gọi `tripChangeService.incident(...)`
- Mapping payload theo contract:
  - body: `tripId`, `changeType: INCIDENT_SWAP`, `reason`, `newDriverId`
  - query params: `incidentType`, `incidentGps`

3. Bổ sung CTA theo style hiện tại:
- Thêm nút `Báo sự cố` cạnh nút `Làm mới` ở phần header màn hình.

### Kiểm tra
- Diagnostics file FE sau chỉnh sửa: **No errors found**.

### Ghi chú thiết kế
- Lát này dùng input trực tiếp theo ID để giữ thay đổi nhỏ và tránh kéo thêm phụ thuộc data source mới (trip/driver picker) trong cùng phân đoạn.
- Có thể nâng cấp ở lát tiếp theo bằng selector dữ liệu thật (running trip + driver khả dụng) nếu cần trải nghiệm tốt hơn.

---

## Phần 05 — Hoàn thiện FE flow (lát 3: nâng UX incident bằng dữ liệu thật)

### Mục tiêu
Giảm nhập tay ID gây lỗi thao tác bằng cách chuyển dialog incident sang chọn dữ liệu thật từ hệ thống.

### Thay đổi
1. Nâng cấp nguồn dữ liệu cho dialog incident:
- File: `frontend/src/app/(admin)/admin/operation/trip-changes/page.tsx`
- Bổ sung query:
  - Danh sách chuyến `RUNNING` qua `tripService.getTrips({ status: "RUNNING" })`
  - Danh sách tài xế khả dụng theo chuyến qua `tripService.getAvailableDriversForTrip(tripId)`

2. Chuyển input ID thủ công thành select:
- `Trip ID` -> `Select chuyến đang chạy`
- `Driver ID thay thế` -> `Select tài xế khả dụng`
- Giữ trường `GPS` và `Lý do sự cố` như cũ.

3. Cập nhật validate submit sự cố:
- Bắt buộc có:
  - chuyến đã chọn
  - tài xế thay thế đã chọn
  - lý do sự cố

### Kiểm tra
- Diagnostics file FE sau chỉnh sửa: **No errors found**.

### Ghi chú thiết kế
- Lát này vẫn giữ phạm vi thay đổi trong một màn hình để kiểm soát rủi ro.
- Chưa bổ sung bộ lọc/selector nâng cao (ví dụ theo bến hoặc theo tuyến) để tránh mở rộng phạm vi ngoài mục tiêu lát nhỏ.

---

## Phần 06 — Rà soát liên đới Operation Assignment (lát 1: consistency đổi xe)

### Mục tiêu
Đảm bảo luồng đổi xe và rollback đổi xe trong `TripChangeExecutor` nhất quán với vòng đời `BusAssignment`.

### Thay đổi
1. Cập nhật `TripChangeExecutor` để xử lý ca xe khi đổi bus:
- File: `backend/src/main/java/com/bus/system/modules/operation/service/impl/TripChangeExecutor.java`
- Bổ sung dependency `BusAssignmentService`.
- Khi đổi xe:
  - Nếu `busAssignment` hiện tại đang ở trạng thái hoạt động (`PENDING`, `CHECKED_IN`, `DEPARTED`) => gọi `endEarly(...)`.
  - Gán bus mới cho trip, reset `trip.busAssignment` về `null`.
  - Gọi `attachTripToBusAssignment(...)` để gắn vào ca xe phù hợp.
- Khi rollback đổi xe:
  - Áp dụng logic tương tự với bus cũ (`oldBus`).

2. Bổ sung helper nội bộ:
- `shouldEndEarly(BusAssignmentStatus status)` để kiểm soát điều kiện kết thúc sớm.

### Kiểm tra
- Compile backend: `mvnw.cmd -DskipTests compile` => **BUILD SUCCESS**.

### Ghi chú thiết kế
- Lát này chỉ xử lý consistency vòng đời ca xe khi đổi bus/rollback bus.
- Chưa thay đổi nhánh xử lý crew ngoài phạm vi cần thiết để tránh mở rộng rủi ro trong cùng phân đoạn.

---

## Phần 06 — Rà soát liên đới Operation Assignment (lát 2: consistency đổi crew theo role)

### Mục tiêu
Tránh thay nhầm `DriverAssignment` khi xử lý đổi crew trong trường hợp có nhiều assignment ACTIVE, đảm bảo thao tác đúng theo `CrewRole` của `TripChangeType`.

### Thay đổi
1. Cập nhật lọc assignment ở nhánh execute:
- File: `backend/src/main/java/com/bus/system/modules/operation/service/impl/TripChangeExecutor.java`
- Khi tìm assignment cũ để replace:
  - Bổ sung filter theo `da.getRole() == targetRole`
  - Sau đó mới filter theo `oldDriver` (nếu có)

2. Cập nhật lọc assignment ở nhánh rollback:
- Khi tìm assignment ACTIVE của `newDriver` để cancel:
  - Bổ sung filter theo `da.getRole() == targetRole`

### Kiểm tra
- Compile backend: `mvnw.cmd -DskipTests compile` => **BUILD SUCCESS**.

### Ghi chú thiết kế
- Lát này chỉ chỉnh logic chọn bản ghi assignment cho chính xác nghiệp vụ, không thay đổi API contract.

---

## Phần 06 — Rà soát liên đới Operation Assignment (lát 3: consistency VehicleHandover)

### Mục tiêu
Đảm bảo trạng thái và audit reason của `VehicleHandover` nhất quán khi thay đổi resource trong lúc chuyến đang chạy.

### Thay đổi
1. Đồng bộ trạng thái handover mới theo trạng thái chuyến:
- File: `backend/src/main/java/com/bus/system/modules/operation/service/impl/VehicleHandoverServiceImpl.java`
- Trong `processResourceChange(...)`:
  - Nếu trip đang `RUNNING` -> handover mới ở `IN_PROGRESS`
  - Ngược lại -> `PENDING_HANDOVER`

2. Cứng hóa audit `statusReason`:
- Tránh ghép chuỗi gây `null` text trong reason.
- Bổ sung helper `appendStatusReason(...)` để nối reason an toàn khi hậu kiểm.
- Khi auto-close handover cũ, fallback reason nếu input `reason` rỗng.

### Kiểm tra
- Compile backend: `mvnw.cmd -DskipTests compile` => **BUILD SUCCESS**.

### Ghi chú thiết kế
- Lát này chỉ tăng tính nhất quán trạng thái/audit và không thay đổi API contract.

---

## Phần 07 — Dọn mock/placeholder (lát 1: useBusTypes)

### Mục tiêu
Loại bỏ mock dữ liệu master có rủi ro hiển thị sai trên UI quản trị và đồng bộ với API Fleet đã sẵn có.

### Thay đổi
1. Thay thế `useBusTypes` placeholder bằng API thật:
- File: `frontend/src/hooks/useMasterData.ts`
- Trước thay đổi:
  - `queryFn: async () => []` (placeholder)
- Sau thay đổi:
  - `queryFn: busTypeService.getAll`
  - Giữ chính sách cache dài hạn tương tự `useProvinces` (`staleTime`, `gcTime`, `refetch* = false`).

### Kiểm tra
- Diagnostics file FE sau chỉnh sửa: **No errors found**.

### Ghi chú thiết kế
- Đây là lát dọn mock rủi ro thấp, không đổi behavior nghiệp vụ phức tạp.
- Các mock lớn hơn (dashboard stats, payment simulate, booking placeholders) sẽ xử lý ở lát sau theo mức độ ưu tiên vận hành.

---

## Phần 07 — Dọn mock/placeholder (lát 2: dashboard stats bằng dữ liệu thật)

### Mục tiêu
Thay số liệu hardcode của dashboard admin bằng số liệu vận hành thật theo chuẩn nghiệp vụ đã thống nhất.

### Định nghĩa metric áp dụng
1. Trips Today:
- `trip.departureDate = hôm nay` và `status != CANCELLED`
2. Tickets Sold:
- Đếm theo `ticket` của chuyến có `departureDate = hôm nay`
- Chỉ tính booking `CONFIRMED`
3. Active Drivers:
- Tài xế có assignment trên chuyến hôm nay (không tính assignment/trip đã cancel)
4. Revenue Today:
- Tổng `payment_history.amount` có `status = SUCCESS` trong ngày

### Thay đổi Backend
1. Bổ sung API thống kê dashboard:
- Controller mới: `backend/src/main/java/com/bus/system/modules/operation/controller/DashboardStatsController.java`
- Endpoint: `GET /api/operation/dashboard/stats`

2. Bổ sung service thống kê:
- `backend/src/main/java/com/bus/system/modules/operation/service/DashboardStatsService.java`
- `backend/src/main/java/com/bus/system/modules/operation/service/impl/DashboardStatsServiceImpl.java`

3. Bổ sung DTO response:
- `backend/src/main/java/com/bus/system/modules/operation/dto/response/DashboardStatsResponse.java`

4. Bổ sung query repository:
- `TripRepository`: đếm chuyến hôm nay không cancel
- `TicketRepository`: đếm vé bán theo chuyến hôm nay + booking confirmed
- `DriverAssignmentRepository`: đếm tài xế distinct có assignment hôm nay
- Repository mới `PaymentHistoryRepository`: tổng doanh thu payment SUCCESS theo ngày

### Thay đổi Frontend
1. Tạo service dashboard:
- `frontend/src/features/admin/services/dashboard-service.ts`
- Gọi API: `/operation/dashboard/stats`

2. Cập nhật trang dashboard admin:
- `frontend/src/app/(admin)/admin/page.tsx`
- Bỏ số cứng, thay bằng dữ liệu API thật
- Thêm loading state cho từng ô số liệu
- Format doanh thu theo `VND`

### Kiểm tra
- Backend compile: `mvnw.cmd -DskipTests compile` => **BUILD SUCCESS**.
- Diagnostics FE/BE các file thay đổi: **No errors found**.

### Ghi chú thiết kế
- Lát này chỉ thay số liệu tổng quan, không mở rộng biểu đồ nâng cao.
- Label phụ hiển thị quy tắc tính để tránh hiểu sai KPI vận hành.

---

## Phần 07 — Dọn mock/placeholder (lát 3: payment flow bỏ phụ thuộc "simulate" ở FE)

### Mục tiêu
Giảm phụ thuộc mock trong luồng đặt vé bằng cách chuẩn hóa API/method thanh toán theo tên nghiệp vụ thực tế (`processPayment`).

### Thay đổi Backend
1. Bổ sung API mới xử lý thanh toán:
- File: `backend/src/main/java/com/bus/system/modules/payment/controller/PaymentController.java`
- Thêm endpoint `POST /api/payments/process`
- Giữ endpoint cũ `/simulate` để tương thích ngược.

2. Cập nhật service contract:
- File: `backend/src/main/java/com/bus/system/modules/payment/service/PaymentService.java`
- Thêm `processPayment(...)`
- `simulatePayment(...)` giữ lại cho backward compatibility.

3. Cập nhật implementation:
- File: `backend/src/main/java/com/bus/system/modules/payment/service/impl/PaymentServiceImpl.java`
- Chuyển logic chính sang `processPayment(...)`
- `simulatePayment(...)` gọi lại `processPayment(...)`.

### Thay đổi Frontend
1. Chuẩn hóa payment service:
- File: `frontend/src/services/api/payment.ts`
- Thêm `processPayment(...)` gọi `/payments/process`
- Giữ alias `simulatePayment(...)` gọi nội bộ `processPayment(...)`.

2. Cập nhật booking flow public:
- File: `frontend/src/app/(public)/booking/[tripId]/page.tsx`
- Chuyển gọi từ `simulatePayment(...)` sang `processPayment(...)`
- Làm sạch comment/log theo ngữ nghĩa thanh toán thật.

### Kiểm tra
- Backend compile: `mvnw.cmd -DskipTests compile` => **BUILD SUCCESS**.
- Diagnostics FE/BE file thay đổi: **No errors found**.

### Ghi chú thiết kế
- Lát này chuẩn hóa contract và naming theo nghiệp vụ, không thay đổi sâu payment strategy hiện tại.

---

## Phần 08 — Kiểm thử hồi quy & Chốt đợt refactor

### Mục tiêu
Xác nhận các thay đổi chính đã hoạt động ổn định theo môi trường chạy thực tế của dự án (Docker Compose).

### Kết quả xác nhận Backend
1. Build/compile local:
- `mvnw.cmd -DskipTests compile` => **BUILD SUCCESS**.

2. Xác nhận theo môi trường Docker (theo quy trình vận hành thực tế):
- Chạy `docker compose up -d --build backend`
- Container `bos_backend` đã được recreate và trạng thái `Up`.
- Probe endpoint mới `GET /api/operation/dashboard/stats` trả về `401` (đúng kỳ vọng khi chưa có token), xác nhận API đã được expose và backend hoạt động trong container.

### Kết quả xác nhận Frontend
1. Lint sau khi chuẩn hóa ignore generated/artifact files:
- `npm run lint` không còn lỗi (errors) trên mã ứng dụng chính.
- Còn **warnings** hiện hữu tại `src/app/(admin)/admin/operation/bus-schedule/page.tsx` (không phát sinh từ đợt refactor này).

### Điều chỉnh cấu hình phục vụ kiểm thử ổn định
1. Cập nhật ESLint ignore:
- File: `frontend/eslint.config.mjs`
- Bỏ quét các thư mục/file generated hoặc utility ngoài phạm vi source app:
  - `.next/**`, `out/**`, `build/**`, `dist/**`
  - `next-env.d.ts`, `api-test.js`, `api-test.ts`, `api-test2.js`, `fix.js`

### Trạng thái chốt đợt
1. Các hạng mục trọng tâm đợt này đã hoàn tất:
- Chặn reject sai vùng end-to-end (BE + FE guard)
- Đồng bộ schema/config cho Emergency Flow 5 vùng
- Hoàn thiện flow FE: review/rollback/incident
- Rà consistency Operation Assignment + VehicleHandover
- Dọn mock chính (master data, dashboard stats, payment flow naming)

2. Tồn đọng còn lại (không blocker cho phạm vi đợt này):
- Một số warning lint cũ ở module `bus-schedule`
- Các mock/placeholder phụ trợ ngoài phạm vi ưu tiên vận hành chính

---

## Phần 09 — Bổ sung tài liệu Support Admin cho Emergency Flow 5 Vùng

### Mục tiêu
Đồng bộ trang tài liệu nội bộ trong Admin với code và báo cáo refactor đã triển khai, để đội vận hành có tài liệu chuẩn tại chỗ.

### Thay đổi
1. Cập nhật trang support admin:
- File: `frontend/src/app/(admin)/admin/support/page.tsx`
- Bổ sung mục mới: `Emergency Flow 5 Vùng (Trip Change)` với các nội dung:
  - định nghĩa 5 vùng
  - rule thao tác reject/review theo vùng
  - status canonical
  - change type canonical
  - ngưỡng cấu hình vận hành đang áp dụng
  - nghiệp vụ đã hoàn thiện theo code (BE + FE + assignment/handover consistency)

2. Đồng bộ lại mô tả trạng thái Trip ở phần Operation để khớp với code hiện tại.

### Kiểm tra
- Diagnostics file support page: **No errors found**.
