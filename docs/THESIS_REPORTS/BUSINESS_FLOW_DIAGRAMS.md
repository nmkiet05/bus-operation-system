# Các Luồng Nghiệp Vụ Cốt Lõi (Business Flow Diagrams)

Tài liệu này mô hình hóa logic nghiệp vụ thông qua sơ đồ Mermaid, trực quan hóa cách các module tương tác với nhau để giải quyết một chu trình hoàn chỉnh.

## 1. Luồng Khởi Tạo & Điều Hành Chuyến (Trip Operation Flow)
Mô tả cách một chuyến xe (Trip) hiện hình từ trên giấy (Kế hoạch) tới lúc Xuất bến thực tế:

```mermaid
sequenceDiagram
    participant Planning as Module Planning<br/>(Quản lý lịch trình)
    participant Operation as Module Operation<br/>(Hệ thống trung tâm)
    participant Fleet as Module Fleet & HR<br/>(Xe & Tài xế)
    participant Dispatcher as Nhân viên điều độ

    Planning->>Operation: Định kỳ hằng ngày sinh Trip từ Schedule (Ví dụ: Chuyến 08:00 HCM-DL)
    Operation-->>Dispatcher: Gợi ý các Trip chưa có Xe / Tài Xế
    Dispatcher->>Fleet: Truy vấn Xe rảnh rỗi (Bus rảnh, còn Đăng Kiểm)
    Fleet-->>Dispatcher: Trả danh sách Xe đạt yêu cầu
    Dispatcher->>Operation: Chỉ định Xe (Bus Assignment)
    
    Dispatcher->>Fleet: Truy vấn Tài Xế rảnh (Bằng hợp lệ, đúng số chỗ, <10h lái/ngày)
    Fleet-->>Dispatcher: Trả danh sách Tài xế hợp lệ
    Dispatcher->>Operation: Định danh Tài (Driver Assignment)
    
    Note over Operation: Xe và Khách lên bến
    Dispatcher->>Operation: Bấm "Xuất Bến" (Trip Dispatch)
    Operation->>Operation: Cập nhật Status = RUNNING
```

## 2. Luồng Khách Hàng Đặt Vé & Thanh Toán (Booking Sales Flow)
Hệ thống xử lý Booking đảm bảo bảo toàn dữ liệu (Concurrency Control) để hai người không mua trùng một ghế.

```mermaid
sequenceDiagram
    participant Customer
    participant Sales as Module Sales
    participant DB as PostgreSQL
    participant Payment as Module Payment

    Customer->>Sales: Tìm chuyến xe (Chọn Ngày, Tuyến)
    Sales-->>Customer: Trả danh sách Trip + Sơ đồ ghế (Trống/Đã bán)
    
    Customer->>Sales: CLick chọn ghế A1, A2
    Note over Sales, DB: Cơ chế Optimistic Lock (Version) / Partial Unique
    Sales->>DB: Ghi Booking xuống với Status = PENDING
    DB-->>Sales: Lock ghế thành công, Countdown 10 phút.
    
    Sales->>Customer: Trả PNR Code + Tạo URL Thanh toán
    Customer->>Payment: Chuyển khoản VNPAY / Momo
    Payment-->>Sales: IPN Callback: Đã nhận tiền!
    
    Sales->>DB: Chuyển Booking Status -> CONFIRMED
    Sales->>Customer: Gửi vé điện tử (QR Code) qua Email/Thông báo.
```

## 3. Luồng Thay Đổi Sự Cố Khẩn Cấp (5 Urgency Zones)
Đây là quy trình độc quyền của hệ thống. Phân tách rủi ro thời gian thành 5 Vùng và ứng dụng Bypass/Escalation:

```mermaid
flowchart TD
    Start([Nhân sự thông báo ốm / Xe hư hỏng]) --> CheckTime{Đánh giá thời gian tới giờ T khởi hành}
    
    CheckTime -->|> 60 phút| Z1(Vùng 1: STANDARD)
    Z1 --> WaitAdmin[Xếp hàng chờ Admin duyệt tay]
    WaitAdmin -->|Duyệt| DoneSwap[Đổi tài / Đổi xe thành công]
    WaitAdmin -->|Reject| Fail(Bắt Tài Xế/Xe đi lệnh cũ)
    
    CheckTime -->|60' đến 15'| Z2(Vùng 2: URGENT)
    Z2 --> Timer{Admin có duyệt trong 10' ?}
    Timer -->|Có, Admin duyệt| DoneSwap
    Timer -->|Hết giờ, Bơ| AutoExecute[Mở lệnh Bypass Auto-Execute]
    AutoExecute --> DoneSwap
    
    CheckTime -->|< 15 phút| Z3(Vùng 3: CRITICAL)
    Z3 --> AutoExecute

    CheckTime -->|Xe đã lăn bánh qua T| Z4(Vùng 4: DEPARTED)
    Z4 --> AutoExecute

    CheckTime -->|Đang chạy giữa đường| Z5(Vùng 5: MID-ROUTE)
    Z5 --> LogIncident[Chụp Log tọa độ GPS + Sự cố]
    LogIncident --> AutoExecute
    
    DoneSwap --> PostCheck[HẬU KIỂM - Admin tra soát]
    PostCheck -->|Đồng ý lý do| Fine1[Duyệt ngoại lệ]
    PostCheck -->|Gian lận đổi lệnh| Penalize[Ghi phạt kỷ luật]
```
