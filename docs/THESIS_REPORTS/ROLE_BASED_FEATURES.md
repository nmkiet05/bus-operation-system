# Phân Quyền Chức Năng Theo Từng Đối Tượng (Role-Based Features)

Hệ thống Bus Operation System được phân tách các chức năng cực kỳ chặt chẽ dựa trên đối tượng sử dụng. Dưới góc độ vận hành thực tế đã được lập trình ở các API và cấu hình qua Security, hệ thống sở hữu **4 Role định danh chính thức** (ADMIN, STAFF, DRIVER, CUSTOMER) và **1 Role ẩn / công cộng** (GUEST).

Dưới đây là chi tiết bức tranh nghiệp vụ của từng nhóm đối tượng:

## 1. GUEST (Khách Vãng Lai / Chưa Đăng Nhập)
*Định vị: Khách hàng mới truy cập Web/App, muốn giao dịch nhanh mà không bắt buộc tạo tài khoản.*

- **Tìm Kiếm Chuyến Đi:** Tra cứu các chuyến, ngày đi, loại phương tiện, kiểm tra ghế trống theo từng khung giờ (`TripQuery`).
- **Nghiệp vụ Bán Hàng (Public Sales):** Tiến hành giữ chỗ, chọn vị trí ghế/giường, cấu hình điểm đón điểm trả (`Booking`).
- **Thanh Toán (Payment):** Được phép tạo lệnh thanh toán Online thông qua QR Code hoặc Redirect tới VNPAY với tính năng Time-to-Live (Khoá ghế chờ thanh toán).
- **Hành Lý & Đối Khách:** Truy cập tra cứu thông tin vé, in vé, hoặc tiến hành Hủy Vé trực tuyến mà KHÔNG cần Login. Chỉ cần khách chứng minh được **Số lượng PNR** trùng khớp với **Số điện thoại** lúc mua hàng.

## 2. CUSTOMER (Khách Hàng Thành Viên)
*Định vị: Hành khách đã đăng ký / đăng nhập để lưu vết thông tin.*

- **Kế thừa Toàn Bộ:** Được sử dụng không giới hạn các chức năng giao dịch của GUEST.
- **Tiện Ích Cá Nhân Hoá:** 
  - Xem toàn bộ danh sách "Vé Của Tôi" (My Bookings) đã mua theo lịch sử để tái sử dụng mà không phải nhớ chuỗi PNR.
  - Hủy vé của bản thân thông qua phiên đăng nhập (JWT Token) mà không cần điền Form mã xác thực cực rườm rà như Guest.

## 3. DRIVER (Tài Xế)
*Định vị: Người trực tiếp thực thi thao tác vận hành chuyến, giao tiếp qua thiết bị Mobile/Tablet nội bộ.*

- **Quản Lý Ca Làm Việc (`DriverTrip`):** Tài xế truy cập sẽ biết được danh mục các lịch trình sắp tới mình được chỉ định. (Không thấy được lịch của tài xế khác).
- **Trách Nhiệm Vật Chất (`VehicleHandover`):** Trực tiếp Confirm biên bản bàn giao xe trước khi lên xe và sau khi về tới Depot (Kiểm tra tình trạng xăng xe, nội thất, máy lạnh v.v).
- **Sự Cố Trên Đường (`Trip Change - Mid-Roure`):** Được cấp quyền trực tiếp cảnh báo Sự Cố Vùng 5. (Truyền thông tin thiết bị gặp lỗi, hư hỏng đột xuất, tọa độ GPS) để trung tâm tiến hành Bypass lệnh gửi xe cấp cứu lên đón/thay khách.

## 4. STAFF (Nhân Viên Điều Hành / Phòng Vé / Lơ Xe)
*Định vị: Nguồn nhân lực tại chỗ điều phối hoạt động kinh doanh trạm.*

- **Quản Trị Bán Vé Chuyên Sâu:** Có thể Booking vé cho khách vãng lai mua tại bến.
- **Điều Độ Cấp Cơ Sở (`Operation Modules`):** 
  - Gán cứng Phương tiện thực tế vào Chuyến chạy (Theo Lịch).
  - Phân công Tài Xế lái xe cho tuyến tương ứng (Ràng buộc chặt với Số Giờ Làm Việc tối đa / Bằng lái hợp lệ).
  - Khởi tạo Yêu cầu Đổi Chuyến Khẩn Cấp do thiếu tài/thiếu xe.
- **Lệnh Rời Bến (`Trip Dispatch`):** Thao tác chốt thông tin số người có mặt, bấm duyệt trạng thái để xe chuyển sang `RUNNING`. Đo lường KPIs thời gian chạy đúng giờ, trễ chuyến.

## 5. ADMIN (Quản Trị Viên / Ban Giám Đốc)
*Định vị: User quyền lực nhất mang tính chất cấu hình, hoạch định và giám sát.*

- **Bao hàm quyền STAFF:** Thao tác trên tất cả trạm/bến mà không bị giới hạn logic trạm.
- **Cấu hình Chiến Lược (Planning & Pricing):**
  - Khai báo các Sổ chuyến, Định tuyến Cung đường (`Routes`).
  - Thiết lập bảng giá theo chặng, áp dụng Chính sách Giá tùy biến theo dịp Lễ Tết (`Fare Policies`).
  - Cấu hình Lịch xe chạy lặp lại (`Schedules`).
- **Nghiệp Vụ Hậu Kiểm Khẩn Cấp:** Thẩm định quyền phê duyệt / Bóp băng các yêu cầu điều phối Khẩn vùng 1, 2, 3 và bắt lỗi/bắt phạt Vùng 4, 5 của nhân sự dựa trên thực tiễn đổi tài xế, đổi xe.
- **Báo Cáo Thông Minh (Reporting - BI):** Quản trị dòng tiền; Truy cập vào khu vực cấp cao để thấy biểu đồ Rechart phân tích **Doanh thu Ròng / Gộp** và **Hệ số Tải (Load-Factor)** giúp đo lường chuyến nào đang lỗ/lãi.
- **Tình Trạng Thiết Bị (Fleet & Identity):** Thiết lập thông số xe, xử lý đăng kiểm hoặc tạo lập/xoá quyền người dùng.
