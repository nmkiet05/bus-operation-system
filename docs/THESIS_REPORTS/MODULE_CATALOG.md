# MODULE: QUẢN LÝ DANH MỤC (CATALOG)

> **Mô tả:** Module Catalog là trái tim tĩnh (Master Data) của toàn bộ hệ thống Bus Operation System. Dữ liệu trong module này cung cấp bộ khung định vị địa lý và các cơ sở hạ tầng vật lý cốt lõi. Mọi nghiệp vụ định tuyến (Routing), kinh doanh bán vé (Sales), và điều hành (Operation) đều phụ thuộc tuyệt đối vào CSDL của module này.

## 1. Cấu Trúc Khối Dữ Liệu Cơ Sở (Database Schema)

Module được xây dựng dựa trên 4 thực thể chính liên kết chặt chẽ theo mô hình phân cấp không gian:

1. **Province (Tỉnh / Thành phố)**
   - Quản lý danh mục 63 tỉnh thành Việt Nam.
   - Các trường quan trọng: `gov_code` (Mã hành chính nhà nước để đồng bộ hóa pháp lý), `name`, `status`.
   - Vai trò: Là khóa ngoại cấp 1 cho bến xe. Dùng để bóc tách luồng tìm kiếm chuyến xe theo khu vực của khách hàng trên hệ thống Public Web.

2. **Bus Station (Bến Xe Khách Nhà Nước / Tư Nhân)**
   - Các đầu mối giao thông lớn nơi chuyến xe bắt buộc xuất bến và cập bến (VD: Bến xe Miền Đông, Bến xe Miền Tây, Bến xe Nước Ngầm).
   - Ràng buộc: Buộc phải thuộc về 1 `Province`.
   - Các trường vật lý: `address`, `gov_code` (Chuẩn đăng ký kinh doanh Bến Bãi).
   - *Ràng buộc kỹ thuật:* Áp dụng Partial Unique Index để tên bến xe không được phép trùng lặp trong cùng một tỉnh.

3. **Ticket Office (Phòng Vé / Điểm Nhận Hàng)**
   - Là điểm chạm vật lý ngoại vi tương tác trực tiếp với khách.
   - Các điểm đại lý ủy quyền hoặc quầy bán vé trực thuộc Bến Xe Trung Tâm.
   - Ràng buộc: Có thể tham chiếu (Optional FK) tới `bus_station` nếu nằm trong bến, hoặc đứng độc lập trên mặt phố.

4. **Depot (Bãi Đỗ / Trạm Bảo Dưỡng / Trạm Dừng Chân)**
   - Phục vụ riêng cho Module Fleet (Đội xe). Đây là nơi xe nghỉ ngơi qua đêm hoặc đưa vào bảo dưỡng.
   - Phân biệt nghiệp vụ: Depot khác hoàn toàn với Station (Bến xe). Bến xe là nơi đón trả khách, Depot là nơi đậu xe và bàn giao ca tài xế. Hành khách không bao giờ có thể tiếp cận cấu trúc Depot.

---

## 2. Đặc Tả Triển Khai API Backend (Backend Implementation)

Hệ thống expose mảng REST API tuân thủ chặt chẽ nguyên lý thiết kế RESTful, chia làm 2 luồng truy cập (Public & Private).

### 2.1. Nhóm API Quản Quản Trị Tỉnh & Bến Bãi (`ProvinceController`, `StationController`)
- **GET `/api/catalog/provinces` & `/api/catalog/stations`**: Cung cấp cơ chế Pagination và Caching (do dữ liệu siêu tĩnh).
- **POST / PUT**: Yêu cầu siêu quyền `HAS_ROLE_ADMIN`. Khi tạo mới, CSDL sẽ Validate Format của `gov_code` thông qua Regex.
- **DELETE (Soft Delete)**: Hệ thống sử dụng Soft Deletion (`deleted_at`) qua Hibernate `@SQLDelete`. Nếu xóa nhầm một "Bến Xe" đang có Hàng ngàn Chuyến xe (Trips) tham chiếu đến, hệ thống tự động khóa lệnh xóa (Foreign Key Constraint Exception) hoặc dán cờ `status = INACTIVE` thay vì phá vỡ toàn vẹn dữ liệu.

### 2.2. Nhóm API Quản Lý Tài Sản Doanh Nghiệp (`TicketOfficeController`, `DepotController`)
- Phân quyền động: Quyền `ADMIN` có thể tạo/xóa Depot. Tuy nhiên, quyền `STAFF` có thể được mở để cập nhật thông tin "Quầy Vé" (Ticket Office) như Đổi số điện thoại liên hệ, cập nhật địa chỉ kinh doanh.

---

## 3. Bản Triển Khai Chức Năng Trên Giao Diện Frontend (Frontend UI/UX)

Để đáp ứng 100% logic Backend, ứng dụng Frontend Next.js thiết lập các trang giao diện phức tạp tại thư mục `app/(admin)/admin/catalog`:

### 3.1. Màn Hình Quản Lý Bến Bãi (`admin/catalog/stations`)
- **Vai trò:** Cung cấp lưới dữ liệu (Data Grid) siêu tốc cho Ban Giám Đốc/Thư Ký Công Ty.
- **Chức năng Hiển thị (Read):** Lưới DataGrid hiển thị cột Tên Bến, Tỉnh trực thuộc, Địa chỉ và Mã Bến mượt mà với chức năng Sort/Filter ở Header do thư viện Ant Design / MUI cung cấp.
- **Chức năng Tạo Mới (Create/Update):** Chứa Form Modal/Drawer Popup. Khi nhập chọn Tỉnh, Web sử dụng *Debounce Search* để gọi `GET /api/catalog/provinces` nạp danh sách vào Dropdown Select. Sau đó Validate Form Control cấm bỏ trống Tên Bến.
- **Cảnh báo Thông minh:** Khi Admin bấm Xóa (Delete) 1 bến xe, Frontend sẽ chặn lại bằng Popup Confirm: *"Bến xe này có thể đang gắn với X Tuyến đường đang hoạt động. Bạn có chắc chắn muốn ngưng hoạt động nó không?"*

### 3.2. Màn Hình Quản Lý Trạm Đỗ Xe (`admin/catalog/depots`)
- **Vai trò:** Phục vụ phòng Kỹ Thuật Máy và Điều Hành Bãi.
- **UX Dành Cho Phân Hệ Nội Bộ:** Layout được tối giản đi, tập trung vào không gian lưu trữ (Sức chứa xe) của bãi.
- **Liên Kết Đa Chiều:** Giao diện Depot này trở thành bộ lọc nguồn cho màn hình Gán Xe (`admin/operation/assignments`) ở phân hệ Điều Hành. ("Tìm xe rảnh đang đỗ tại Depot Nước Ngầm").

### 3.3. Tích Hợp Trên Phân Hệ Khách Hàng (Public Web)
**Trang Chủ Đặt Vé (`page.tsx`) & Widget Tìm Kiếm:**
Dữ liệu của module Catalog chính là mạch máu của Ô Tìm Kiếm (Search Widget) đập vào mắt người dùng đầu tiên.
- **Chọn Điểm Đi - Điểm Đến:** Dropdown Select trên Web Public không gõ chay, mà gọi API `GET provinces` hoặc `GET stations`.
- **Tối ưu Hóa:** Frontend có thể chặn gọi API liên tục mỗi khi gõ từ khóa bằng kỹ thuật `SWR` hoặc `React Query` Caching, đảm bảo Web Khách Hàng tải dưới 100ms ngay cả khi hàng ngàn khách cùng truy cập vào Dịp Lễ Tết.

## 4. Tổng Kết Phản Biện Chức Năng (Critique Summary)
Module Catalog, tuy bề ngoài là các hàm CRUD đơn điệu, nhưng lại là mỏ neo toàn vẹn dữ liệu. 100% chức năng tạo/sửa/xóa bến xe đều đã được hiện thực hóa ở Frontend, biến ứng dụng thành một hệ thống Enterprise Resource Planning (ERP - Hoạch định nhân lực tài sản) hoàn hảo mức cơ sở.
