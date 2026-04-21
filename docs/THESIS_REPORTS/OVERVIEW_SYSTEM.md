# Tổng Quan Hệ Thống Bus Operation System (System Overview)

## 1. Giới Thiệu
Hệ thống **Bus Operation System** là một phần mềm quản trị toàn diện dành cho các doanh nghiệp xe khách liên tỉnh. Hệ thống số hóa hầu hết các quy trình từ khai báo danh mục, lập kế hoạch lịch trình, định giá vé, kiểm soát phương tiện và tài xế, đến điều hành trực tiếp lưu lượng xe xuất bến và bán vé cho khách hàng.

**Kiến trúc công nghệ:**
- **Backend:** Java 21, Spring Boot 3.4.1 (RESTful APIs, Spring Security JWT, Data JPA).
- **Database:** PostgreSQL (Có các quy trình seed data phức tạp và sử dụng View/CTE cho báo cáo).
- **Frontend:** Next.js 15, React, Tailwind CSS, Shadcn UI.

## 2. Các Module Chính Toàn Hệ Thống

Dựa vào việc rà soát các Controller hoạt động thực tế, hệ thống cấu thành từ 9 Modules chính như sau:

| Module | Chức năng (Nghiệp vụ chính) | Vai trò |
|--------|------------------------------|---------|
| **Catalog** | Quản lý thông tin cơ sở: Tỉnh/thành, Bến xe, Văn phòng bán vé, Trạm dừng. | Cung cấp dữ liệu nền (Lookup Data). |
| **Fleet** | Quản lý thông tin vòng đời phương tiện (Xe, Loại xe, Cấu hình ghế). | Đảm bảo xe đủ pháp lý & đúng thiết kế. |
| **Identity** | Phân quyền, User/Admin, JWT Auth. | An ninh hệ thống (RBAC). |
| **Hr (Driver)** | Quản lý thông tin tài xế, bằng lái xe. | Kiểm tra năng lực lái xe pháp lý. |
| **Planning** | Lập quy hoạch Tuyến đường, cấp phép tuyến, Lịch trình chạy xe dài hạn. | Khung xương hoạt động chiến lược. |
| **Pricing** | Áp dụng chính sách giá, giá cơ sở, phụ thu dịp Lễ/Tết. | Chiến lược doanh thu. |
| **Operation** | *Core Engine*: Sinh chuyến xe thực tế, gán xe/tài, điều hành, đổi ca khẩn cấp, xuất bến. | Quản lý vận hành "Real-time" hằng ngày. |
| **Sales** | Đặt giữ chỗ, xuất vé, xử lý hoàn/hủy vé khách hàng. | Điểm tiếp xúc trực tiếp mang doanh thu. |
| **Payment** | Giao dịch thanh toán. | Đối soát dòng tiền. |
| **Reports** | BI & Dashboard (Doanh thu thực tế, Hệ số tải). | Hỗ trợ quyết định cho Ban giám đốc. |

## 3. Data Flow Cơ Bản

1. **(Planning) Lập Lịch:** Quản lý lập Tuyến Đường -> Đăng ký cấp phép -> Áp dụng Lịch Trình (Schedule).
2. **(Fleet & Hr) Cốt Lõi Tài Nguyên:** Nhập kho xe cộ và nhân sự tài xế.
3. **(Operation) Sinh Chuyến:** Job tự động (`TripGenerationController`) sinh ra các Chuyến Xe thật (Trip) từ Lịch trình.
4. **(Operation) Điều Phối:** Điều phối viên dùng `DriverAssignment`, `BusAssignment` ráp nối xe và tài xế rảnh rỗi vào Chuyến.
5. **(Sales) Khách Mua Vé:** Khách hàng thấy chuyến xe trên app/web và mua.
6. **(Operation) Vận Hành:** Tài xế làm thủ tục bàn giao (`VehicleHandover`) -> Điều hành viên bấm lệnh Xuất bến (`TripDispatch`). *Nếu có sự cố, sử dụng quy trình thay đổi khẩn cấp 5 mức*.
7. **(Reports) Báo cáo:** Doanh thu và Hệ số tải chạy batch/truy vấn trực tiếp lên SQL phục vụ quản trị.
