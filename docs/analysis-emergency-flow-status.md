# Báo Cáo Phân Tích: Kế Hoạch Emergency Flow 5 Vùng
**Ngày phân tích:** 2026-03-14

Sau khi đọc bản kế hoạch `plan-refactor-emergency-flow-5-vung.md` và rà soát trực tiếp source code của dự án, tôi nhận thấy tiến độ tổng thể của quy trình này đang ở mức **hoàn thiện khá tốt bên dưới Backend**, nhưng **còn thiếu sót thao tác người dùng ở Frontend**. 

Dưới đây là chi tiết đối chiếu:

## 1. Tầng Backend (Pha 1, 2, 3, 6): Hoàn thiện ~90%
- **Pha 1 (Quy tắc nghiệp vụ 5 Vùng):** Đã phân tách thành cấu trúc sạch (SRP) với `TripChangeValidator`, `TripChangeResolver`, và `TripChangeExecutor`. Enum `ChangeUrgencyZone` đã định nghĩa đầy đủ 5 vùng (`STANDARD`, `URGENT`, `CRITICAL`, `DEPARTED`, `MID_ROUTE`) cùng các rule như `isRejectAllowed()`, `isAutoExecute()`.
- **Pha 3 (Cấu hình vận hành):** Đã rút các cấu hình cứng (hardcode) ra file cấu hình thông qua class `OperationProperties.java` (ví dụ: `urgentWindowMinutes = 60`, `antiSpamCooldownMinutes`).
- **Pha 6 (Side-effect và Auto-escalate):** Đã có Job Cron `TripChangeEscalationJob` chuyên quét mỗi phút để tìm các yêu cầu `URGENT` quá thời gian chờ (10 phút) nhằm tự động auto-execute.

## 2. Tầng Frontend (Pha 4, 5, 7): Mới hoàn thiện ~40%
- **Pha 4 (Đồng bộ API):** Đã hoàn tất (chính là những phần tôi vừa fix xong, cập nhật lại Enum và Schema để Frontend nhận đúng Payload).
- **Pha 5 (Hoàn thiện UX 5 vùng - ĐANG LỖI/THIẾU):**
  - **Lỗi UX (Guard):** Tại trang danh sách yêu cầu đổi ca (`trip-changes/page.tsx`), các yêu cầu đang ở trạng thái `PENDING` đều hiển thị nút "Duyệt" và "Từ chối". Tuy nhiên, theo quy tắc, Vùng `DEPARTED` (đã khởi hành) và `MID_ROUTE` (sự cố) **KHÔNG CHO PHÉP TỪ CHỐI**. Hiện tại UI chưa chặn nút "Từ chối" này (chờ tới khi User bấm thì gọi xuống Backend mới bị báo lỗi văng Exception).
  - **Thiếu chức năng:** Chưa ráp các Action/Modal để thực hiện hành động "Hậu kiểm" (Review) cho các Emergency request đã bị Auto-Execute (Vùng Critical).
  - **Thiếu chức năng:** Chưa có UI Modal riêng hoặc form dành cho Tài xế / Điều hành báo cáo "Sự cố dọc đường" (nhập `incidentType`, tọa độ `incidentGps`).
  - **Thiếu chức năng:** Chưa thấy form hỗ trợ tính năng "Hoàn tác" (Rollback) chuyến đi nếu còn trong cửa sổ thời gian.

## 3. Kết luận
Hệ thống **thiếu đồng bộ giữa sức mạnh của Backend và giao diện Frontend**. Backend đã có đầy đủ lớp giáp rào cản luồng (validator, auto-escalation), nhưng UI Frontend chỉ mới hiển thị "màu nền" cho 5 Vùng chứ chưa thực sự khóa nút (disable button) hay hỗ trợ quy trình riêng biệt của từng Vùng.

**Khuyến nghị bước tiếp theo:** Tập trung toàn lực vào xử lý **Pha 5**. 
1. Thêm hàm kiểm tra chặn thao tác (Vô hiệu hóa hoặc ẩn nút *Từ chối* nếu zone thuộc diện cấm).
2. Vẽ bổ sung Modal/Popup thực hiện "Hậu Kiểm" (Emergency Review) và "Rollback" bên giao diện Admin.
