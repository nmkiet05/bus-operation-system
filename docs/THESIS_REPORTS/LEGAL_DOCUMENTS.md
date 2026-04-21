# Giấy Tờ Căn Cước và Pháp Lý Trực Tiếp/Gián Tiếp Trong Hệ Thống (Legal Documents)

Hệ thống Bus Operation System tham gia vào việc quản lý vận tải hành khách nên đòi hỏi phải tuân thủ nghiêm ngặt các quy định của Bộ GTVT và Luật Lao Động. Dưới đây là danh sách phân tích các giấy tờ pháp lý và quy chuẩn bắt buộc được số hóa, quản lý và kiểm tra tự động trong hệ thống.

## 1. Giấy Phép Lái Xe (Driver License)
Hệ thống số hóa thông qua entity `DriverDetail`.
- **Dữ liệu được quản lý:** Số GPLX (`license_number`), Hạng GPLX (`license_class`), Ngày cấp (`issue_date`), Ngày hết hạn (`license_expiry_date`).
- **Nghiệp vụ áp dụng:**
  - **Check Expiry:** Tài xế không được phân công (assign) vào chuyến nếu GPLX đã hết hạn tại thời điểm khởi hành. Hệ thống chủ động validate qua method `isLicenseValid()`.
  - **Check Hạng Bằng Loại Xe:** 
    - **Hạng E, FC:** Được lái tất cả các loại xe, yêu cầu bắt buộc đối với xe $\ge$ 30 chỗ ngồi/giường (Large Bus).
    - **Hạng D:** Yêu cầu đối với xe từ 10 đến 29 chỗ (Medium Bus).
    - **Hạng B2:** Cho phép lái xe dưới 10 chỗ.
    - Validate tự động qua method `canDrive(Bus)`.

## 2. Giấy Tờ và Hồ Sơ Xe Gắn Với Phương Tiện (Vehicle Papers)
Hệ thống số hóa thông qua entity `Bus`.
- **Bảo hiểm xe (`insurance_expiry_date`):** Ngày hết hạn bảo hiểm TNDS/thân vỏ. Bắt buộc cập nhật để xe được quyền tham gia kinh doanh.
- **Giấy chứng nhận đăng kiểm và đăng ký (`registration_expiry_date`):** Ngày hết hạn giấy đăng kiểm/đăng ký.
- **Nghiệp vụ áp dụng:** Không cho phép khởi tạo chuyến hoặc phân công những xe đã hết hạn đăng kiểm/bảo hiểm để tránh rủi ro pháp lý và an toàn giao thông.

## 3. Luật Lao Động & Tuân Thủ Số Giờ Lái Xe (Labor Law Compliance)
Được quản lý thông qua nghiệp vụ điều độ ở `DriverTripCompliance` và `driverDutyService.checkAssignmentCompliance`.
- **Quy định pháp lý:**
  - Tài xế không được lái xe liên tục quá 4 giờ.
  - Tổng thời gian lái xe trong ngày không vượt quá 10 giờ.
  - Đảm bảo thời gian nghỉ ngơi thiết yếu giữa các ca.
- **Nghiệp vụ áp dụng:**
  - Hệ thống tự động tính toán tổng số giờ lái xe của tài xế trước khi Điều hành viên gán chuyến (`checkAssignmentCompliance`). 
  - Đưa ra cảnh báo/ngăn chặn vi phạm giờ làm việc.

## 4. Đặc Quyền Khai Thác Tuyến (Route Rights / Chấp Thuận Tuyến)
Quản lý thông qua `RouteRegistrationController`.
- **Dữ liệu:** `RouteRegistration` thường được gọi là "Sổ chuyến" hay "Nốt tài" cấp bởi Sở GTVT. Xác nhận nhà xe được quyền khai thác tuyến đường A-B trong khoảng thời gian nhất định và lượng xe giới hạn.
- **Nghiệp vụ:** Lên lịch trình (Schedule) phải đảm bảo dựa trên các tuyến đã được cấp phép.

## 5. Biên Bản Bàn Giao Xe Trách Nhiệm (Vehicle Handover Log)
Quản lý thông qua `VehicleHandoverController`.
- **Dữ liệu:** Lưu lại trạng thái của xe (hư hỏng, dọn dẹp, xăng/dầu) trước và sau mỗi chuyến.
- **Pháp lý:** Đóng vai trò như một biên bản pháp lý nội bộ chịu trách nhiệm vật chất. Tài xế bắt buộc phải confirm lúc nhận và lúc trả xe.

---
*Ghi chú: Việc áp dụng các lớp kiểm duyệt này giúp doanh nghiệp vận tải minh bạch với cơ quan nhà nước khi bị thanh tra, tự động trích xuất các báo cáo tuân thủ quy định giao thông.*
