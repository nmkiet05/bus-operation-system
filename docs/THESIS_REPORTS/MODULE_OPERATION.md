# MODULE: ĐIỀU HÀNH DIỄN BIẾN CHUYẾN XE (CORE OPERATION)

> **Mô tả:** Nếu các module khác là các mảnh ghép linh kiện rời rạc, thì **Module Operation** chính là Khối Động Cơ (Engine Block) ráp các linh kiện đó lại để xe nổ máy lăn bánh. Đây là "The Brain" - Bộ Não tự phán đoán, phân bổ nguồn lực Tài/Xe, và là Đơn Vị Phản Ứng Nhanh Giải Quyết Yêu Cầu Đổi Ca khẩn cấp 5 Vùng cực hạn của dự án Luận Văn Bus Operation.

## 1. Cụm Lõi Cơ Sở Dữ Liệu (Database Kernel)
Cơ cấu CSDL module Operation nhận hàng vạn Transaction mỗi ngày, yêu cầu kiến trúc bảng cực mỏng nhưng kết nối RDBMS tinh vi bậc nhất. Tái tạo trạng thái sống (Life-cycle) của chuyến:

1. **`trip` (Trái Tim Giao Dịch Chuyến)**
   - Vận hành dưới chuỗi Status Machine: `SCHEDULED` $\rightarrow$ `APPROVED` (Đã có tổ đội - Cho Bán) $\rightarrow$ `DEPARTED` (Lăn bánh hít lụa) $\rightarrow$ `MID_ROUTE` (Giữa đường) $\rightarrow$ `COMPLETED` (Xong xuôi) $\rightarrow$ `CANCELLED` (Sự cố gãy tuyến).
   - FK kết dính: `trip_schedule_id` (Nguồn gen tạo chuyến), `bus_id` (Cục sắt 4 bánh), `main_driver_id` (Cơ trưởng).

2. **`driver_assignment` & `bus_assignment` (Sợi Dây Xích Vận Mệnh)**
   - Bảng ánh xạ Entity-Relationship Model (N-to-N). Thống kê lịch sự từng ngày xe nào nổ máy, ai ôm vô-lăng. Quản lý trạng thái kẹt xe (In-Use Locking).

3. **`trip_change_request` & `vehicle_handover` (Lịch Sử Khóc Thét & Chạm Khẽ Trách Nhiệm)**
   - Lưu trữ lệnh đổi tài xế/đổi xe khẩn. Cột trạng thái duyệt `APPROVAL_STATUS`.
   - Lưu dữ liệu Quẹt ODO xăng trước và sau chuyến xe, ràng ép CSDL với trách nhiệm bồi thường đổ nhầm xăng.

## 2. API Backend & Thuật Toán Xử Lý Khẩn Cấp Nhiều Lớp Lồng (Deep Engineering)

Lõi thuật toán nằm ở `TripChangeController.java` và Resolver Pattern.
Mô hình Khẩn cấp (5 Time-Zones Emergency Flow) của Luận văn là điểm nhấn có "Một Không Hai" so với các đề tài khác:

### 2.1. Kiến Trúc 5 Vùng Thời Gian Khắc Nghiệt (5-Zone Model)
Khi tài xế báo "Em bị chó cắn đau chân không lái được sếp ơi" hoặc xe X1 rụng mất kính chiếu hậu thì hệ thống phân tích logic thời gian còn lại (Delta Time to Depart - TTĐ):

- **[Z1] STANDARD (>60 phút):** API `POST /trip-changes` nuốt Request $\rightarrow$ Sinh Record PENDING $\rightarrow$ Quăng lên bảng xếp hạng cho Admin phòng máy lạnh duyệt mỏng. (Luồng tay con người).
- **[Z2] URGENT (15-60 phút):** Admin ngâm lệnh duyệt quá 10 phút Escalation Timeout $\rightarrow$ Timer Trigger $\rightarrow$ Bypass $\rightarrow$ Force Hệ thống lôi đầu Tài xế/Xe dự dòng rảnh nhất quăng vào lấp chỗ.
- **[Z3] CRITICAL (<15 phút):** Sát mông xuất bến $\rightarrow$ Gạt tay Admin sang một bên $\rightarrow$ Máy quét vòng lặp `while/for` tìm xe/tài dự phòng Bypass Auto-Swap $\rightarrow$ Đẩy Status chuyến xe `APPROVED` giữ mạng $\rightarrow$ Phạt KPI cảnh cáo người duyệt.
- **[Z4] DEPARTED (Lỡ làng Xuất bến):** Auto-Reject mọi lý do! "Đã qua giờ T mà mới báo, tự chịu trách nhiệm".
- **[Z5] MID-ROUTE (Tai Nạn Dọc Đường):** `POST /incident` kích hoạt. Máy chốt Tọa độ trạm (GPS Logs) kéo Xe cứu viện (Rescue Bus) chia lượng vé tồn dư chở khách tiếp tục đường bay. Cứng như thép!

### 2.2 API Sinh Chuyến Tự Động Đầu Ngày (Cron-Job Equivalent API)
- `POST /api/operation/trips/generate` $\rightarrow$ Nạp cục `FromDate, ToDate`. Thuật toán For-loop quét qua cái `Trip_Schedules` đang có mảng Boolean chuỗi 7 ngày (Thứ 2 đến CN). Áp Bitmap Bitwise Operators Mask `1010101` tự phọt ra 600 chuyến xe cho tháng sau chạy trơn tru.

---

## 3. Triển Khai Tuyệt Đối Toàn Mỹ Giao Diện Frontend (Frontend UI/UX)

Để hiển thị chóp bu điều hành, Frontend tốn hơn ngàn dòng code TypeScript (Next.js 15) chia làm 6 lưới Dashboard tại `(admin)/admin/operation/...`.

### 3.1 Giao Diện Control Center Lập Kế Hoạch Đội Xe (`admin/operation/assignments` & `crew`)
- FE ReactJS tận dụng thư viện Kéo Thả (Drag & Drop) hoặc Drodpown Auto-Complete Search. Trực quan như màn thầu dự án.
- **Bộ Lọc Tài Nguyên (Resource Filter):** Tích hợp thông minh: FE gọi vòng API `GET /api/operation/resources/available-buses`. Nếu tôi chọn lúc 8h sáng, FE chỉ móc ra 5 chiếc xe Thaco rảnh rỗi tại kho Bến Xe miền Đông (không hiển thị mấy chiếc đang chôn chân ở Hà Nội). Nút thắt User Experience hoàn hảo không cho nhập Lụi (chặn đường sai sót của con người).

### 3.2 Lưới Radar Xử Lý Sự Cố Khẩn Cấp (`admin/operation/trip-changes`)
Đây là Màn Hình Sốc Nhất Đồ Án! Màn hình Điều Hành Tổng.
- Lưới Grid dội realtime Status. Dòng Tình Trạng Hiện Tại (Status) của Trip bị **Nhấp Nháy Đỏ** (Blinking Background) nếu lọt vào Z2 URGENT.
- Cột đồng hồ **Đếm Ngược Timer 10 Phút** chạy Tick Tock tít mù đe dọa trực quan Admin nhấn Nút Approve. Kích thích hành vi vận hành tức thời. 
- Mở Modal Action $\rightarrow$ Có riêng chức năng Bypass Override (Vượt màn bảo vệ) hoặc Nút Rollback (Undo vớt xác nhầm chuyến).

### 3.3 Giao Diện Nhận Chỉ Lệnh Của Đội Tài Xế (`app/(driver)`)
- Là chiếc Điện thoại cầm ngoài sương gió của Bác Tài. Giao diện cực đơn giản (UX Minimalism): Nút To Nổi Vật Lý.
- "Chuyến 08:00 SG - DL". Tài xế nhấn Trạm Đầu Tiên $\rightarrow$ Nút To đùng "Bắt Đầu Chuyến" - FE gọi lên `PUT /api/operation/trips/dispatch` đổi mạng lên `RUNNING`.
- Tab "Bàn Giao Trách Nhiệm Nhận Xe" - Input vào Số KM Đồng hồ trơn tru ngập viền thiết kế Mobile First Design.

## 4. Tự Phản Biện Chóp Bu Điều Hành (Critique Summary)

Module Operation hội tụ tinh hoa tư duy giải thuật tối ưu hệ thống và luồng quy trình phức hợp. Việc hiện thực hóa **"Quy Định Bypass Auto-execute 5 Vùng Sự Cố Khẩn"** đập tan ranh giới đồ án Web Sinh viên kiểu CRUD truyền thống. Phổ cập AI-Driven tự suy đoán thay thế não người khi thời gian tính bằng giây khẩn cấp. Khả năng bảo mật Logic của FE/BE móc nối dây chuyền tạo thành siêu phẩm của Luận văn.
