# MODULE: QUẢN LÝ ĐỘI XE (FLEET MANAGEMENT)

> **Mô tả:** Nếu Catalog là mạng lưới đường bộ, thì Module Fleet chính là tài sản dòng máu chạy trong mạng lưới đó. Module Fleet quản lý hồ sơ sinh mệnh của mọi phương tiện vận tải đường bộ trực thuộc công ty, từ hồ sơ kỹ thuật, thông số vật lý (Số chỗ, số đo), đến hồ sơ pháp lý (Đăng kiểm, Bảo hiểm, Phù hiệu Kinh doanh).

## 1. Cấu Trúc Khối Dữ Liệu Cơ Sở (Database Schema)

Module được kiến trúc dựa trên 2 Table cốt lõi:

### 1.1. Bus_Type (Loại Phương Tiện / Định Nghĩa Chuẩn)
- **Mục đích:** Thay vì lưu lặp lại 40 ghế cho hàng trăm chiếc xe, hệ thống chia nhỏ thành `Bus_Type` (Ví dụ: "Limousine 34 Giường Phòng", "HyunDai 45 Ghế Ngồi").
- **Kiến trúc Dị Biệt (NoSQL trong SQL):** Cột `seat_map` có kiểu dữ liệu là `JSONB`.
  - Thay vì tạo thêm bảng `Seat` (gây phình hàng triệu record, chậm query), hệ thống lưu mảng ma trận ghế ngồi (VD: `[A1, A2, B1, B2]`, bao gồm cả tầng 1 (`floor_1`) & tầng 2 (`floor_2`)).
  - Thiết kế này đặc biệt xuất sắc cho Luận Văn: Nó giải quyết triệt để bài toán thay đổi sơ đồ ghế theo từng mẫu xe lai ráp của nhà xe một cách siêu linh hoạt. Bạn có thể chèn bất kỳ cấu trúc JSON nào mà không sợ phá vỡ Table Structure.

### 1.2. Bus (Thực Thể Xe Thực Tế)
- Nhận khóa ngoại từ `Bus_Type`.
- **Định Danh Vật Lý:** Mọi xe đều bị ràng buộc Tính Duy Nhất (Unique Constraint) cho các trường `license_plate` (Biển số xe), `vin_number` (Số khung), `engine_number` (Số máy). Không cho phép "Tẩy trắng biển số".
- **Hồ Sơ Pháp Lý:** 
  - `transport_badge_number`: Phù hiệu xe kinh doanh.
  - Cụm Time-Bomb: `insurance_expiry_date` (Ngày hết hạn bảo hiểm) & `registration_expiry_date` (Ngày hết hạn đăng kiểm trung tâm). Đây là cụm biến sinh tử tự động phất cờ Đen (Cấm xuất bến) nếu hết hạn.

---

## 2. Đặc Tả Triển Khai API Backend (Backend Implementation)

Quyền truy cập toàn bộ thuộc về `HAS_ROLE_ADMIN` để đề phòng rò rỉ tải sản kinh doanh công ty.

- **`POST /api/fleet/buses`**: Logic khởi tạo siêu phức tạp. Tại Entity `BusRequest.java`, backend sẽ chèn Validation Annotation `@Future` cho các mốc thời gian pháp lý, ép thời gian hết hạn bảo hiểm phải nằm trong tương lai. Ném ra `400 Bad Request` nếu Validation Fail.
- **`GET /api/fleet/buses` & Cổng Search Mở Rộng**: Cung cấp query Parameters phức tạp như `?busTypeId=1&status=ACTIVE`. Backend dùng thư viện Specification của Spring Data JPA để Generate Dynamic SQL Query.
- **`DELETE /api/fleet/buses/{id}`**: Áp dụng quy tắc khóa luồng. Một xe bị Tai nạn hoặc Hết hạn tuổi đời sử dụng (15 năm theo Luật đường bộ Việt Nam) sẽ đánh `status = RETIRED` thay vì Xóa sạch. Mọi báo cáo lịch sử (Revenue Reports) chạy bằng xe đó cách đây 3 năm vẫn giữ nguyên con số, đảm bảo dòng tiền tài chính trên hệ DB không sai lệch một cắc.

---

## 3. Bản Triển Khai Chức Năng Trên Giao Diện Frontend (Frontend UI/UX)

Hoàn thiện ở khối UI/UX Admin Dashboard tại `app/(admin)/admin/fleet/...`:

### 3.1. Trang Tạo Kiểu Dáng Xe (`admin/fleet/bus-types`)
- **Form Kỹ Thuật Công Nghệ Cao:** Giao diện không chỉ có những textbox thông thường! Frontend tại đây triển khai một "Trình soạn thảo JSON (JSON Editor Component)" hoặc lưới trực quan cho phép Admin kéo thả/thiết lập Sơ đồ ghế tầng trên, tầng dưới. 
- **Business Impact:** Cắm trực tiếp API `POST /api/fleet/bus-types` gửi khối JSON ma trận đó xuống Server một búa thành công.

### 3.2. Sổ Quản Lý Phương Tiện (`admin/fleet/buses`)
- **Giao Diện Inventory (Hàng Kho):** Màn hình DataGrid trải dài chia hiển thị cột Biển Số, Trạng Thái, Ngày Đăng Kiểm.
- **Tính Năng Cảnh Báo "Đường Màu Đỏ" (Red-line Alert):**
  - Trong logic hàm Render của Màn hình Frontend, FE so sánh trực tiếp ngày hiện tại (`dayjs()`) với `insurance_expiry_date`.
  - Nếu `< 15 ngày`, dòng thông tin xe tự động **đổi màu highlight Vàng (Warning)**. Nếu đã quá hạn, chữ tự động chuyển **Đỏ cờ (Danger)**, chặn nút Điều phối xe. Đây là giá trị UX siêu cấp giúp Phòng Điều Hành quản trị Rủi Ro Pháp Lý trước khi Xe Công An còi lại dọc đường.
- **Tạo Mới Phương Tiện Tiên Tiến:** Giao diện Form thêm xe có DatePicker chọn lịch bắt buộc. Frontend tự chặn Validate trước khi bấm Submit để tiết kiệm băng thông gửi Form Rác xuống con server Spring Boot.

### 3.3. Tương Tác Vượt Miền Cùng Module Operation
- Module Fleet là đối tượng thụ động. Tại trang Điều hành của Nhân Sự (Staff) - `admin/operation/assignments`: Giao diện sẽ gọi trực tiếp sang API của Fleet, thả xuống một cái Dropdown Select (Chọn Xe) kèm điều kiện rảnh rỗi. Mạng lưới dữ liệu đan chéo này biến chiếc Website thành một bàn cờ thực thụ.

## 4. Tự Phản Biện & Tổng Kết
Module Fleet đã phơi bày điểm ưu việt của hệ thống khi không chỉ số hóa xe mà còn số hóa các **hành lang pháp lý bắt buộc**. Bằng việc cắm rễ chặt hai trường `registration_expiry_date` & `insurance_expiry_date` xuyên suốt từ CSDL $\rightarrow$ DTO Response $\rightarrow$ API $\rightarrow$ Frontend Component DatePicker, sinh viên xây dựng đề tài hoàn toàn có thể tự tin thuyết minh tính "Thực chiến - Enterprise Ready" của dự án trước hội đồng thay vì làm module đồ án hời hợt cho có.
