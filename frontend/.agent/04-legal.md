# Rule 07: Legal Compliance (Tuân thủ Pháp luật Việt Nam)

> **YÊU CẦU BẮT BUỘC**: Hệ thống phải chặn các hành vi vi phạm pháp luật Giao thông vận tải và Tuân thủ quy định Thuế/TMĐT.

## 1. Quản lý Vận tải & Điều độ (Module Fleet & Operation)

| Văn bản | Yêu cầu | Áp dụng trong Code |
|---------|---------|-------------------|
| **Nghị định 10/2020/NĐ-CP** | Lệnh vận chuyển điện tử (Electronic Transport Order) **bắt buộc** trước khi xe xuất bến. Lưu trữ tối thiểu **3 năm** | Bảng `trip` có cột `electronic_transport_order_code`. Không cho xe chạy nếu thiếu Tài xế/Biển số |
| **Thông tư 12/2020/TT-BGTVT** | Dữ liệu GPS phải truyền liên tục về Tổng cục Đường bộ Việt Nam | Bảng `gov_data_transmission` log việc gửi dữ liệu |
| **Luật Giao thông đường bộ 2008** | Tài xế không lái quá **4 giờ liên tục** và không quá **10 giờ/ngày** | Logic check lịch sử lái xe khi Assign Driver |
| **Nghị định 86/2014/NĐ-CP** | Điều kiện kinh doanh vận tải hành khách bằng ô tô | Quản lý giấy phép, phù hiệu xe trong bảng `bus` |

## 2. Vé điện tử & Hóa đơn (Module Pricing & Ticket)

| Văn bản | Yêu cầu | Áp dụng trong Code |
|---------|---------|-------------------|
| **Nghị định 123/2020/NĐ-CP** | Vé xe khách điện tử được coi là Hóa đơn GTGT. Phải có Ký hiệu, Mẫu số, Mã cơ quan thuế | Bảng `ticket` lưu `invoice_lookup_code`, QR Code |
| **Thông tư 78/2021/TT-BTC** | Thời điểm xuất vé = thời điểm thu tiền | Booking PAID → kích hoạt xuất hóa đơn ngay lập tức |
| **Luật Giá 2012 & TT 152/2014/TT-BTC** | Giá vé phải đúng với giá đã kê khai Sở Tài chính | Bảng `fare_config`, `fare_policies` quản lý chặt giá gốc |
| **Luật Kinh doanh bảo hiểm** | Giá vé đã bao gồm bảo hiểm hành khách | Công thức: **Giá cước + VAT + Phí bảo hiểm** |
| **Thông tư 63/2019/TT-BTC** | Quy định về hóa đơn điện tử | Tích hợp API hóa đơn điện tử (VNPT, Viettel, FPT...) |

## 3. Bảo mật Dữ liệu & Người dùng (Module Auth)

| Văn bản | Yêu cầu | Áp dụng trong Code |
|---------|---------|-------------------|
| **Nghị định 13/2023/NĐ-CP** | Phải có sự đồng ý (Consent) khi thu thập dữ liệu cá nhân (SĐT, Email, Tên) | Checkbox "Tôi đồng ý điều khoản" khi đăng ký. Mã hóa mật khẩu |
| **Luật An ninh mạng 2018** | Dữ liệu người dùng Việt Nam phải lưu trữ tại máy chủ ở Việt Nam | Chọn Server/Database tại Region Việt Nam |
| **Nghị định 15/2020/NĐ-CP** | Xử phạt vi phạm hành chính trong lĩnh vực CNTT | Tuân thủ quy định về bảo mật, mã hóa dữ liệu nhạy cảm |

## 4. Thương mại Điện tử (Website & App)

| Văn bản | Yêu cầu | Áp dụng trong Code |
|---------|---------|-------------------|
| **Nghị định 52/2013/NĐ-CP & 85/2021/NĐ-CP** | Website/App bán vé phải thông báo Bộ Công Thương (logo xanh). Công bố chính sách hoàn hủy vé rõ ràng | Footer website có logo Bộ Công Thương, trang Policy |
| **Luật Giao dịch điện tử 2023** | Vé điện tử có giá trị pháp lý tương đương vé giấy | Màn hình "Vé của tôi" hiển thị đầy đủ thông tin pháp lý |
| **Luật Bảo vệ quyền lợi người tiêu dùng 2023** | Chính sách hoàn tiền, hủy vé rõ ràng | Bảng `fare_policies` với type='REFUND' |

## 5. Thuế & Tài chính

| Văn bản | Yêu cầu | Áp dụng trong Code |
|---------|---------|-------------------|
| **Luật Thuế GTGT** | Dịch vụ vận tải chịu thuế GTGT 8% | Cột `vat_rate` trong bảng `ticket` (default 0.08) |
| **Thông tư 200/2014/TT-BTC** | Chế độ kế toán doanh nghiệp | Báo cáo doanh thu, chi phí theo chuẩn VAS |
| **Nghị định 126/2020/NĐ-CP** | Quản lý thuế với hóa đơn điện tử | Lưu trữ hóa đơn điện tử 10 năm |

## 6. An toàn Giao thông

| Văn bản | Yêu cầu | Áp dụng trong Code |
|---------|---------|-------------------|
| **Nghị định 100/2019/NĐ-CP** | Xử phạt vi phạm giao thông đường bộ | Log cảnh báo vi phạm tốc độ, thời gian lái |
| **Thông tư 73/2014/TT-BGTVT** | Quy định về thiết bị giám sát hành trình | Tích hợp GPS, lưu trữ dữ liệu hành trình trong bảng `bus.gps_device_id` |
