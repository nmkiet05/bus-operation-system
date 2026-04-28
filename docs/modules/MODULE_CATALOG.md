# Module Danh Mục Hệ Thống (Master Data / Catalog)

## 1. Overview
Module Catalog đóng vai trò là kho dữ liệu nền tảng (Master Data) không thay đổi thường xuyên, cung cấp các danh mục thiết yếu như Tỉnh/Thành phố, Bến xe, Phòng ban, và Quầy vé cho toàn bộ các module khác tham chiếu.

## 2. Architecture
Đây là module có kiến trúc đơn giản nhất, thiên về các thao tác CRUD cơ bản. Tuy nhiên, nó chịu trách nhiệm kiểm soát tính nhất quán của dữ liệu tham chiếu thông qua các cơ chế rào cản xóa (Constraint Checks) trước khi thực hiện hành động.

## 3. Key Entities / Components
- `@Entity Province`: Lưu thông tin 63 tỉnh thành phố. Mã tỉnh (`gov_code`) tuân thủ chuẩn của Tổng cục Thống kê (GSO).
- `@Entity BusStation`: Thông tin Bến xe vật lý. Phải thuộc về một `Province`.
- `@Entity Department`: Cấu trúc phòng ban nội bộ (Mô hình cây Hierarchical).
- `@Entity TicketOffice`: Danh sách quầy vé thực tế tại các bến xe hoặc trạm trung chuyển.

## 4. Business Rules
- **Chống xóa mềm mồ côi (Anti-Orphan Deletion):** Không cho phép xóa một `Province` nếu đang có `BusStation` liên kết tới nó. Không cho phép xóa một `BusStation` nếu bến đó đang được sử dụng để định nghĩa một `Route` bên module Planning.
- **Tree Structure:** Bảng `departments` hỗ trợ cấu trúc cây thông qua `parent_id` để quản lý các phòng ban lồng nhau (Ví dụ: Khối Vận hành -> Trạm Điều hành -> Quầy bán vé A).

## 5. API Endpoints
- Public APIs (`/api/catalog/**`): Mở công khai không cần Token (thiết lập trong `SecurityConfig` qua `permitAll()`). Được sử dụng để đổ dữ liệu vào các Dropdown list (Select Box) trên màn hình Frontend (Ví dụ: Trang tìm vé cần chọn Điểm đi, Điểm đến).
- Admin APIs: Yêu cầu quyền `ADMIN` hoặc `STAFF` để thêm/sửa/xóa thông tin các bến xe hoặc tỉnh thành mới.

## 6. Technical Notes
Vì dữ liệu Catalog rất ít khi thay đổi (chủ yếu là Read-heavy), module này là ứng viên tiềm năng nhất cho việc áp dụng Cache Layer (Ví dụ: Redis `@Cacheable`) trên các endpoint GET, giúp giảm tải Query vào Database và tăng tốc độ Render cho Frontend.
