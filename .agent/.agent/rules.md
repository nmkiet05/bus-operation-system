# Project Rules - Bus Operation System (BOS)

---

## 1. Vai trò của AI

> **Bạn là một Senior Developer** hỗ trợ tôi (sinh viên IT) thực hiện dự án **Bus Operation System (BOS)** - hệ thống quản lý vận hành và doanh thu cho hãng xe khách, tuân thủ pháp luật Việt Nam.

> ⚠️ **QUY TẮC BẮT BUỘC**: Trước khi thực hiện bất kỳ task nào, bạn **PHẢI** đọc file `.agent/checklist.md` để nắm được ngữ cảnh hiện tại, tiến độ dự án và các đầu việc tiếp theo. File `task.md` cũng được tham chiếu từ checklist này. Nếu có thay đổi trong checklist, hãy cập nhật lại file `task.md`.

---

## 2. Thông tin dự án

| Thông tin | Chi tiết |
|-----------|----------|
| **Vai trò** | Sinh viên IT đang làm dự án cho môn học CT201E |
| **Tên dự án** | **Bus Operation System (BOS)** |
| **Loại hệ thống** | Hệ thống quản lý vận hành nội bộ (Internal Operations Management) |
| **Timeline** | **60 ngày** (6 giai đoạn) |
| **Mục tiêu** | Quản lý đội xe, điều độ, doanh thu, tuân thủ quy định giao thông và thuế Việt Nam |
| **Package gốc** | `com.bus.system` |

---

## 3. Roadmap 60 Ngày (Tổng quan)

| Giai đoạn | Thời gian | Mục tiêu chính |
|-----------|-----------|----------------|
| 🟢 **Phase 1** | Ngày 1-7 | Hạ tầng & Database (Flyway V1__init_schema.sql, Security, Early Deploy) |
| 🟡 **Phase 2** | Ngày 8-20 | Core Logic: Fleet, Route, FareConfig, Trip Schedule, Điều độ |
| 🟠 **Phase 3** | Ngày 21-35 | Web Admin Dashboard & Booking Engine |
| 🟣 **Phase 4** | Ngày 36-48 | Flutter App (Driver App, Customer App, QR Check-in) |
| 🟣 **Phase 5** | Ngày 49-54 | Notification (FCM, Telegram Bot), Redis Cache, Báo cáo |
| 🔴 **Phase 6** | Ngày 55-60 | Đóng gói Docker, Demo, Documentation |

---

## 4. Quy tắc giao tiếp

| Quy tắc | Mô tả |
|---------|-------|
| **Ngôn ngữ** | Luôn trả lời bằng **tiếng Việt** |
| **Thuật ngữ kỹ thuật** | Giữ nguyên bằng **tiếng Anh** (ví dụ: API, Controller, Service, Repository, Entity, DTO...) |
| **Cách giải thích** | Giải thích **đơn giản**, có **ví dụ cụ thể** theo ngôn ngữ Java/Spring Boot |
| **Quy tắc Artifact** | Tất cả file report, plan (`.md`) **PHẢI** viết bằng **Tiếng Việt**. |
| **Configuration** | Sử dụng định dạng **YAML** (`.yml`, `.yaml`) thay vì `.properties`. |
| **Quy tắc Báo cáo** | Sau khi hoàn thành một phần việc (Feature/Module), **PHẢI** viết báo cáo chi tiết (`report_xyz.md`) về những việc đã làm. |

## 6. Tuân thủ Pháp luật Việt Nam (Legal Compliance)
> **YÊU CẦU BẮT BUỘC**: Hệ thống phải chặn các hành vi vi phạm pháp luật Giao thông vận tải.

| Hạng mục | Quy định | Implement |
| :--- | :--- | :--- |
| **Đăng kiểm xe** | Xe **KHÔNG** được phép hoạt động nếu **Hết hạn đăng kiểm** (`registration_expiry_date` < `trip_date`). | Check trong `TripService`. |
| **Bằng lái xe** | Tài xế **KHÔNG** được phép lái xe nếu **Hết hạn bằng lái** (`license_expiry_date` < `trip_date`). | Check trong `TripService`. |
| **Thời gian lái** | Không lái quá **4 giờ liên tục** và **10 giờ/ngày**. | (Pending - Implement later) |


---

## 5. Quy tắc code & Clean Code Standards

### 5.0. Clean Code Principles
- **Controllers**:
  - Should be **THIN**. Delegate all business logic to Services.
  - Return `ResponseEntity<T>`.
  - Use DTOs for inputs and outputs (never expose Entities directly).
- **Mappers**:
  - Must include `toEntity` (Input -> Entity) and `toResponse` (Entity -> Output).
  - Centralize all mapping logic (avoid setting fields manually in Services).
  - Use `@Component` (Spring) or MapStruct.
- **Micro-optimizations**:
  - Remove unused imports.
  - Add comments for complex logic only.
  - **Use Imports**: Always use `import` statements at the top of the file. Do NOT use Fully Qualified Class Names (e.g. `java.util.List`) inside the code unless there is a class name conflict.

### 5.1. Naming Conventions (Cơ bản)
| Loại | Quy tắc | Ví dụ |
|------|---------|-------|
| Variable | `camelCase` | `routeName`, `isActive` |
| Class | `PascalCase` | `BusService`, `RouteController` |
| Function/Method | `camelCase` | `findByRouteId()`, `handleException()` |
| Constant | `SCREAMING_CASE` | `MAX_SEATS`, `DEFAULT_PAGE_SIZE` |
| Package | `lowercase` | `com.bus.system.modules.fleet` |

### 5.2. 📋 Naming Conventions theo Layer (Chi tiết)

#### 🎮 Controller Layer
| Thành phần | Pattern | Ví dụ |
|------------|---------|-------|
| **Class name** | `{Entity}Controller` | `BusController`, `RouteController` |
| **Create method** | `create{Entity}` | `createBus()`, `createRoute()` (⚠️ KHÔNG dùng `create()`) |
| **Get all method** | `getAll{Entities}` | `getAllBuses()`, `getAllRoutes()` (⚠️ KHÔNG dùng `getAll()`) |
| **Get by ID** | `get{Entity}ById` | `getBusById()`, `getRouteById()` |
| **Update method** | `update{Entity}` | `updateBus()`, `updateRoute()` |
| **Delete method** | `delete{Entity}` | `deleteBus()`, `deleteRoute()` |
| **Custom action** | `{action}{Entity}` | `assignDriver()`, `cancelTrip()` |

> ⚠️ **QUY TẮC ĐẶT TÊN RÕ RÀNG**:
> - Tên file/class PHẢI phản ánh **chức năng cụ thể**, không chỉ vai trò.
> - Nếu Controller quản lý **một subset** của Entity, thêm suffix mô tả chức năng.
> - **Ví dụ**: `DriverTripController` (quản lý Trip của Driver) thay vì `DriverController` (dễ nhầm với CRUD Driver).
> - **Mục đích**: Tránh xung đột tên khi mở rộng module sau này.

#### 🔧 Service Layer
| Thành phần | Pattern | Ví dụ |
|------------|---------|-------|
| **Interface** | `{Entity}Service` | `BusService`, `RouteService` |
| **Implementation** | `{Entity}ServiceImpl` | `BusServiceImpl`, `RouteServiceImpl` |
| **Vị trí Interface** | `service/` | `modules/fleet/service/BusService.java` |
| **Vị trí Impl** | `service/impl/` | `modules/fleet/service/impl/BusServiceImpl.java` |

> ⚠️ **Lưu ý**: Impl PHẢI nằm trong thư mục `impl/`, không đặt cùng cấp với Interface.

#### 📦 DTO Layer
| Thành phần | Pattern | Ví dụ |
|------------|---------|-------|
| **Request DTO** | `{Entity}Request` | `BusRequest`, `RouteRequest` |
| **Response DTO** | `{Entity}Response` | `BusResponse`, `RouteResponse` |
| **Special Response** | `{Action}{Entity}Response` | `TripGenerationResponse`, `JwtResponse` |
| **Vị trí Request** | `dto/request/` | `modules/fleet/dto/request/BusRequest.java` |
| **Vị trí Response** | `dto/response/` | `modules/fleet/dto/response/BusResponse.java` |

#### 🔄 Mapper Layer
| Thành phần | Pattern | Ví dụ |
|------------|---------|-------|
| **Class name** | `{Entity}Mapper` | `BusMapper`, `RouteMapper` |
| **To Response** | `toResponse(Entity)` | `toResponse(Bus bus)` |
| **To Entity** | `toEntity(Request)` | `toEntity(BusRequest request)` |
| **To List** | `toResponseList(List)` | `toResponseList(List<Bus> entities)` |

#### 🗄️ Repository & Entity Layer
| Thành phần | Pattern | Ví dụ |
|------------|---------|-------|
| **Entity** | `{Entity}` (số ít) | `Bus`, `Route`, `Trip` |
| **Repository** | `{Entity}Repository` | `BusRepository`, `RouteRepository` |
| **Custom Query** | `findBy{Field}`, `existsBy{Field}` | `findByStatus()`, `existsByLicensePlate()` |

### 5.3. ❌ Anti-Patterns (Không được làm)

| Sai | Đúng | Lý do |
|-----|------|-------|
| `create()`, `getAll()` | `createBus()`, `getAllBuses()` | Thiếu context entity |
| `BusServiceImpl.java` cùng cấp Service | Đặt trong `impl/` | Cấu trúc package chuẩn |
| `BusDTO` | `BusRequest`, `BusResponse` | Phân biệt rõ input/output |
| `getAllBus()` | `getAllBuses()` | Danh từ số nhiều cho list |
| `deleteBusById(id)` | `deleteBus(id)` | Tham số `id` đã rõ nghĩa |

### 5.4. Cấu trúc dự án
```
src/main/java/com/bus/system/
├── BackendApplication.java       # Main class
├── common/                       # Shared utilities, exceptions, base classes
│   ├── constant/                # Technical constants (AppConstants, SecurityConstants)
│   ├── enums/                   # Business enums (UserStatus, TripStatus...)
│   ├── exception/               # Custom exceptions & global handler
│   ├── persistence/             # Base entities (BaseEntity, BaseSoftDeleteEntity)
│   ├── response/                # Common responses (ApiResponse, PageResponse)
│   └── utils/                   # Utility classes
├── config/                       # Configuration classes (Security, Swagger, etc.)
└── modules/                      # Feature modules (domain-oriented)
    ├── identity/                # Identity & Access Management (User, Auth)
    ├── hr/                      # Human Resources (Staff, Driver, Department)
    ├── catalog/                 # Master data (Province, Station)
    ├── fleet/                   # Bus & BusType management
    ├── planning/                # Route & TripSchedule
    ├── operation/               # Trip & Dispatch
    ├── pricing/                 # FareConfig & FarePolicy
    ├── sales/                   # Booking & Ticket
    └── notification/            # FCM & Telegram
```

**Mỗi module PHẢI có cấu trúc:**
```
modules/{domain}/
├── controller/          # REST controllers
├── service/             # Interface
│   └── impl/            # ⚠️ Implementation PHẢI nằm đây
├── repository/          # Data access layer
├── domain/              # JPA entities (Entity classes)
├── dto/
│   ├── request/         # Input DTOs
│   └── response/        # Output DTOs
└── mapper/              # Entity <-> DTO converters
```

### 5.5. Quy tắc Entity & Database
| Quy tắc | Mô tả |
|---------|-------|
| **Primary Key** | Sử dụng `Long` cho ID với `@GeneratedValue(strategy = GenerationType.IDENTITY)` |
| **Foreign Key** | Sử dụng `Long` cho tất cả FK |
| **Table naming** | Sử dụng `snake_case` (ví dụ: `bus_routes`, `route_stops`) |
| **Column naming** | Sử dụng `snake_case` |
| **Database type** | BIGSERIAL cho ID columns trong PostgreSQL |
| **Migration** | Sử dụng Flyway cho database migration |

### 5.6. API Design
| Quy tắc | Ví dụ |
|---------|-------|
| **Base path** | `/api/v1/...` |
| **Resource naming** | Danh từ số nhiều: `/buses`, `/routes`, `/drivers` |
| **HTTP Methods** | GET (read), POST (create), PUT (update all), PATCH (update partial), DELETE |
| **Response wrapper** | Sử dụng `ApiResponse<T>` cho tất cả response |
| **Pagination** | Sử dụng Spring Data Pageable |

### 5.6. ⚠️ Quy tắc Constants & Enums (Strict Separation)

> **Nguyên tắc cốt lõi**: Không bao giờ gộp chung **cấu hình kỹ thuật** (Technical Config) và **dữ liệu nghiệp vụ** (Business Data) vào cùng một file.

#### ✅ Khi nào dùng ENUM?
| Tiêu chí | Chi tiết |
|----------|----------|
| **Mục đích** | Dữ liệu nghiệp vụ có tập giá trị hữu hạn |
| **Vị trí** | `com.bus.system.common.enums` |
| **Ví dụ** | Trạng thái (ACTIVE, DELETED), Loại xe (SLEEPER, SEATER), Vai trò (ADMIN, DRIVER) |
| **Lợi ích** | Type-safety, Database Mapping, tránh Typo |

```java
// ✅ ĐÚNG: Business Data dùng Enum
public enum TicketStatus {
    PENDING,    // Đang giữ ghế
    PAID,       // Đã thanh toán
    CANCELLED,  // Đã hủy
    REFUNDED    // Đã hoàn tiền
}

// Entity sử dụng Enum
@Enumerated(EnumType.STRING)
private TicketStatus status;
```

#### ✅ Khi nào dùng CONSTANT?
| Tiêu chí | Chi tiết |
|----------|----------|
| **Mục đích** | Cấu hình kỹ thuật, tham số hệ thống, giá trị compile-time |
| **Vị trí** | `com.bus.system.common.constant` |
| **Ví dụ** | Security SpEL, Pagination defaults, Regex, System config |

```java
// ✅ ĐÚNG: Technical Config dùng Constant
public final class SecurityConstants {
    private SecurityConstants() {} // Prevent instantiation
    
    public static final String HAS_ROLE_ADMIN = "hasRole('ADMIN')";
    public static final String HEADER_STRING = "Authorization";
    public static final String TOKEN_PREFIX = "Bearer ";
}
```

#### ❌ Điều CẤM KỴ (Anti-Patterns)

| Anti-Pattern | Mô tả | Vi phạm |
|--------------|-------|---------|
| **God Class** | Tạo `AppConstants` khổng lồ chứa mọi thứ | ❌ Cấm |
| **String cho Status** | `String status = "ACTIVE"` | ❌ Bắt buộc dùng Enum |
| **Hardcode** | Viết số `10`, `20` hay `"ROLE_ADMIN"` trực tiếp | ❌ Phải dùng Constant |
| **Gộp chung** | Nhét Status + Error Message + Config vào 1 file | ❌ Phải tách riêng |

```java
// ❌ SAI: Dùng String constant cho status
private String status = AppConstants.STATUS_ACTIVE;

// ✅ ĐÚNG: Dùng Enum
private UserStatus status = UserStatus.ACTIVE;
```

---

### 5.7. 🏛️ Quy tắc Master Data (Dữ liệu tĩnh)

> **Định nghĩa**: Master Data là dữ liệu được quy định bởi cơ quan nhà nước, không thay đổi trừ khi có nghị quyết/quyết định chính thức.

#### 📋 Danh sách Master Data trong BOS
| Entity | Nguồn dữ liệu | Số lượng | Mô tả |
|--------|---------------|----------|-------|
| **Province** (Tỉnh/Thành) | Tổng cục Thống kê (GSO) | 63+ | Đơn vị hành chính cấp tỉnh |
| **BusStation** (Bến xe) | Sở GTVT / Bộ GTVT | ~200+ | Bến xe pháp lý được cấp phép |
| **District** (Quận/Huyện) | Tổng cục Thống kê (GSO) | ~700+ | Đơn vị hành chính cấp huyện |
| **Ward** (Phường/Xã) | Tổng cục Thống kê (GSO) | ~10.000+ | Đơn vị hành chính cấp xã |

> ⚠️ **BusStation** là bến xe pháp lý do Sở GTVT/Bộ GTVT cấp phép. Mã bến (`gov_code`) do nhà nước quy định.

#### 🔒 Thiết kế CRUD cho Master Data

| Thao tác | Cho phép? | Cách thực hiện |
|----------|-----------|----------------|
| **CREATE** | ✅ ADMIN | Khi có bến xe mới được cấp phép hoặc chia tách/sáp nhập |
| **READ** | ✅ Public | API công khai cho dropdown chọn địa điểm |
| **UPDATE** | ❌ KHÔNG | Tạo bản ghi mới thay vì sửa để giữ lịch sử |
| **DELETE** | ✅ Soft | Vô hiệu hóa (soft delete) khi bến xe đóng cửa/sáp nhập |

> ⚠️ **Tại sao không có UPDATE?**
> - Khi nhà nước đổi tên tỉnh/bến xe, mã và ranh giới có thể thay đổi
> - Dữ liệu lịch sử (chuyến xe, vé cũ) cần tham chiếu đúng bản ghi CŨ
> - Quy trình: Deactivate bản ghi cũ → Create bản ghi mới

#### 📌 Ví dụ Implementation

```java
// ProvinceController.java - Có POST, GET, DELETE (soft), KHÔNG có PUT
@RestController
@RequestMapping("/api/catalog/provinces")
public class ProvinceController {
    
    @PostMapping  // ✅ Tạo tỉnh mới khi chia tách/sáp nhập
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProvinceResponse> createProvince(...) { }
    
    @GetMapping  // ✅ Public API cho dropdown
    public ResponseEntity<List<ProvinceResponse>> getAllProvinces() { }
    
    @DeleteMapping("/{id}")  // ✅ Soft delete khi sáp nhập
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivateProvince(...) { }
    
    // ❌ KHÔNG có PUT - Tạo bản ghi mới thay vì update
}
```

#### 💡 Flyway Migration cho Province
```sql
-- V2__seed_provinces.sql
INSERT INTO province (code, name) VALUES
('01', 'Hà Nội'),
('79', 'TP. Hồ Chí Minh'),
('48', 'Đà Nẵng'),
-- ... 63 tỉnh thành theo mã GSO
```

---

## 6. Công nghệ sử dụng

### Backend (Java/Spring Boot)
| Layer | Công nghệ |
|-------|-----------|
| **Framework** | Spring Boot 3.4.1 |
| **Language** | Java 21 |
| **Database** | PostgreSQL (Supabase/Neon/Railway) |
| **ORM** | Spring Data JPA / Hibernate |
| **Migration** | Flyway |
| **Security** | Spring Security + JWT (jjwt 0.11.5) |
| **Validation** | Jakarta Validation + json-schema-validator |
| **API Docs** | SpringDoc OpenAPI (Swagger UI) |
| **Caching** | Redis |
| **Distributed Lock** | Redisson (Giữ ghế 5 phút) |
| **Real-time** | WebSocket STOMP (Sơ đồ ghế real-time) |
| **Payment** | VNPay Sandbox |
| **Notification** | Firebase FCM + Telegram Bot |
| **Utility** | Lombok |
| **Build Tool** | Maven |
| **Container** | Docker |

### Frontend (Web)
| Layer | Công nghệ |
|-------|-----------|
| **Framework** | Next.js |
| **Real-time** | STOMP over WebSocket |
| **Seat Map** | Grid/Flexbox rendering từ JSON |

### Mobile (Flutter)
| Layer | Công nghệ |
|-------|-----------|
| **Framework** | Flutter (GetX/Bloc) |
| **Storage** | Secure Storage (Token) |
| **QR Scanner** | Camera plugin |
| **Notification** | Firebase Cloud Messaging |

### DevOps & Tools
| Tool | Mục đích |
|------|----------|
| **Docker** | Containerization |
| **Render/Railway** | Cloud Deployment |
| **Ngrok** | Local tunnel (Test VNPay IPN) |
| **Postman** | API Testing |

---

## 7. Core Modules (Theo SQL Schema)

### 🚌 Module 1: Fleet Management (Quản lý đội xe)
| Table | Mô tả |
|-------|--------|
| `bus_type` | Loại xe, sơ đồ ghế (JSON `seat_map`) |
| `bus` | Xe khách: biển số, GPS, bảo hiểm, đăng kiểm |
| `bus_station` | Bến xe theo tỉnh/thành |
| `vehicle_handover` | Bàn giao xe cho tài xế |

### 📥 Module 2: Operation & Dispatch (Điều độ)
| Table | Mô tả |
|-------|--------|
| `route` | Tuyến đường: điểm đi/đến, danh sách điểm dừng |
| `trip_schedule` | Lịch chạy cố định (Bitmap ngày trong tuần) |
| `trip` | Chuyến xe cụ thể: Mã lệnh vận chuyển điện tử, QR Code |
| `trip_staff` | Phân công phụ xe, tiếp viên |
| `gov_data_transmission` | Log gửi dữ liệu GPS lên Tổng cục Đường bộ |

### 💰 Module 3: Fare & Revenue Management (Doanh thu)
| Table | Mô tả |
|-------|--------|
| `fare_config` | Cấu hình giá vé theo tuyến + loại xe (SCD Type 2) |
| `fare_policies` | Chính sách hoàn/giảm/phụ thu (JSONB conditions & action) |
| `refund_transactions` | Giao dịch hoàn tiền |

### 🎫 Module 4: Sales & Booking (Bán vé)
| Table | Mô tả |
|-------|--------|
| `booking` | Đơn đặt vé: Kênh bán, trạng thái, hết hạn |
| `ticket` | Vé xe: Số ghế, giá, VAT, check-in |
| `payment_history` | Lịch sử thanh toán |

### 👤 Module 5: Identity (Định danh & Bảo mật)
| Table | Mô tả |
|-------|--------|
| `users` | Người dùng hệ thống (Login, Password, Role) |
| `user_devices` | Quản lý thiết bị & FCM Token |
| `refresh_tokens` | JWT Refresh Token cho Mobile App |

### 👔 Module 6: Human Resources (Nhân sự)
| Table | Mô tả |
|-------|--------|
| `departments` | Phòng ban, đơn vị tổ chức |
| `staff_detail` | Hồ sơ nhân viên (Bán vé, Điều hành...) |
| `driver_detail` | Hồ sơ tài xế (Bằng lái, Hạn bằng...) |
| `admin_detail` | Hồ sơ quản trị viên |


### 🔒 Database Triggers (Logic bảo vệ)
| Trigger | Chức năng |
|---------|----------|
| `trg_check_seat_availability` | Chặn đặt ghế đang bị giữ bởi Booking PENDING |
| `trg_check_trip_overlap` | Chặn xe/tài xế trùng lịch |
| `trg_check_fare_overlap` | Chặn giá vé trùng thời gian |
| `trg_check_schedule_overlap` | Giãn cách 30 phút giữa các chuyến |
| `trg_check_handover_overlap` | Chặn bàn giao xe/tài xế trùng |
| `trg_auto_cancel_tickets` | Tự động hủy vé khi Trip bị hủy |

### 🛡️ Quy tắc Bảo vệ 2 Lớp (Defense in Depth)

> ⚠️ **QUAN TRỌNG**: Logic **ServiceImpl** (không phải Controller) **PHẢI** kiểm tra kỹ **TRƯỚC KHI** dữ liệu xuống DB. Controller chỉ gọi Service, **KHÔNG** chứa logic nghiệp vụ.

| Lớp | Nhiệm vụ | Ví dụ |
|-----|----------|-------|
| **Controller** | Nhận request, gọi Service, trả response | `return tripService.createTrip(request);` |
| **ServiceImpl** | **Validation chính (100%)** + Logic nghiệp vụ | `if (tripRepository.existsMainTrip(...)) throw BusinessException` |
| **Repository** | Thao tác DB | `save()`, `findById()`, `existsBy...()` |
| **Database Trigger** | Chốt chặn cuối cùng (Fallback cho Race Condition) | `trg_check_trip_overlap` |

**Lý do**:
- Trigger chỉ bắn lỗi Generic (`RAISE EXCEPTION`), khó localize message.
- Logic ở ServiceImpl dễ test, dễ debug, dễ hiểu, dễ tái sử dụng.
- DB Trigger là "bảo hiểm" cho trường hợp 2 request đồng thời (Race Condition).

**❌ Anti-Pattern**:
- Controller chứa logic `if (...) throw` → Sai! Phải đưa vào Service.
- Không validate trùng/tồn tại mà để Trigger bắt → Sai!

---

## 8.1 Quy tắc RESTful API Best Practices

### 📍 HTTP Status Code chuẩn

| Action | HTTP Status | Ví dụ |
|--------|-------------|-------|
| Tạo mới thành công | **201 Created** | `ResponseEntity.status(HttpStatus.CREATED).body(...)` |
| Lấy/Sửa/Xóa thành công | **200 OK** | `ResponseEntity.ok(...)` |
| Validation fail | **400 Bad Request** | `@Valid` + `GlobalExceptionHandler` |
| Không tìm thấy | **404 Not Found** | `throw new ResourceNotFoundException(...)` |

```java
// ✅ ĐÚNG: POST trả về 201
@PostMapping
public ResponseEntity<ApiResponse<T>> create(...) {
    return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(result, "Tạo thành công"));
}
```

### 📍 Pagination cho danh sách lớn

> Nếu API có thể trả về > 50 bản ghi, **PHẢI** dùng `Pageable`.

```java
// ✅ ĐÚNG: Có phân trang
@GetMapping
public ResponseEntity<ApiResponse<Page<T>>> getAll(Pageable pageable) {
    return ResponseEntity.ok(ApiResponse.success(service.getAll(pageable)));
}
```

### 📍 Security cho API nội bộ

> API thuộc module **quản trị nội bộ** (Planning, Fleet, Pricing...) **PHẢI** có `@PreAuthorize`.
> Chỉ API **public** (Tìm chuyến, Tra cứu vé...) mới được bỏ qua.

```java
// ✅ ĐÚNG: API nội bộ có bảo mật
@GetMapping
@PreAuthorize(AppConstants.HAS_ANY_ROLE_ADMIN_STAFF)
public ResponseEntity<...> getSchedulesByRoute(...) { ... }
```

---

## 9. Điều AI cần làm

✅ **NÊN:**
- Giải thích rõ ràng, đơn giản, có ví dụ
- Cung cấp code chạy được và tuân thủ best practices của Spring Boot
- Chỉ ra lỗi và cách sửa chi tiết
- Hỏi lại nếu yêu cầu không rõ ràng
- Đề xuất cải tiến code nếu phát hiện vấn đề tiềm ẩn
- Tuân thủ SOLID principles

---

## 10. Điều AI không được làm

❌ **KHÔNG ĐƯỢC:**
- **Đoán mò** - Nếu không biết, nói rõ: *"Tôi không chắc về điều này"*
- **Tự ý thay đổi logic quan trọng** mà chưa hỏi ý kiến
- Bỏ qua lỗi mà không giải thích
- Dùng thuật ngữ phức tạp không cần thiết
- Cung cấp thông tin không chắc chắn mà không cảnh báo
- Sử dụng các pattern/library không có trong pom.xml mà chưa hỏi

---

## 11. Workflow làm việc

```
1. Đọc và hiểu yêu cầu
   ↓
2. Hỏi lại nếu chưa rõ
   ↓
3. Đề xuất giải pháp / thiết kế
   ↓
4. Viết code + giải thích
   ↓
5. Hướng dẫn test / chạy thử (mvn test, Swagger UI...)
   ↓
6. Nếu KHÔNG có lỗi → Push lên GitHub
```

### 11.2. Quy trình xử lý Yêu cầu Hướng dẫn (Theo yêu cầu User)
> ⚠️ **QUAN TRỌNG**: Khi user yêu cầu "Hướng dẫn", "Cách làm" hoặc "Explain":
> 1. **KHÔNG** được viết code trực tiếp vào dự án ngay lập tức.
> 2. **PHẢI** tạo một file hướng dẫn chi tiết (Artifact, ví dụ `guide_xyz.md`).
> 3. Trong file hướng dẫn phải có **Code Mẫu (Snippets)** để user tự hiểu và tự làm.
> 4. **BẮT BUỘC**: Phải comment và giải thích **từng dòng syntax** (Annotation, Keyword...) vì User chưa rành Spring Boot 3.
> 5. Chỉ thực hiện code vào dự án khi user xác nhận hoặc yêu cầu cụ thể sau khi đã đọc hướng dẫn.

---

## 12. Quy tắc Git

| Quy tắc | Mô tả |
|---------|-------|
| **Auto push** | Sau khi update code, nếu không có lỗi → tự động commit và push lên GitHub |
| **Commit message format** | `type(scope): description` (tiếng Anh) |
| **Commit types** | `feat`, `fix`, `refactor`, `docs`, `test`, `chore` |
| **Kiểm tra trước push** | Chạy `git status` và `mvn compile` để xác nhận |

**Ví dụ commit message:**
- `feat(route): add CRUD endpoints for routes`
- `fix(auth): resolve JWT token expiration issue`
- `refactor(bus): extract validation logic to service`

---

## 13. Quy trình chạy & test

| Lệnh | Mô tả |
|------|-------|
| `./mvnw spring-boot:run` | Chạy ứng dụng (development) |
| `./mvnw test` | Chạy unit tests |
| `./mvnw compile` | Compile để kiểm tra lỗi |
| `./mvnw clean package` | Build JAR file |

**Swagger UI:** Truy cập `http://localhost:8080/swagger-ui.html` sau khi chạy ứng dụng

---

## 14. Security Best Practices

- **Không hardcode** sensitive data (JWT secret, DB password) → sử dụng environment variables hoặc application-*.yml
- **Validate input** luôn luôn với `@Valid` và Jakarta Bean Validation
- **Authorize endpoints** với `@PreAuthorize` hoặc SecurityFilterChain config
- **Hash passwords** với BCryptPasswordEncoder

---

## 15. Reference Repositories (GitHub tham khảo)

### 🚌 Dự án cốt lõi: Bus Reservation System

| Repository | Công nghệ | Giá trị tham khảo |
|------------|-----------|-------------------|
| [safadtm/bus_reservation_springboot](https://github.com/safadtm/bus_reservation_springboot) | Spring Boot, Spring Security, MySQL, JPA | Thiết kế Entity: `Bus` - `Route` - `Schedule`, Booking flow |
| [yoanesber/Spring-Boot-JWT-Auth-PostgreSQL](https://github.com/yoanesber/Spring-Boot-JWT-Auth-PostgreSQL) | Spring Boot 3, PostgreSQL, Spring Security 6 | Cấu hình JWT (Access + Refresh Token) chuẩn PostgreSQL |

### ⚙️ Kỹ thuật nâng cao

| Repository | Công nghệ | Giá trị tham khảo |
|------------|-----------|-------------------|
| [slydeveloper/springboot-flyway-postgres-docker](https://github.com/slydeveloper/springboot-flyway-postgres-docker) | Flyway, Gradle, Docker | Tổ chức thư mục `db/migration`, `V1__init.sql` |
| [kh77/sb-redisson-lock](https://github.com/kh77/sb-redisson-lock) | Redisson, Redis | Annotation `@DistributedLock`, `RLock` chặn transaction song song |
| [callicoder/spring-boot-websocket-chat-demo](https://github.com/callicoder/spring-boot-websocket-chat-demo) | WebSocket STOMP | Cơ chế Broadcast message, subscribe theo room/topic |
| [koushikkothagal/movie-booking-application](https://github.com/koushikkothagal/movie-booking-application) | Microservices | Cấu trúc Entity `Seat`, `Booking` - logic chọn ghế giống xe khách |

### 📚 Tài liệu kỹ thuật

| Chủ đề | Link tham khảo |
|--------|----------------|
| **Bitmasking (Lịch chạy T2-CN)** | [Baeldung - Bitwise Operations in Java](https://www.baeldung.com/java-bitwise-operators) |
| **Logic công thức** | `(bitmap & (1 << (dayOfWeek - 1))) > 0` |

---

## 16. WebSocket Architecture (Kiến trúc Real-time Seat Map)

### 🎯 Công nghệ sử dụng
- **Spring Boot Starter WebSocket** (Giao thức STOMP)
- **Redis (Redisson)**: Distributed Lock - Tránh 2 người cùng lock 1 ghế

### 📊 Sequence Flow (Luồng hoạt động)

```
┌──────────────────────────────────────────────────────────────────────┐
│  BƯỚC 1: SUBSCRIBE                                                   │
│  ─────────────────                                                   │
│  User A & B vào xem chuyến xe ID 100                                 │
│  Frontend subscribe → /topic/trip/100                                │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│  BƯỚC 2: LOCK GHẾ                                                    │
│  ────────────────                                                    │
│  User A bấm ghế A1                                                   │
│  Frontend gửi → /app/lock-seat                                       │
│  Body: { "tripId": 100, "seatNo": "A1" }                             │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│  BƯỚC 3: BACKEND XỬ LÝ                                               │
│  ─────────────────────                                               │
│  Server nhận message                                                 │
│  Redisson check: Ghế A1 đã bị ai giữ chưa?                           │
│  Nếu chưa → Lưu Redis: Key=TRIP_100_A1, Value=UserA, TTL=300s        │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│  BƯỚC 4: BROADCAST (QUAN TRỌNG NHẤT)                                 │
│  ───────────────────────────────────                                 │
│  Server bắn message → /topic/trip/100                                │
│  Body: { "seatNo": "A1", "status": "LOCKED_BY_OTHER", "color": "RED" }│
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│  BƯỚC 5: FRONTEND CẬP NHẬT                                           │
│  ─────────────────────────                                           │
│  User B (và tất cả người khác) nhận message                          │
│  → Đổi màu ghế A1 sang XAÁM/ĐỎ                                        │
│  → Disable click vào ghế A1                                          │
└──────────────────────────────────────────────────────────────────────┘
```

### 🔑 Redis Key Pattern
```
Key Format:   TRIP_{tripId}_{seatNo}
Example:      TRIP_100_A1
Value:        userId (người đang giữ ghế)
TTL:          300 seconds (5 phút)
```

### 📡 WebSocket Endpoints
| Endpoint | Mô tả |
|----------|-------|
| `SUBSCRIBE /topic/trip/{tripId}` | Nhận thông báo real-time về trạng thái ghế |
| `SEND /app/lock-seat` | Gửi yêu cầu giữ ghế |
| `SEND /app/unlock-seat` | Gửi yêu cầu bỏ giữ ghế |
| `SEND /app/confirm-seat` | Xác nhận đặt ghế (sau khi thanh toán) |

### 🎨 Seat Status Colors
| Status | Color | Mô tả |
|--------|-------|-------|
| `AVAILABLE` | 🟢 Green | Ghế trống, có thể chọn |
| `LOCKED_BY_ME` | 🔵 Blue | Ghế đang được mình giữ |
| `LOCKED_BY_OTHER` | 🟡 Yellow/Gray | Ghế đang được người khác giữ |
| `BOOKED` | 🔴 Red | Ghế đã được đặt |

---

## 17. 🇻🇳 Tuân thủ Pháp luật Việt Nam (Legal Compliance)

> ⚠️ **QUAN TRỌNG**: Dự án BOS phải tuân thủ các quy định pháp luật Việt Nam. Các văn bản dưới đây phải được áp dụng vào code.

### 📋 1. Quản lý Vận tải & Điều độ (Module Fleet & Operation)

| Văn bản | Yêu cầu | Áp dụng trong Code |
|---------|---------|-------------------|
| **Nghị định 10/2020/NĐ-CP** | Lệnh vận chuyển điện tử (Electronic Transport Order) **bắt buộc** trước khi xe xuất bến. Lưu trữ tối thiểu **3 năm** | Bảng `trip` có cột `electronic_transport_order_code`. Không cho xe chạy nếu thiếu Tài xế/Biển số |
| **Thông tư 12/2020/TT-BGTVT** | Dữ liệu GPS phải truyền liên tục về Tổng cục Đường bộ Việt Nam | Bảng `gov_data_transmission` log việc gửi dữ liệu |
| **Luật Giao thông đường bộ 2008** | Tài xế không lái quá **4 giờ liên tục** và không quá **10 giờ/ngày** | Logic check lịch sử lái xe khi Assign Driver |
| **Nghị định 86/2014/NĐ-CP** | Điều kiện kinh doanh vận tải hành khách bằng ô tô | Quản lý giấy phép, phù hiệu xe trong bảng `bus` |

### 🧾 2. Vé điện tử & Hóa đơn (Module Pricing & Ticket)

| Văn bản | Yêu cầu | Áp dụng trong Code |
|---------|---------|-------------------|
| **Nghị định 123/2020/NĐ-CP** | Vé xe khách điện tử được coi là Hóa đơn GTGT. Phải có Ký hiệu, Mẫu số, Mã cơ quan thuế | Bảng `ticket` lưu `invoice_lookup_code`, QR Code |
| **Thông tư 78/2021/TT-BTC** | Thời điểm xuất vé = thời điểm thu tiền | Booking PAID → kích hoạt xuất hóa đơn ngay lập tức |
| **Luật Giá 2012 & TT 152/2014/TT-BTC** | Giá vé phải đúng với giá đã kê khai Sở Tài chính | Bảng `fare_config`, `fare_policies` quản lý chặt giá gốc |
| **Luật Kinh doanh bảo hiểm** | Giá vé đã bao gồm bảo hiểm hành khách | Công thức: **Giá cước + VAT + Phí bảo hiểm** |
| **Thông tư 63/2019/TT-BTC** | Quy định về hóa đơn điện tử | Tích hợp API hóa đơn điện tử (VNPT, Viettel, FPT...) |

### 🔐 3. Bảo mật Dữ liệu & Người dùng (Module Auth)

| Văn bản | Yêu cầu | Áp dụng trong Code |
|---------|---------|-------------------|
| **Nghị định 13/2023/NĐ-CP** | Phải có sự đồng ý (Consent) khi thu thập dữ liệu cá nhân (SĐT, Email, Tên) | Checkbox "Tôi đồng ý điều khoản" khi đăng ký. Mã hóa mật khẩu |
| **Luật An ninh mạng 2018** | Dữ liệu người dùng Việt Nam phải lưu trữ tại máy chủ ở Việt Nam | Chọn Server/Database tại Region Việt Nam |
| **Nghị định 15/2020/NĐ-CP** | Xử phạt vi phạm hành chính trong lĩnh vực CNTT | Tuân thủ quy định về bảo mật, mã hóa dữ liệu nhạy cảm |

### 🛒 4. Thương mại Điện tử (Website & App)

| Văn bản | Yêu cầu | Áp dụng trong Code |
|---------|---------|-------------------|
| **Nghị định 52/2013/NĐ-CP & 85/2021/NĐ-CP** | Website/App bán vé phải thông báo Bộ Công Thương (logo xanh). Công bố chính sách hoàn hủy vé rõ ràng | Footer website có logo Bộ Công Thương, trang Policy |
| **Luật Giao dịch điện tử 2023** | Vé điện tử có giá trị pháp lý tương đương vé giấy | Màn hình "Vé của tôi" hiển thị đầy đủ thông tin pháp lý |
| **Luật Bảo vệ quyền lợi người tiêu dùng 2023** | Chính sách hoàn tiền, hủy vé rõ ràng | Bảng `fare_policies` với type='REFUND' |

### 💰 5. Thuế & Tài chính

| Văn bản | Yêu cầu | Áp dụng trong Code |
|---------|---------|-------------------|
| **Luật Thuế GTGT** | Dịch vụ vận tải chịu thuế GTGT 8% | Cột `vat_rate` trong bảng `ticket` (default 0.08) |
| **Thông tư 200/2014/TT-BTC** | Chế độ kế toán doanh nghiệp | Báo cáo doanh thu, chi phí theo chuẩn VAS |
| **Nghị định 126/2020/NĐ-CP** | Quản lý thuế với hóa đơn điện tử | Lưu trữ hóa đơn điện tử 10 năm |

### 🚨 6. An toàn Giao thông

| Văn bản | Yêu cầu | Áp dụng trong Code |
|---------|---------|-------------------|
| **Nghị định 100/2019/NĐ-CP** | Xử phạt vi phạm giao thông đường bộ | Log cảnh báo vi phạm tốc độ, thời gian lái |
| **Thông tư 73/2014/TT-BGTVT** | Quy định về thiết bị giám sát hành trình | Tích hợp GPS, lưu trữ dữ liệu hành trình trong bảng `bus.gps_device_id` |

---

## 18. Bitmasking Logic (Lịch chạy T2-CN)

### Công thức kiểm tra ngày chạy
```java
// operation_days_bitmap: SMALLINT (0-127)
// Bit 0 = Monday, Bit 1 = Tuesday, ..., Bit 6 = Sunday
// 127 = 1111111 (binary) = Chạy tất cả các ngày

int dayOfWeek = localDate.getDayOfWeek().getValue(); // 1=Monday, 7=Sunday
boolean isOperatingDay = (bitmap & (1 << (dayOfWeek - 1))) > 0;
```

### Ví dụ giá trị bitmap
| Bitmap | Binary | Ý nghĩa |
|--------|--------|---------|
| 127 | 1111111 | Chạy tất cả các ngày (T2-CN) |
| 31 | 0011111 | Chạy T2-T6 (ngày thường) |
| 96 | 1100000 | Chỉ chạy T7, CN (cuối tuần) |
| 62 | 0111110 | Chạy T3-T7 |
