# Phân phối Khẩn cấp (Emergency Dispatch 5 Zones)

## Overview
Luồng xử lý sự cố (`TripChangeEscalationJob`) tự động phân vùng các yêu cầu đổi xe/tài xế để đảm bảo xe xuất bến đúng giờ mà không phụ thuộc vào tốc độ phản hồi của Admin.

## Hệ thống 5 Vùng (5-Zone System)

1. **STANDARD (Bình thường):** Cách giờ chạy > 12 tiếng. Yêu cầu bắt buộc phải có Admin duyệt.
2. **URGENT (Khẩn cấp):** Cách giờ chạy < 12 tiếng. Hệ thống cho Admin 10 phút để duyệt. Hết thời gian, Background Job tự động ép duyệt (Auto-Escalate) để tránh kẹt xe.
3. **CRITICAL (Nghiêm trọng):** Sắp xuất bến. Hệ thống tự động thực thi (Auto-Execute) ngay lập tức, chuyển sang trạng thái chờ Hậu kiểm (Post-Review).
4. **DEPARTED (Đã xuất bến):** Yêu cầu được tự động duyệt, yêu cầu Review chặt chẽ kèm Biên bản bàn giao.
5. **MID_ROUTE (Sự cố dọc đường):** Xử lý ngoại lệ cực đoan (tai nạn, hỏng xe), cấm Reject, ép buộc thực thi.

## TripChangeEscalationJob
- Chạy mỗi 60s để quét các yêu cầu URGENT quá hạn.
- Sử dụng `@Lazy self` để gọi hàm có `@Transactional(REQUIRES_NEW)`. Điều này ngăn chặn Transaction Rollback Poisoning (1 lỗi làm rollback cả vòng lặp). Xem chi tiết tại `docs/engineering/BUG_TRANSACTION_FIX.md`.
