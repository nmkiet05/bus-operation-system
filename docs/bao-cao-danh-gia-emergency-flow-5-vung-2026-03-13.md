# Báo cáo đánh giá Emergency Flow — 5 Vùng (Operation)

Ngày đánh giá: 13/03/2026  
Nguồn đối chiếu:
- Tài liệu: `C:\Users\ADMIN\.gemini\antigravity\brain\c9e5a31d-4140-40a8-bfed-89c4b867a1dd\refactor_plan.md.resolved` (mục "Emergency Flow — 5 Vùng").
- Mã nguồn Backend/Frontend trong workspace hiện tại.

## 1. Kết luận nhanh

Đánh giá tổng thể: **ĐÃ đáp ứng phần lớn ở Backend**, nhưng **CHƯA đáp ứng đầy đủ end-to-end** theo kỳ vọng vận hành vì còn các khoảng trống quan trọng ở luồng quản trị và chặn sai thao tác.

Mức độ đáp ứng đề xuất:
- Backend domain/service/scheduler: **~85%**
- Frontend quản trị cho flow 5 vùng: **~45%**
- End-to-end (người dùng nghiệp vụ thao tác được đầy đủ): **~60%**

## 2. Các điểm đã đáp ứng đúng theo “5 Vùng”

### 2.1. Mô hình 5 vùng đã có đầy đủ
- Enum vùng khẩn cấp đã có đủ: `STANDARD`, `URGENT`, `CRITICAL`, `DEPARTED`, `MID_ROUTE`.
- Có hàm phân loại hành vi theo vùng:
  - `isRejectAllowed()`
  - `isAutoExecute()`
  - `requiresIncidentInfo()`
- Bằng chứng: `backend/src/main/java/com/bus/system/modules/operation/domain/enums/ChangeUrgencyZone.java`.

### 2.2. Logic xác định vùng theo thời gian đã có
- Phân vùng theo phút đến giờ khởi hành:
  - `> urgentWindow` => `STANDARD`
  - `> handoverGap` => `URGENT`
  - còn lại => `CRITICAL`
- Trip đang `RUNNING/COMPLETED` => `DEPARTED`.
- Bằng chứng: `backend/src/main/java/com/bus/system/modules/operation/service/impl/TripChangeResolver.java`.

### 2.3. Auto-execute đúng cho vùng khẩn cấp
- `CRITICAL` và `DEPARTED` được auto-execute ngay trong `createZonedRequest`.
- `MID_ROUTE` dùng endpoint riêng `/incident`, auto-execute ngay.
- Bằng chứng: `backend/src/main/java/com/bus/system/modules/operation/service/impl/TripChangeServiceImpl.java`.

### 2.4. URGENT timeout => escalate đã có scheduler
- Job quét định kỳ request `URGENT` quá hạn (theo `escalationTimeoutMinutes`) và auto-execute.
- Chuyển trạng thái sang `ESCALATED` trước khi execute.
- Bằng chứng:
  - `backend/src/main/java/com/bus/system/modules/operation/scheduler/TripChangeEscalationJob.java`
  - `backend/src/main/java/com/bus/system/modules/operation/repository/TripChangeRepository.java`

### 2.5. Hậu kiểm emergency đã có API riêng
- Có endpoint hậu kiểm: `POST /api/operation/trip-changes/{id}/review`.
- Có endpoint báo sự cố dọc đường: `POST /api/operation/trip-changes/incident`.
- Có endpoint rollback: `POST /api/operation/trip-changes/{id}/rollback`.
- Bằng chứng: `backend/src/main/java/com/bus/system/modules/operation/controller/TripChangeController.java`.

### 2.6. Hành vi đổi tài xế/xe giữa đường có nền tảng
- Đổi tài xế dùng `DriverAssignmentService.replaceDriver(...)`, chuyển cũ sang `ENDED_EARLY`, tạo assignment mới.
- Ca xe có `endEarly()` và cho phép checkout sau đó.
- Bằng chứng:
  - `backend/src/main/java/com/bus/system/modules/operation/service/impl/DriverAssignmentServiceImpl.java`
  - `backend/src/main/java/com/bus/system/modules/operation/domain/DriverAssignment.java`
  - `backend/src/main/java/com/bus/system/modules/operation/domain/BusAssignment.java`

## 3. Các điểm chưa đáp ứng hoặc rủi ro cao

### 3.1. Lỗ hổng nghiệp vụ: vẫn có thể reject emergency qua API reject thường
Mức độ: **Cao**

- Kỳ vọng từ tài liệu: vùng `DEPARTED` và `MID_ROUTE` **cấm reject**.
- Thực tế code:
  - `review(...)` trong entity `TripChange` có chặn reject theo vùng (`isRejectAllowed`).
  - Nhưng endpoint `rejectRequest` lại đi thẳng `request.reject(...)` trên trạng thái `PENDING`, không kiểm tra vùng khẩn cấp.
- Hệ quả:
  - Request auto-execute (đặc biệt `DEPARTED`) vẫn có nguy cơ bị từ chối qua nhầm endpoint, trái rule “cấm reject”.
- Bằng chứng:
  - `backend/src/main/java/com/bus/system/modules/operation/service/impl/TripChangeServiceImpl.java`
  - `backend/src/main/java/com/bus/system/modules/operation/domain/TripChange.java`

### 3.2. Frontend chưa triển khai đầy đủ flow 5 vùng
Mức độ: **Cao**

- Màn hình FE hiện chỉ gọi:
  - `getAll`, `approve`, `reject`.
- Chưa thấy FE gọi:
  - `create` request,
  - `incident`,
  - `review` emergency,
  - `rollback`.
- Hệ quả:
  - Không thao tác đầy đủ theo mô hình 5 vùng từ UI hiện tại.
- Bằng chứng:
  - `frontend/src/features/admin/services/trip-change-service.ts`
  - `frontend/src/app/(admin)/admin/operation/trip-changes/page.tsx`

### 3.3. Lệch trạng thái FE-BE ở Trip Change
Mức độ: **Trung bình**

- Backend có trạng thái `ESCALATED` (sau timeout URGENT).
- FE đang cấu hình trạng thái theo bộ khác (`AUTO_APPROVED`, `ROLLBACK`, ...), không có hiển thị riêng cho `ESCALATED`.
- Hệ quả:
  - UI có thể hiển thị sai ngữ nghĩa trạng thái hoặc fallback không chuẩn.
- Bằng chứng:
  - `backend/src/main/java/com/bus/system/modules/operation/domain/enums/ChangeRequestStatus.java`
  - `frontend/src/app/(admin)/admin/operation/trip-changes/page.tsx`
  - `frontend/src/features/admin/services/trip-change-service.ts`

### 3.4. Cấu hình ngưỡng 5 vùng chưa khai báo tường minh trong `application.yml`
Mức độ: **Thấp/Trung bình**

- `OperationProperties` có các field:
  - `urgentWindowMinutes`, `handoverGapMinutes`, `escalationTimeoutMinutes`.
- Nhưng `application.yml` hiện chỉ cấu hình `anti-spam` và `rollback-window`; các field còn lại đang dùng default trong code.
- Hệ quả:
  - Dễ lệch kỳ vọng khi môi trường khác nhau, khó audit cấu hình.
- Bằng chứng:
  - `backend/src/main/java/com/bus/system/modules/operation/config/OperationProperties.java`
  - `backend/src/main/resources/application.yml`

## 4. Đánh giá theo từng vùng

### Vùng 1 — STANDARD
- Mục tiêu: tạo request, chờ admin approve/reject.
- Trạng thái: **Đạt** (Backend).

### Vùng 2 — URGENT
- Mục tiêu: chờ admin trong timeout, quá hạn auto-escalate.
- Trạng thái: **Đạt phần backend**, nhưng **thiếu hiển thị/trải nghiệm FE** cho trạng thái `ESCALATED` và hậu kiểm.

### Vùng 3 — CRITICAL
- Mục tiêu: auto-execute, sau đó hậu kiểm (có thể reject).
- Trạng thái: **Đạt phần backend** (auto-execute + review API có).
- Ghi chú: FE chưa có thao tác review.

### Vùng 4 — DEPARTED
- Mục tiêu: auto-execute, hậu kiểm, **cấm reject**.
- Trạng thái: **Chưa đạt tuyệt đối** do có đường `rejectRequest` có thể đi vòng rule.

### Vùng 5 — MID_ROUTE
- Mục tiêu: endpoint incident riêng, auto-execute, lưu incident_type/gps, cấm reject.
- Trạng thái: **Đạt backend API**, nhưng **FE chưa dùng** endpoint incident/review.

## 5. Kiến nghị ưu tiên sửa

### Ưu tiên 1 (bắt buộc)
- Chặn reject qua endpoint thường đối với emergency/auto-execute:
  - Tại `rejectRequest(...)` cần từ chối nếu `urgencyZone.isAutoExecute()` hoặc bắt buộc đi `reviewEmergencyRequest(...)`.

### Ưu tiên 2
- Hoàn thiện FE cho 5 vùng:
  - Thêm thao tác `review`, `rollback`, `incident`, `create`.
  - Ẩn/disable nút reject theo vùng không cho phép.
  - Hiển thị đúng trạng thái `ESCALATED`.

### Ưu tiên 3
- Đồng bộ contract trạng thái FE-BE:
  - Chuẩn hóa enum status/label theo backend (`PENDING`, `ESCALATED`, `APPROVED`, `REJECTED`, `CANCELLED`).

### Ưu tiên 4
- Khai báo tường minh ngưỡng 5 vùng trong `application.yml`:
  - `operation.trip-change.urgent-window-minutes`
  - `operation.trip-change.handover-gap-minutes`
  - `operation.trip-change.escalation-timeout-minutes`

## 6. Kết luận cuối

Nếu xét riêng backend core logic thì kiến trúc “Emergency Flow — 5 Vùng” đã được triển khai khá đầy đủ.  
Tuy nhiên, xét theo yêu cầu vận hành thực tế (người dùng thao tác qua FE + bảo toàn quy tắc cấm reject ở vùng 4/5), hệ thống **chưa đạt hoàn toàn** và cần xử lý ngay các điểm ở mục 3.1 và 3.2.
