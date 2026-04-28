# Báo cáo kỹ thuật: Lỗi Transaction Rollback Poisoning (UnexpectedRollbackException)

Trong quá trình dọn dẹp hệ thống, tôi đã phát hiện một lỗi logic nghiêm trọng trong cơ chế tự động điều phối chuyến xe. Dưới đây là giải thích chi tiết về nguyên nhân và cách khắc phục.

## 1. Vấn đề phát hiện trong Logs
Hệ thống thường xuyên ghi nhận lỗi:
`org.springframework.transaction.UnexpectedRollbackException: Transaction silently rolled back because it has been marked as rollback-only`

Lỗi này xảy ra tại `TripChangeEscalationJob`, một tác vụ chạy ngầm mỗi phút để tự động duyệt các yêu cầu thay đổi chuyến xe khẩn cấp (Urgent) đã quá thời gian chờ.

## 2. Phân tích nguyên nhân (Bug Logic)

### Code cũ:
```java
@Scheduled(fixedRate = 60_000)
@Transactional // <-- Transaction bao trùm toàn bộ Job
public void escalatePendingRequests() {
    List<TripChange> expired = requestRepository.findExpiredUrgentRequests(cutoff);
    for (TripChange request : expired) {
        try {
            executor.executeCrewOrBusChange(request); // Nếu lỗi xảy ra ở đây...
            requestRepository.save(request);
        } catch (Exception e) {
            log.error("FAILED..."); // ...dù catch lỗi ở đây...
        }
    }
}
```

### 3. Ví dụ minh họa (Ẩn dụ về chiếc túi đi chợ)

Để dễ hình dung, hãy tưởng tượng bạn đi siêu thị mua **10 món đồ** và bỏ tất cả vào **một chiếc túi duy nhất** (Transaction):

*   **Code cũ (Lỗi):** Bạn lấy đến món thứ 3 thì phát hiện nó bị hỏng (Exception). Bạn tự nhủ: "Ồ, món này hỏng thì mình bỏ qua, mình sẽ lấy tiếp 7 món còn lại". Nhưng trong Spring, quy tắc rất khắc nghiệt: **Chỉ cần một món đồ hỏng chạm vào túi, toàn bộ chiếc túi đó bị đánh dấu là "Vứt bỏ"**. Dù bạn có cố gắng nhặt thêm 7 món đồ tốt khác vào túi, thì khi ra đến quầy thanh toán (kết thúc phương thức), nhân viên siêu thị thấy chiếc túi có dấu "Vứt bỏ" và sẽ **đổ sạch toàn bộ chiếc túi vào thùng rác**, kể cả 9 món đồ tốt.
    *   **Hệ quả:** Bạn ra về tay trắng, dù bạn nghĩ mình đã xử lý (try-catch) món đồ hỏng đó rồi.

*   **Code mới (Đã sửa):** Thay vì dùng 1 túi to cho 10 món, bạn dùng **10 chiếc túi nhỏ riêng biệt** (`REQUIRES_NEW`). Món đồ thứ 3 bị hỏng? Bạn vứt chiếc túi nhỏ số 3 đi. Nhưng 9 chiếc túi còn lại hoàn toàn sạch sẽ, không bị liên đới, và bạn mang được 9 món đồ tốt về nhà thành công.

**Hệ quả:** Chỉ cần 1 yêu cầu thay đổi bị lỗi, toàn bộ các yêu cầu khác (dù hợp lệ) cũng không được xử lý.

## 3. Giải pháp khắc phục

Tôi đã refactor code để cô lập Transaction cho từng yêu cầu:

### Code mới:
```java
@Scheduled(fixedRate = 60_000)
public void escalatePendingRequests() {
    // Không dùng @Transactional ở đây
    for (TripChange request : expired) {
        try {
            self.escalateSingleRequest(request, timeout); // Gọi qua phương thức có Transaction riêng
        } catch (Exception e) {
            log.error("FAILED..."); 
        }
    }
}

@Transactional(propagation = Propagation.REQUIRES_NEW) // <-- Tạo Transaction ĐỘC LẬP
public void escalateSingleRequest(TripChange request, int timeout) {
    executor.executeCrewOrBusChange(request);
    requestRepository.save(request);
}
```

### Tại sao giải pháp này hiệu quả?
* **REQUIRES_NEW:** Mỗi khi xử lý một yêu cầu, Spring sẽ tạo ra một Transaction hoàn toàn mới.
* **Sự cô lập:** Nếu yêu cầu A bị lỗi, chỉ Transaction của yêu cầu A bị Rollback. Transaction của yêu cầu B hoàn toàn không bị ảnh hưởng.
* **Tính ổn định:** Job sẽ không bao giờ bị dừng đột ngột chỉ vì một dữ liệu sai lệch.

---
Việc sửa lỗi này giúp hệ thống vận hành trơn tru hơn và tránh tình trạng các yêu cầu điều phối bị "kẹt" không rõ lý do.
