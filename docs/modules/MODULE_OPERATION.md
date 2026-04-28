# Module Điều độ & Lịch trình (Operation & Scheduling)

## 1. Overview
Module Operation đóng vai trò là "Trái tim vận hành" của hệ thống, quản lý việc sinh chuyến tự động từ lịch mẫu, phân tài xế, bàn giao xe và xử lý các sự cố khẩn cấp trên đường. Đây là module chứa nhiều logic nghiệp vụ phức tạp nhất và yêu cầu kỹ thuật xử lý Transaction cao.

## 2. Sinh Chuyến Tự Động (Trip Generation)

Service `TripGenerationServiceImpl` chịu trách nhiệm chuyển đổi từ `TripSchedule` (Lịch mẫu) thành các `Trip` (Chuyến xe thực tế).

### 2.1. Logic Sinh Chuyến Thông Minh
- **Giới hạn an toàn:** Không cho phép sinh lịch quá **31 ngày** một lần để tránh làm treo Database và Memory.
- **Bitmask Day-of-Week:** Dựa vào `operation_days_bitmap` (Ví dụ: 127 = chạy cả tuần, 62 = chỉ chạy ngày thường), hệ thống dùng phép toán Bitwise (`runsOnDate`) để quyết định ngày đó có được sinh chuyến hay không.
- **Chống Trùng lặp (Idempotent Generation):** Mỗi lịch mẫu chỉ sinh 1 chuyến loại `MAIN` mỗi ngày. Nếu phát hiện đã có chuyến `MAIN`, hệ thống tự động bỏ qua (`skippedCount`).
- **Cơ chế Force Regenerate:** Nếu có thay đổi lớn, Admin có thể chạy "Force Regenerate". Hệ thống sẽ tìm các chuyến `MAIN` cũ đang ở trạng thái `SCHEDULED`, **Soft-Delete (Xóa mềm)** chúng, gọi `tripRepository.flush()` ép đồng bộ DB lập tức để tránh lỗi `Unique Constraint`, rồi sinh chuyến mới.
- **Concurrency Protection:** Quá trình lưu danh sách (Batch Insert) được bọc Try-Catch `DataIntegrityViolationException` để đề phòng trường hợp 2 Admin cùng nhấn nút sinh lịch một lúc.

## 3. Hệ thống Xử lý Sự cố (Trip Change Escalation Flow)

Khi một xe hỏng hoặc tài xế kiệt sức, việc đổi xe/đổi tài xế được quản lý khắt khe thông qua `TripChangeServiceImpl`.

### 3.1. Phân vùng Khẩn cấp (Urgency Zones)
Mỗi yêu cầu thay đổi được xếp vào một Vùng Khẩn Cấp dựa trên thời gian còn lại trước giờ khởi hành:
1. **STANDARD (Bình thường):** Yêu cầu được treo ở trạng thái `PENDING`, bắt buộc Admin duyệt bằng tay.
2. **URGENT (Khẩn cấp):** Yêu cầu được đẩy lên hệ thống. Nếu sau thời gian quy định (ví dụ 10 phút, đọc từ `application.yml`) Admin không duyệt, Background Job sẽ tự động can thiệp (Auto-Escalate).
3. **CRITICAL / DEPARTED (Nghiêm trọng / Đã xuất bến):** Auto-Execute (Tự động thực thi) lập tức để không làm gián đoạn hành trình. Đưa vào danh sách chờ Hậu kiểm (`reviewEmergencyRequest`).
4. **MID_ROUTE (Sự cố dọc đường):** Xử lý đặc biệt qua `createIncidentRequest` (Tai nạn, Đổi tài xế do sức khỏe). Ép buộc thực thi, cấm Reject.

### 3.2. Luật Lao Động (Nghị định 10/2020/NĐ-CP)
- Tại mọi vùng (kể cả sự cố khẩn cấp), nếu yêu cầu đổi tài xế mới, hệ thống **luôn luôn** gọi `validateAndEnforceLaborLaw` để tính tổng thời gian lái xe của tài xế mới.
- Luật bắt buộc: Lái liên tục không quá 4h, tổng ngày không quá 10h. Nếu vi phạm, System sẽ Block ngay cả khi đó là sự cố.

### 3.3. Xử lý Transaction Rollback Poisoning (Kỹ thuật Nâng cao)
Hệ thống có một Background Job tên là `TripChangeEscalationJob` chạy mỗi 60 giây để quét các request `URGENT` quá hạn và tự động ép duyệt.

**Vấn đề cũ (Bug):**
Ban đầu, vòng lặp `for` gọi trực tiếp một hàm đánh dấu `@Transactional` bên trong cùng Class. Do cơ chế Proxy của Spring, `@Transactional` cấp Method bị bỏ qua. Nếu request A văng lỗi (ví dụ: `BusinessException` do tài xế kẹt lịch), toàn bộ Transaction chính bị đánh dấu "rollback-only" (Transaction Rollback Poisoning). Điều này làm request B (dù hợp lệ) cũng không thể save vào DB và văng lỗi `UnexpectedRollbackException`.

**Giải pháp (Fixed):**
- Sử dụng **Self-Injection** (`@Lazy self`).
- Đánh dấu Method con (`escalateSingleRequest`) bằng `@Transactional(propagation = Propagation.REQUIRES_NEW)`.
- Vòng lặp `for` sẽ gọi qua biến `self`. Lúc này, Spring Aspect Proxy sẽ kích hoạt, tạo ra một Transaction độc lập (Physical Transaction mới) cho từng Request.
- Nếu Request A lỗi, chỉ có Transaction của A bị Rollback. Transaction của Request B vẫn commit thành công.
