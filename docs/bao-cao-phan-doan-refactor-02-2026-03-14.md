# Báo cáo Phân Đoạn Refactor 02 (2026-03-14)

## Mục tiêu phân đoạn
Đồng bộ một phần lệch DB/BE cho `trip_change_request` và chuẩn hóa cấu hình ngưỡng 5 vùng trong `application.yml`.

## Thay đổi đã thực hiện

1. Cập nhật schema trực tiếp trong `V1__init_schema.sql`:
- Đổi mặc định `change_type` từ `DRIVER` sang `REPLACE_DRIVER`.
- Bổ sung cột `urgency_zone VARCHAR(20) DEFAULT 'STANDARD'`.
- Cập nhật comment `status` để phản ánh đầy đủ trạng thái có `ESCALATED`.
- Cập nhật comment mô tả `change_type` theo enum hiện tại:
  - `REPLACE_DRIVER`, `REPLACE_CO_DRIVER`, `REPLACE_ATTENDANT`, `REPLACE_BUS`, `INCIDENT_SWAP`.
- Bổ sung comment mô tả `urgency_zone`:
  - `STANDARD`, `URGENT`, `CRITICAL`, `DEPARTED`, `MID_ROUTE`.

2. Cập nhật cấu hình tường minh trong `application.yml`:
- `operation.trip-change.urgent-window-minutes: 60`
- `operation.trip-change.handover-gap-minutes: 15`
- `operation.trip-change.escalation-timeout-minutes: 10`

## Kiểm tra sau thay đổi
- Chạy compile backend: `mvnw.cmd -DskipTests compile`
- Kết quả: **BUILD SUCCESS**.

## Phạm vi tác động
- Tác động trực tiếp vào file schema gốc và cấu hình runtime.
- Không thay đổi code Java trong phân đoạn này.

## Rủi ro còn lại
- Vì sửa trực tiếp `V1__init_schema.sql`, môi trường đã migrate trước đó có thể không tự nhận thay đổi cột nếu không clean/migrate lại theo chính sách hiện tại.
- Chưa thêm CHECK CONSTRAINT cho `incident_type`/`urgency_zone`/`status`; đây là bước cứng hóa schema ở phân đoạn kế tiếp.

## Kế hoạch phân đoạn tiếp theo
- Phân đoạn 03: cứng hóa ràng buộc schema cho `trip_change_request` (CHECK CONSTRAINT) theo enum vận hành thực tế, giữ tương thích với BE hiện tại.
