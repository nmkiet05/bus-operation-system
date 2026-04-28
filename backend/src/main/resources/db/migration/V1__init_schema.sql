/* ======================================================================================
 * HỆ THỐNG: BUS OPERATION SYSTEM (BOS)
 * ====================================================================================== */

-- 1. XÓA BẢNG CŨ (NẾU CẦN, TÙY CHỌN DÙNG LỆNH CỦA FLYWAY THAY THẾ)
-- Không dùng DROP SCHEMA CASCADE vì sẽ gây Deadlock với pgAdmin khi khởi chạy Docker
-- ======================================================================================
-- 2. HÀM DÙNG CHUNG (COMMON FUNCTIONS)
-- ======================================================================================
-- Hàm cập nhật thời gian updated_at tự động khi bản ghi thay đổi
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ======================================================================================
-- 3. QUẢN TRỊ NGƯỜI DÙNG & DANH MỤC (MASTER DATA & AUTH)
-- ======================================================================================

-- Bảng Tỉnh/Thành phố
CREATE TABLE province
(
    id         BIGSERIAL PRIMARY KEY,        -- ID tự tăng
    name       VARCHAR(100) NOT NULL,        -- Tên tỉnh
    gov_code   VARCHAR(10)  NOT NULL UNIQUE, -- Mã tỉnh theo quy định GSO (Tổng cục Thống kê)
    deleted_at TIMESTAMP,                    -- Thời gian xóa mềm (Soft delete)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Thời gian tạo
);

-- Bảng Bến xe (Điểm đầu/cuối của các tuyến)
CREATE TABLE bus_station
(
    id          BIGSERIAL PRIMARY KEY,        -- ID tự tăng
    name        VARCHAR(100) NOT NULL,        -- Tên bến xe
    address     TEXT,                         -- Địa chỉ cụ thể
    province_id BIGINT REFERENCES province (id), -- Liên kết với tỉnh thành
    gov_code    VARCHAR(20)  NOT NULL UNIQUE, -- Mã bến do cơ quan quản lý nhà nước cấp
    status      VARCHAR(20) DEFAULT 'ACTIVE', -- Trạng thái bến (ACTIVE/INACTIVE)
    deleted_at  TIMESTAMP,                    -- Thời gian xóa mềm
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Phòng ban/Đơn vị tổ chức
CREATE TABLE departments
(
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL UNIQUE, -- Mã phòng ban (ví dụ: IT, OPS, HR)
    name        VARCHAR(100) NOT NULL,        -- Tên phòng ban
    description TEXT,                         -- Mô tả chức năng
    parent_id   BIGINT REFERENCES departments (id), -- Phòng ban cha (Cấu trúc cây)
    status      VARCHAR(20) DEFAULT 'ACTIVE',
    deleted_at  TIMESTAMP,
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    version     BIGINT      DEFAULT 0
);

-- Văn phòng/Kiosk/Đại lý bán vé - Có thể thuộc bến xe hoặc độc lập
CREATE TABLE ticket_office
(
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,                -- Tên văn phòng
    station_id      BIGINT REFERENCES bus_station (id),   -- Thuộc bến xe nào (NULL nếu là đại lý ngoài)
    address         TEXT,                                 -- Địa chỉ văn phòng
    location_detail TEXT,                                 -- Vị trí chi tiết (Tầng 1, Quầy số 5...)
    phone           VARCHAR(20),                          -- Điện thoại liên hệ
    status          VARCHAR(20) DEFAULT 'ACTIVE',
    deleted_at      TIMESTAMP,
    created_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    version         BIGINT      DEFAULT 0
);

-- Bảng Người dùng hệ thống (Nhân viên, Tài xế, Khách hàng...)
CREATE TABLE users
(
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE, -- Tên đăng nhập
    password      VARCHAR(255) NOT NULL,        -- Mật khẩu (đã mã hóa)
    full_name     VARCHAR(100) NOT NULL,        -- Họ và tên đầy đủ
    email         VARCHAR(100) UNIQUE,          -- Email liên hệ
    phone         VARCHAR(20) UNIQUE,           -- Số điện thoại (dùng để đăng nhập hoặc OTP)
    -- Mã nhân viên công khai — UNIQUE TOÀN HỆ THỐNG, không phân biệt role
    -- tài xế / nhân viên / admin dùng chung không gian mã, không bao giờ trùng nhau
    employee_code VARCHAR(20) UNIQUE,           -- VD: EMP-0001, DRV-0042
    avatar_url    TEXT,                         -- Đường dẫn ảnh đại diện
    status        VARCHAR(20) DEFAULT 'ACTIVE', -- Trạng thái (ACTIVE, LOCKED...)
    deleted_at    TIMESTAMP,
    created_at    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    version       BIGINT      DEFAULT 0         -- Phiên bản để Optimistic Locking
);

-- Phân quyền Multi-Role (1 User có thể có nhiều vai trò)
CREATE TABLE user_roles
(
    user_id BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role    VARCHAR(20) NOT NULL,
    PRIMARY KEY (user_id, role)
);

-- [MOBILE] Thiết bị người dùng (Quản lý FCM Token cho Push Notification)
CREATE TABLE user_devices
(
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT REFERENCES users (id) ON DELETE CASCADE, -- Người dùng sở hữu thiết bị
    fcm_token      TEXT NOT NULL,            -- Token Firebase Cloud Messaging
    device_type    VARCHAR(20),              -- Loại thiết bị (IOS, ANDROID, WEB)
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Lần cuối hoạt động
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version        BIGINT    DEFAULT 0,
    UNIQUE (user_id, fcm_token)              -- Một user không lưu trùng token
);

-- [SECURITY] Refresh Token cho Mobile App (Cơ chế Authen lâu dài)
CREATE TABLE refresh_tokens
(
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users (id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL UNIQUE, -- Chuỗi refresh token
    expiry_date TIMESTAMP    NOT NULL,        -- Thời điểm hết hạn
    revoked     BOOLEAN   DEFAULT FALSE,      -- Đã bị thu hồi hay chưa
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version     BIGINT    DEFAULT 0
);

-- Chi tiết thông tin Admin
CREATE TABLE admin_detail
(
    user_id       BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE, -- Khóa chính cũng là FK trỏ về users
    department_id BIGINT REFERENCES departments (id), -- Thuộc phòng ban nào
    access_level  INTEGER DEFAULT 1                   -- Cấp độ truy cập
);

-- Chi tiết thông tin Nhân viên bán vé/điều hành
CREATE TABLE staff_detail
(
    user_id            BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    employee_code      VARCHAR(20) NOT NULL UNIQUE,        -- Mã nhân viên
    department_id      BIGINT REFERENCES departments (id),
    
    -- [QUAN TRỌNG 1] Phân loại vị trí công việc chi tiết
    -- Dùng Enum trong Java: SALES_OFFICER (Bán vé), DISPATCHER (Điều độ), ACCOUNTANT (Kế toán)...
    job_title          VARCHAR(50) NOT NULL, 

    -- [QUAN TRỌNG 2] Địa điểm làm việc "Biên chế" (Home Base)
    -- Nhân viên điều độ: Bắt buộc phải thuộc một Bến xe (station_id)
    -- Nhân viên bán vé: Có thể thuộc Bến xe HOẶC Văn phòng đại lý bên ngoài (lúc này station_id có thể null)
    station_id         BIGINT REFERENCES bus_station (id), -- Làm việc tại bến nào

    -- [DÀNH RIÊNG CHO BÁN VÉ]
    -- Nếu là Sales, họ thường được gán cố định vào một Văn phòng/Kiosk chính để quản lý doanh thu
    assigned_office_id BIGINT REFERENCES ticket_office (id),

    -- [MỞ RỘNG] Các thuộc tính bổ sung (JSONB) cho các vị trí đặc thù
    -- VD: Kế toán có "cpa_license", Sales có "kpi_target"...
    -- VD: Phụ xe/Tiếp viên có "training_cert", "foreign_language"...
    attributes         JSONB CHECK (attributes IS NULL OR jsonb_typeof(attributes) = 'object'),

    -- Ràng buộc logic (Optional nhưng nên có):
    -- Nếu là DISPATCHER thì phải có station_id
    CONSTRAINT chk_dispatcher_station CHECK (
        job_title <> 'DISPATCHER' OR station_id IS NOT NULL
    )
);

-- Chi tiết thông tin Tài xế
CREATE TABLE driver_detail
(
    user_id             BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    department_id       BIGINT REFERENCES departments (id),
    license_number      VARCHAR(50) NOT NULL UNIQUE, -- Số bằng lái xe
    license_class       VARCHAR(10) NOT NULL,        -- Hạng bằng lái (D, E, FC...)
    license_expiry_date DATE        NOT NULL,        -- Ngày hết hạn bằng lái (Dùng để validate điều độ)
    issue_date          DATE        NOT NULL         -- Ngày cấp bằng
);

-- Chi tiết thông tin Khách hàng (Thành viên thân thiết)
CREATE TABLE customer_detail
(
    user_id        BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    loyalty_points INTEGER DEFAULT 0, -- Điểm tích lũy
    address        TEXT               -- Địa chỉ thường trú
);

-- ======================================================================================
-- 4. ĐỘI XE & TUYẾN ĐƯỜNG & CHÍNH SÁCH GIÁ (FLEET & ROUTE & FARE POLICIES)
-- ======================================================================================

-- Danh mục Loại xe (Ví dụ: Limousine 34 chỗ, Giường nằm 40 chỗ)
CREATE TABLE bus_type
(
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(50)  UNIQUE,   -- Mã loại xe (Ví dụ: BT-34-LIMO)
    name        VARCHAR(100) NOT NULL, -- Tên loại xe
    total_seats INTEGER      NOT NULL, -- Tổng số ghế
    -- [CONSTRAINT] Sơ đồ ghế phải là một mảng JSON
    seat_map    JSONB        NOT NULL CHECK (jsonb_typeof(seat_map) = 'array'),
    deleted_at  TIMESTAMP,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version     BIGINT    DEFAULT 0
);

-- Danh sách Xe (Phương tiện)
CREATE TABLE bus
(
    id                       BIGSERIAL PRIMARY KEY,
    license_plate            VARCHAR(20) NOT NULL UNIQUE,      -- Biển số xe
    bus_type_id              BIGINT     NOT NULL REFERENCES bus_type (id), -- Thuộc loại xe nào
    transport_badge_number   VARCHAR(50),                      -- Số phù hiệu vận tải
    badge_expiry_date        DATE,                             -- Hạn phù hiệu
    gps_device_id            VARCHAR(50),                      -- ID thiết bị giám sát hành trình
    vin_number               VARCHAR(50) UNIQUE,               -- Số khung
    engine_number            VARCHAR(50) UNIQUE,               -- Số máy
    manufacturing_year       INTEGER,                          -- Năm sản xuất
    current_odometer         DECIMAL(10, 2),                   -- Số ODO hiện tại
    insurance_expiry_date    DATE NOT NULL,                    -- Hạn bảo hiểm (bắt buộc)
    registration_expiry_date DATE NOT NULL,                    -- Hạn đăng kiểm (bắt buộc - logic chặn điều độ)
    last_assigned_at         TIMESTAMP,                        -- Lần cuối được gán chuyến (fair rotation dispatch)
    next_maintenance_due_at  DATE,                             -- Ngày bảo dưỡng tiếp theo (hard block nếu quá hạn)
    status                   VARCHAR(20) DEFAULT 'ACTIVE',     -- Trạng thái xe
    deleted_at               TIMESTAMP,
    created_at               TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    version                  BIGINT      DEFAULT 0
);

-- Chính sách Giá cước & Quy tắc nghiệp vụ (Fare Policies)
CREATE TABLE fare_policies
(
    id                  BIGSERIAL PRIMARY KEY,
    code                VARCHAR(50)  NOT NULL UNIQUE, -- Mã chính sách
    name                VARCHAR(100) NOT NULL,        -- Tên chính sách
    description         TEXT,
    legal_reference_doc VARCHAR(255),                 -- Văn bản pháp lý căn cứ (Nghị định/Thông tư)
    type                VARCHAR(20)  NOT NULL,        -- Loại chính sách (Java Enum PolicyType)
    scope               VARCHAR(20)           DEFAULT 'GLOBAL',     -- Phạm vi áp dụng (Toàn quốc, Tỉnh...)
    category            VARCHAR(20)           DEFAULT 'HOUSE_RULE', -- Danh mục (Quy định nhà xe, Quy định nhà nước...)

    -- [CONSTRAINT] Điều kiện & Hành động phải là đối tượng JSON
    conditions          JSONB        NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(conditions) = 'object'), -- Điều kiện áp dụng
    action              JSONB        NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(action) = 'object'),     -- Hành động (Giảm giá, Phụ thu...)

    priority            INTEGER               DEFAULT 0,    -- Độ ưu tiên (cao áp dụng trước)
    max_usage           INTEGER               DEFAULT NULL, -- Số lần áp dụng tối đa
    start_time          TIMESTAMP,                          -- Thời gian bắt đầu hiệu lực
    end_time            TIMESTAMP,                          -- Thời gian kết thúc hiệu lực
    is_active           BOOLEAN               DEFAULT TRUE, -- Kích hoạt?
    created_at          TIMESTAMP             DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP             DEFAULT CURRENT_TIMESTAMP,
    created_by          BIGINT REFERENCES users (id),       -- Người tạo
    updated_by          BIGINT REFERENCES users (id),       -- Người sửa
    deleted_by          BIGINT REFERENCES users (id),       -- Người xóa
    deleted_at          TIMESTAMP,
    version             BIGINT                DEFAULT 0
);

-- Tuyến đường (Route) - Cố định Điểm đi/Điểm đến
CREATE TABLE route
(
    id                       BIGSERIAL PRIMARY KEY,
    code                     VARCHAR(50) UNIQUE,                -- Mã tuyến
    name                     VARCHAR(255),                      -- Tên tuyến (VD: Sài Gòn - Đà Lạt)
    departure_station_id     BIGINT REFERENCES bus_station (id), -- Bến đi
    arrival_station_id       BIGINT REFERENCES bus_station (id), -- Bến đến
    distance                 DECIMAL(10, 2),                    -- Khoảng cách (km)
    duration_hours           DECIMAL(4, 1),                     -- Thời gian chạy dự kiến (giờ)
    itinerary_detail         TEXT,                              -- Lộ trình chi tiết
    hotline                  VARCHAR(20) DEFAULT '1900xxxx',    -- Hotline của tuyến
    default_refund_policy_id BIGINT REFERENCES fare_policies (id), -- Chính sách hoàn hủy mặc định
    status                   VARCHAR(20) DEFAULT 'DRAFT',       -- Trạng thái tuyến
    deleted_at               TIMESTAMP,
    created_at               TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    version                  BIGINT      DEFAULT 0
);

-- Cấu hình giá vé (Fare Config) - Giá vé theo Tuyến & Loại xe
CREATE TABLE fare_config
(
    id                   BIGSERIAL PRIMARY KEY,
    route_id             BIGINT REFERENCES route (id),       -- Áp dụng cho tuyến nào
    bus_type_id          BIGINT REFERENCES bus_type (id),    -- Áp dụng cho loại xe nào
    price                DECIMAL(15, 2) NOT NULL,            -- Giá vé cơ bản
    effective_from       DATE           NOT NULL,            -- Hiệu lực từ ngày
    effective_to         DATE,                               -- Hiệu lực đến ngày
    is_holiday_surcharge BOOLEAN     DEFAULT FALSE,          -- Có phải giá ngày lễ không
    approved_by          BIGINT REFERENCES users (id),       -- Người duyệt giá
    status               VARCHAR(20) DEFAULT 'DRAFT',        -- Trạng thái
    deleted_at           TIMESTAMP,
    created_at           TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    version              BIGINT      DEFAULT 0
);

-- Điểm đón/trả khách dọc đường (Pickup Points) - Phụ thuộc vào Route
CREATE TABLE pickup_point
(
    id                               BIGSERIAL PRIMARY KEY,
    code                             VARCHAR(50) UNIQUE,               -- Mã điểm đón (Ví dụ: PP-7967-01)
    route_id                         BIGINT      NOT NULL REFERENCES route (id) ON DELETE CASCADE,
    name                             VARCHAR(255) NOT NULL,            -- Tên điểm đón
    address                          TEXT,                            -- Địa chỉ cụ thể
    latitude                         DECIMAL(10, 8),                   -- Tọa độ GPS
    longitude                        DECIMAL(11, 8),                   -- Kinh độ GPS
    sequence_order                   INT         NOT NULL,            -- Thứ tự trên lộ trình (1, 2, 3...)
    estimated_minutes_from_departure INT         NOT NULL,            -- Thời gian ước tính từ bến xuất phát (phút)
    status                           VARCHAR(20) DEFAULT 'ACTIVE',
    deleted_at                       TIMESTAMP,                    -- Xóa mềm (NULL = chưa xóa)
    created_at                       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at                       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    version                          BIGINT      DEFAULT 0
);

-- Partial unique index: chỉ check unique trên bản ghi CHƯA bị xóa mềm
-- Cho phép tạo lại cùng sequence_order sau khi xóa mềm bản ghi cũ
CREATE UNIQUE INDEX uq_pickup_point_route_seq ON pickup_point(route_id, sequence_order) WHERE deleted_at IS NULL;

CREATE INDEX idx_pickup_point_route ON pickup_point(route_id);
CREATE INDEX idx_pickup_point_status ON pickup_point(status);

COMMENT ON TABLE pickup_point IS 'Điểm đón/trả khách dọc đường, phụ thuộc vào từng Route cụ thể';
COMMENT ON COLUMN pickup_point.sequence_order IS 'Thứ tự điểm dừng trên lộ trình (1, 2, 3...)';
COMMENT ON COLUMN pickup_point.estimated_minutes_from_departure IS 'Thời gian ước tính từ bến xuất phát (phút)';

-- Trigger tự động cập nhật updated_at cho pickup_point
CREATE TRIGGER trg_pickup_point_update
    BEFORE UPDATE ON pickup_point
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ======================================================================================
-- 5. VẬN HÀNH & ĐIỀU ĐỘ (ASSET & OPERATION)
-- ======================================================================================
-- (ticket_office đã được di chuyển lên Section 3 để staff_detail có thể tham chiếu)

-- Danh mục Ca làm việc (Work Shift)
CREATE TABLE work_shift
(
    id         BIGSERIAL PRIMARY KEY,
    code       VARCHAR(30) NOT NULL UNIQUE, -- Mã ca (SHIFT_MORNING, SHIFT_NIGHT) - Hỗ trợ tính lương
    name       VARCHAR(50) NOT NULL,        -- Tên ca (Ca Sáng, Ca Đêm)
    start_time TIME        NOT NULL,        -- Giờ bắt đầu
    end_time   TIME        NOT NULL,        -- Giờ kết thúc
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phân công & Điểm danh nhân viên (Rostering)
CREATE TABLE shift_assignment
(
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users (id),           -- Nhân viên được phân công
    office_id    BIGINT NOT NULL REFERENCES ticket_office (id),   -- Làm việc tại đâu
    shift_id     BIGINT NOT NULL REFERENCES work_shift (id),      -- Làm ca nào
    work_date    DATE        NOT NULL,                            -- Ngày làm việc
    status       VARCHAR(20) DEFAULT 'ASSIGNED',                  -- Trạng thái (ASSIGNED, CHECKED_IN...)
    check_in_at  TIMESTAMP,                                       -- Thời gian check-in thực tế
    check_out_at TIMESTAMP,                                       -- Thời gian check-out thực tế
    note         TEXT,                                            -- Ghi chú (đi muộn, về sớm)
    created_at   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- [MOVED] VehicleHandover moved after Trip table due to FK dependency
-- (See below)
-- Lịch chạy mẫu (Trip Schedule) - Template để sinh các chuyến xe hàng ngày
CREATE TABLE trip_schedule
(
    id                    BIGSERIAL PRIMARY KEY,
    code                  VARCHAR(50) UNIQUE,            -- Mã lịch chạy (Ví dụ: SCH-7967-1530)
    route_id              BIGINT REFERENCES route (id),  -- Thuộc tuyến nào
    departure_time        TIME NOT NULL,                 -- Giờ xuất bến cố định
    slot_decision_number  VARCHAR(100),                  -- Số văn bản nốt tài (Slot)
    operation_days_bitmap SMALLINT    DEFAULT 127,       -- Bitmap ngày hoạt động (2,3,4,5,6,7,CN)
    effective_from        DATE NOT NULL,                 -- Hiệu lực từ
    effective_to          DATE,                          -- Hiệu lực đến
    status                VARCHAR(20) DEFAULT 'ACTIVE',
    deleted_at            TIMESTAMP,
    created_at            TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    version               BIGINT      DEFAULT 0,
    -- [CONSTRAINT] Một tuyến không thể có 2 lịch chạy trùng giờ trong cùng khoảng thời gian
    UNIQUE (route_id, departure_time, effective_from)
);

-- ======================================================================================
-- ĐĂNG KÝ KHAI THÁC TUYẾN (Route Bus Registration)
-- Theo NĐ 10/2020, NĐ 158/2024: xe phải có phù hiệu tuyến cố định.
-- Lưu lịch sử: không xóa bản ghi, thu hồi → status REVOKED.
-- ======================================================================================
CREATE TABLE route_bus_registration
(
    id             BIGSERIAL PRIMARY KEY,
    route_id       BIGINT      NOT NULL REFERENCES route (id),
    bus_id         BIGINT      NOT NULL REFERENCES bus (id),
    badge_number   VARCHAR(50),                                     -- Số phù hiệu tuyến
    registered_at  DATE        NOT NULL DEFAULT CURRENT_DATE,       -- Ngày đăng ký
    expired_at     DATE,                                            -- Ngày hết hạn phù hiệu
    revoked_at     DATE,                                            -- Ngày thu hồi
    revoke_reason  TEXT,                                            -- Lý do thu hồi
    status         VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',           -- ACTIVE / EXPIRED / REVOKED
    created_at     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    version        BIGINT      DEFAULT 0
);

-- Partial unique: 1 xe chỉ có 1 đăng ký ACTIVE per tuyến
CREATE UNIQUE INDEX uq_route_bus_active ON route_bus_registration(route_id, bus_id) WHERE status = 'ACTIVE';

COMMENT ON TABLE route_bus_registration IS 'Đăng ký khai thác tuyến — pool xe có phù hiệu tuyến cố định';

-- ======================================================================================
-- LOẠI XE CHO LỊCH CHẠY (Schedule Bus Type)
-- Many-to-many TripSchedule ↔ BusType, lưu lịch sử thay đổi.
-- ======================================================================================
CREATE TABLE schedule_bus_type
(
    id               BIGSERIAL PRIMARY KEY,
    trip_schedule_id BIGINT NOT NULL REFERENCES trip_schedule (id),
    bus_type_id      BIGINT NOT NULL REFERENCES bus_type (id),
    effective_from   DATE        NOT NULL DEFAULT CURRENT_DATE,     -- Hiệu lực từ
    effective_to     DATE,                                          -- NULL = đang hiệu lực
    status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',         -- ACTIVE, ENDED
    reason           TEXT,                                          -- Lý do cho trạng thái hiện tại
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version          BIGINT    DEFAULT 0
);

-- Partial unique: 1 loại xe chỉ có 1 bản ghi ACTIVE per schedule
CREATE UNIQUE INDEX uq_schedule_bustype_active ON schedule_bus_type(trip_schedule_id, bus_type_id) WHERE status = 'ACTIVE';

COMMENT ON TABLE schedule_bus_type IS 'Loại xe cho lịch chạy — nhiều loại xe, lưu lịch sử thay đổi';

-- ======================================================================================
-- BÃI ĐỖ XE (Master Data - Catalog)
-- Depot là nơi đỗ xe, bảo dưỡng, giao nhận xe.
-- KHÔNG gắn với bến xe (bus_station) hay tỉnh — là 2 thực thể độc lập theo Luật Đường bộ 2024.
-- ======================================================================================
CREATE TABLE depot
(
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,           -- Tên bãi (VD: Bãi xe Thủ Đức)
    address    TEXT,                             -- Địa chỉ
    capacity   INTEGER,                          -- Sức chứa (số xe)
    latitude   DECIMAL(10, 8),                   -- Tọa độ GPS
    longitude  DECIMAL(11, 8),                   -- Tọa độ GPS
    status     VARCHAR(20) DEFAULT 'ACTIVE',     -- ACTIVE / INACTIVE
    deleted_at TIMESTAMP,                        -- Thời gian xóa mềm
    created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    version    BIGINT      DEFAULT 0
);

COMMENT ON TABLE depot IS 'Bãi đỗ xe (Depot) — Master data catalog, độc lập với bến xe';

-- ======================================================================================
-- CA XE (Bus Assignment)
-- Theo dõi vòng đời xe trong 1 ca: xuất bãi → chạy N chuyến → nhập bãi.
-- Xử lý: ODO, fuel, depot xuất/nhập.
-- ======================================================================================
CREATE TABLE bus_assignment
(
    id                 BIGSERIAL PRIMARY KEY,
    bus_id             BIGINT    NOT NULL REFERENCES bus (id),     -- Xe nào
    start_depot_id     BIGINT REFERENCES depot (id),               -- Bãi xuất (NULL nếu nhận giữa đường)
    end_depot_id       BIGINT REFERENCES depot (id),               -- Bãi nhập (NULL nếu rời giữa đường)
    scheduled_start    TIMESTAMP NOT NULL,                         -- Giờ dự kiến xuất bãi
    scheduled_end      TIMESTAMP,                                  -- Giờ dự kiến nhập bãi
    check_in_time      TIMESTAMP,                                  -- Thực tế xuất bãi
    check_in_odometer  DECIMAL(10, 2),                             -- ODO lúc xuất
    check_in_fuel      INTEGER,                                    -- Fuel lúc xuất (0-100%)
    check_in_notes     TEXT,                                       -- Ghi chú lúc xuất
    check_in_by        BIGINT REFERENCES users (id),               -- Quản bãi xác nhận xuất
    check_out_time     TIMESTAMP,                                  -- Thực tế nhập bãi
    check_out_odometer DECIMAL(10, 2),                             -- ODO lúc nhập
    check_out_fuel     INTEGER,                                    -- Fuel lúc nhập (0-100%)
    check_out_notes    TEXT,                                       -- Ghi chú lúc nhập
    check_out_by       BIGINT REFERENCES users (id),               -- Quản bãi xác nhận nhập
    status             VARCHAR(20) DEFAULT 'PENDING',              -- PENDING → CHECKED_IN → DEPARTED → COMPLETED | CANCELLED
    notes              TEXT,
    created_at         TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    version            BIGINT      DEFAULT 0,
    -- [CONSTRAINT] Fuel 0-100%
    CHECK (check_in_fuel IS NULL OR (check_in_fuel BETWEEN 0 AND 100)),
    CHECK (check_out_fuel IS NULL OR (check_out_fuel BETWEEN 0 AND 100)),
    -- [CONSTRAINT] Nhập bãi phải sau xuất bãi
    CHECK (check_out_time IS NULL OR check_out_time >= check_in_time)
);

COMMENT ON TABLE bus_assignment IS 'Ca xe — theo dõi xe từ xuất bãi đến nhập bãi';

-- Chuyến xe thực tế (Trip) - Được sinh ra từ Trip Schedule
CREATE TABLE trip
(
    id                              BIGSERIAL PRIMARY KEY,
    code                            VARCHAR(50) UNIQUE,                   -- Mã public của chuyến (dùng hiển thị/tra cứu thay cho ID)
    trip_schedule_id                BIGINT REFERENCES trip_schedule (id), -- Sinh ra từ lịch mẫu nào
    bus_id                          BIGINT REFERENCES bus (id),           -- Xe thực hiện chuyến
    -- [REMOVED Phase 2] main_driver_id → Tài xế giờ quản lý qua driver_assignment
    departure_date                  DATE NOT NULL,                        -- Ngày khởi hành
    actual_departure_time           TIME,                                 -- Giờ khởi hành thực tế
    arrival_time                    TIMESTAMP,                            -- Giờ đến bến thực tế
    trip_type                       VARCHAR(20) DEFAULT 'MAIN',           -- Loại chuyến (Chuyến chính, Tăng cường)
    electronic_transport_order_code VARCHAR(100) UNIQUE,                  -- Mã lệnh vận chuyển điện tử (nghiệp vụ pháp lý)
    qr_code_data                    TEXT,                                 -- Dữ liệu QR Code lệnh vận chuyển
    odometer_start                  DECIMAL(10, 1),                       -- Số ODO lúc đi
    odometer_end                    DECIMAL(10, 1),                       -- Số ODO lúc đến
    status                          VARCHAR(20) DEFAULT 'SCHEDULED',      -- Trạng thái (SCHEDULED, RUNNING, COMPLETED...)
    cancel_reason                   TEXT,                                 -- Lý do hủy chuyến
    dispatch_note                   TEXT,                                 -- Ghi chú dispatch: lý do gán xe, score
    bus_assignment_id               BIGINT REFERENCES bus_assignment (id),-- Ca xe thực hiện chuyến này (NOT NULL khi status >= APPROVED)
    deleted_at                      TIMESTAMP,
    created_at                      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at                      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    version                         BIGINT      DEFAULT 0,
    -- [CONSTRAINT] Một xe không thể chạy 2 chuyến cùng lúc (Logic Trigger sẽ check kỹ hơn)
    UNIQUE (bus_id, departure_date, actual_departure_time)
);

COMMENT ON COLUMN trip.bus_assignment_id IS 'Ca xe thực hiện chuyến này (NOT NULL khi status >= APPROVED)';

-- ======================================================================================
-- PHÂN CÔNG TÀI XẾ (Driver Assignment)
-- [Phase 3] Nối trực tiếp với Trip thay vì BusAssignment.
-- Mỗi record = 1 tài xế phục vụ 1 chuyến, với role cụ thể.
-- ======================================================================================
CREATE TABLE driver_assignment
(
    id                BIGSERIAL PRIMARY KEY,
    trip_id           BIGINT    NOT NULL REFERENCES trip (id),            -- Phục vụ chuyến nào
    driver_id         BIGINT    NOT NULL REFERENCES users (id),           -- Tài xế nào
    role              VARCHAR(30) DEFAULT 'MAIN_DRIVER',                 -- MAIN_DRIVER, CO_DRIVER, ATTENDANT
    seat_number       VARCHAR(10),                                       -- Ghế crew (dùng seat_number thay vì FK seat)
    actual_start_time TIMESTAMP,                                         -- Bắt đầu lái (NULL = chưa bắt đầu)
    actual_end_time   TIMESTAMP,                                         -- Kết thúc lái (NULL = đang lái)
    status            VARCHAR(20) DEFAULT 'PENDING',                     -- PENDING | ACTIVE | COMPLETED | ENDED_EARLY | CANCELLED
    notes             TEXT,
    created_at        TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    version           BIGINT      DEFAULT 0,
    UNIQUE(trip_id, driver_id, status)                                    -- 1 tài xế chỉ active 1 lần/chuyến
);

COMMENT ON TABLE driver_assignment IS 'Phân công tài xế — ai phục vụ chuyến nào, role, seat';




-- [MOVED HERE] Quản lý Bàn giao xe (Nhận xe/Trả xe giữa các tài xế)
CREATE TABLE vehicle_handover
(
    id                         BIGSERIAL PRIMARY KEY,
    bus_id                     BIGINT REFERENCES bus (id),      -- Xe được bàn giao
    driver_id                  BIGINT REFERENCES users (id),    -- Tài xế nhận xe
    trip_id                    BIGINT REFERENCES trip (id),     -- [NEW] Bàn giao gắn với chuyến nào
    handover_type              VARCHAR(20) DEFAULT 'RECEIVE',   -- Loại bàn giao (RECEIVE/RETURN)
    handover_time              TIMESTAMP NOT NULL,              -- Thời điểm nhận xe
    odometer                   DECIMAL(10, 2),                  -- Số km đồng hồ tại thời điểm bàn giao
    fuel_level                 INTEGER,                         -- Mức nhiên liệu (0-100%)
    scheduled_return_time      TIMESTAMP,                       -- Thời điểm dự kiến trả
    actual_return_time         TIMESTAMP,                       -- Thời điểm thực tế trả
    notes                      TEXT,                            -- Ghi chú tình trạng xe lúc nhận
    -- [AUTOMATION & AUDIT]
    status                     VARCHAR(20) DEFAULT 'PENDING_HANDOVER',
    status_reason              TEXT,
    is_emergency               BOOLEAN        DEFAULT FALSE,
    emergency_request_by       BIGINT,
    emergency_reviewed_by      BIGINT,
    emergency_reviewed_at      TIMESTAMP,
    violation_level            VARCHAR(20),     -- Mức độ vi phạm: WARNING, CRITICAL (Enum ViolationLevel)
    created_by                 BIGINT,
    -- asset_management_allowance REMOVED per Centralized Fleet Plan
    created_at                 TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at                 TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    version                    BIGINT         DEFAULT 0,
    -- [CONSTRAINT] Ngày trả thực tế phải sau ngày nhận
    CHECK (actual_return_time IS NULL OR actual_return_time >= handover_time),
    -- [CONSTRAINT] Mức nhiên liệu phải trong khoảng 0-100%
    CHECK (fuel_level IS NULL OR (fuel_level >= 0 AND fuel_level <= 100))
);

-- [NEW] Yêu cầu thay đổi chuyến xe (Pre-approval workflow)
CREATE TABLE trip_change_request
(
    id               BIGSERIAL PRIMARY KEY,
    trip_id          BIGINT REFERENCES trip (id),
    
    -- Thay đổi Tài xế
    old_driver_id    BIGINT REFERENCES users (id),
    new_driver_id    BIGINT REFERENCES users (id), -- Nullable nếu chỉ đổi xe
    
    -- [MERGED V6] Thay đổi Xe
    old_bus_id       BIGINT REFERENCES bus (id),   -- Nullable nếu chỉ đổi tài xế
    new_bus_id       BIGINT REFERENCES bus (id),   -- Nullable nếu chỉ đổi tài xế
    change_type      VARCHAR(20) NOT NULL DEFAULT 'REPLACE_DRIVER', -- REPLACE_DRIVER, REPLACE_CO_DRIVER, REPLACE_ATTENDANT, REPLACE_BUS, INCIDENT_SWAP
    urgency_zone     VARCHAR(20) DEFAULT 'STANDARD', -- STANDARD, URGENT, CRITICAL, DEPARTED, MID_ROUTE
    
    incident_type    VARCHAR(30),                  -- Loại sự cố: FATIGUE_SWAP, DRIVER_HEALTH, VEHICLE_BREAKDOWN, TRAFFIC_ACCIDENT
    incident_gps     VARCHAR(50),                  -- Tọa độ GPS lúc xảy ra sự cố
    
    request_reason   TEXT,
    status           VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ESCALATED, APPROVED, REJECTED, CANCELLED
    is_emergency     BOOLEAN DEFAULT FALSE,
    created_by       BIGINT REFERENCES users (id),
    approved_by      BIGINT REFERENCES users (id),
    rejected_reason  TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version          BIGINT    DEFAULT 0,
    CHECK (change_type IN ('REPLACE_DRIVER', 'REPLACE_CO_DRIVER', 'REPLACE_ATTENDANT', 'REPLACE_BUS', 'INCIDENT_SWAP')),
    CHECK (urgency_zone IN ('STANDARD', 'URGENT', 'CRITICAL', 'DEPARTED', 'MID_ROUTE')),
    CHECK (status IN ('PENDING', 'ESCALATED', 'APPROVED', 'REJECTED', 'CANCELLED')),
    CHECK (incident_type IS NULL OR incident_type IN ('FATIGUE_SWAP', 'DRIVER_HEALTH', 'VEHICLE_BREAKDOWN', 'TRAFFIC_ACCIDENT'))
);

-- Documentation Comments for trip_change_request
COMMENT ON COLUMN trip_change_request.change_type IS 'Loại thay đổi: REPLACE_DRIVER, REPLACE_CO_DRIVER, REPLACE_ATTENDANT, REPLACE_BUS, INCIDENT_SWAP';
COMMENT ON COLUMN trip_change_request.urgency_zone IS 'Vùng khẩn cấp: STANDARD, URGENT, CRITICAL, DEPARTED, MID_ROUTE';
COMMENT ON COLUMN trip_change_request.old_bus_id IS 'Xe cũ (nullable nếu chỉ đổi tài xế)';
COMMENT ON COLUMN trip_change_request.new_bus_id IS 'Xe mới (nullable nếu chỉ đổi tài xế)';
COMMENT ON COLUMN trip_change_request.incident_type IS 'Loại sự cố: FATIGUE_SWAP, DRIVER_HEALTH, VEHICLE_BREAKDOWN, TRAFFIC_ACCIDENT';
COMMENT ON COLUMN trip_change_request.incident_gps IS 'Tọa độ GPS lúc xảy ra sự cố';

-- [REMOVED Phase 3] Bảng trip_staff đã thay thế hoàn toàn bởi driver_assignment (nối trực tiếp Trip)
-- [QUAN TRỌNG] Bảng Nhật ký lái xe (Luật GTĐB: Max 4h liên tục, 10h/ngày)
CREATE TABLE driver_trip_log
(
    id                 BIGSERIAL PRIMARY KEY,
    trip_id            BIGINT REFERENCES trip (id),
    driver_id          BIGINT REFERENCES users (id),
    start_time         TIMESTAMP NOT NULL,           -- Thời gian bắt đầu cầm lái
    end_time           TIMESTAMP,                    -- Thời gian ngừng lái (đổi tài)
    duration_minutes   INTEGER,                      -- Tổng phút lái xe (Tự động tính)
    start_location_gps VARCHAR(100),                 -- Tọa độ lúc nhận xe
    end_location_gps   VARCHAR(100),
    is_night_driving   BOOLEAN DEFAULT FALSE         -- Lái đêm (22h-6h)
);

-- Truyền dữ liệu chính phủ (Cục đường bộ)
CREATE TABLE gov_data_transmission
(
    id               BIGSERIAL PRIMARY KEY,
    trip_id          BIGINT REFERENCES trip (id), -- Chuyến xe được truyền
    status           VARCHAR(20),                 -- Trạng thái truyền (SUCCESS, FAILED)
    response_message TEXT,                        -- Phản hồi từ server Chính phủ
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version          BIGINT    DEFAULT 0
);

-- ======================================================================================
-- 6. BÁN VÉ (SALES & BOOKING)
-- ======================================================================================

-- Đơn hàng đặt vé (Booking)
CREATE TABLE booking
(
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users (id),    -- Người đặt (nếu có tài khoản)
    guest_name      VARCHAR(100),                    -- Tên khách vãng lai
    guest_phone     VARCHAR(20),                     -- SĐT khách vãng lai
    guest_email     VARCHAR(100),                    -- Email khách vãng lai
    -- NULL = tự động xác nhận qua payment gateway (VNPay...)
    -- NOT NULL = nhân viên xác nhận thanh toán tại quầy (audit trail)
    confirmed_by_id BIGINT REFERENCES users (id),   -- Nhân viên xác nhận TT (chống đơn ảo)
    code            VARCHAR(50)    NOT NULL UNIQUE,  -- Mã đặt chỗ (PNR)
    total_amount    DECIMAL(15, 2) NOT NULL,         -- Tổng tiền
    channel         VARCHAR(20) DEFAULT 'WEB',       -- Kênh bán (COUNTER, WEB, APP, ON_BUS)
    payment_method  VARCHAR(50),                     -- Phương thức thanh toán
    status          VARCHAR(20) DEFAULT 'PENDING',   -- Trạng thái (PENDING, CONFIRMED, CANCELLED)
    expired_at      TIMESTAMP      NOT NULL,         -- Thời gian hết hạn giữ chỗ
    created_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    version         BIGINT      DEFAULT 0
);

-- Vé xe chi tiết (Ticket) - Mỗi ghế là 1 vé
CREATE TABLE ticket
(
    id             BIGSERIAL PRIMARY KEY,
    booking_id     BIGINT REFERENCES booking (id) ON DELETE CASCADE, -- Thuộc đơn hàng nào
    trip_id        BIGINT REFERENCES trip (id),                      -- Cho chuyến xe nào
    fare_config_id BIGINT REFERENCES fare_config (id),               -- Áp dụng cấu hình giá nào
    pickup_point_id BIGINT REFERENCES pickup_point (id),             -- Đón khách tại điểm nào (NULL = đón tại bến)
    dropoff_point_id BIGINT REFERENCES pickup_point (id),            -- Trả khách tại điểm nào (NULL = trả tại bến)
    seat_number    VARCHAR(10)    NOT NULL,                          -- Số ghế/giường
    price          DECIMAL(15, 2) NOT NULL,                          -- Giá bán thực tế
    vat_rate       DECIMAL(4, 2) DEFAULT 0.08,                       -- Thuế suất GTGT
    is_checked_in  BOOLEAN       DEFAULT FALSE,                      -- Đã lên xe chưa
    status         VARCHAR(20)   DEFAULT 'ACTIVE',                   -- Trạng thái vé
    created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    version        BIGINT        DEFAULT 0
);

-- Không dùng UNIQUE cứng, cho phép nhiều vé cho cùng 1 ghế nếu các vé cũ đã CANCELLED/EXPIRED
CREATE UNIQUE INDEX ticket_active_seat_idx ON ticket(trip_id, seat_number) WHERE status NOT IN ('CANCELLED', 'EXPIRED');

-- Lịch sử thanh toán
CREATE TABLE payment_history
(
    id               BIGSERIAL PRIMARY KEY,
    booking_id       BIGINT REFERENCES booking (id),
    amount           DECIMAL(15, 2), -- Số tiền thanh toán
    status           VARCHAR(20),    -- Trạng thái giao dịch
    transaction_code VARCHAR(100),   -- Mã giao dịch ngân hàng/Ví
    provider         VARCHAR(50),    -- Cổng thanh toán (VNPAY, MOMO...)
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Giao dịch Hoàn vé (Refund)
CREATE TABLE refund_transactions
(
    id                  BIGSERIAL PRIMARY KEY,
    booking_id          BIGINT REFERENCES booking (id),
    ticket_id           BIGINT REFERENCES ticket (id),      -- Vé được hoàn
    amount              DECIMAL(15, 2) NOT NULL,            -- Số tiền hoàn trả khách
    refund_rate         DECIMAL(3, 2)  NOT NULL,            -- Tỷ lệ hoàn (ví dụ 0.9 = 90%)
    refund_category     VARCHAR(50)    NOT NULL,            -- Lý do hoàn (Enum RefundCategory: Khách hủy, Nhà xe hủy...)

    -- [CONSTRAINT] Chi tiết giao dịch phải là JSON Object
    transaction_details JSONB CHECK (transaction_details IS NULL OR jsonb_typeof(transaction_details) = 'object'),

    refunded_by         BIGINT REFERENCES users (id),       -- Người thực hiện hoàn tiền
    status              VARCHAR(20) DEFAULT 'SUCCESS',      -- Trạng thái hoàn tiền
    created_at          TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Cấu hình hệ thống (SME Config) - Lưu các tham số động
CREATE TABLE system_configs
(
    id           BIGSERIAL PRIMARY KEY,
    config_key   VARCHAR(50)  NOT NULL UNIQUE, -- Tên cấu hình (Key)
    config_value VARCHAR(255) NOT NULL,        -- Giá trị (Value)
    description  TEXT,                         -- Mô tả ý nghĩa
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Insert Data Mẫu cho Cấu hình
INSERT INTO system_configs (config_key, config_value, description)
VALUES ('LOYALTY_POINT_EXCHANGE_RATE', '1000', 'Giá trị quy đổi: 1 điểm = 1000 VNĐ'),
       ('BOOKING_TIMEOUT_MINUTES', '10', 'Thời gian giữ ghế pending (phút)');

-- Bảng Audit Log (Lưu vết thay đổi dữ liệu quan trọng)
CREATE TABLE audit_logs
(
    id             BIGSERIAL PRIMARY KEY,
    table_name     VARCHAR(50)  NOT NULL,        -- Tên bảng bị thay đổi
    record_id      BIGINT       NOT NULL,        -- ID bản ghi bị thay đổi
    action         VARCHAR(20)  NOT NULL,        -- Hành động (INSERT, UPDATE, DELETE)
    changed_by     BIGINT REFERENCES users (id), -- Người thực hiện thay đổi
    old_values     JSONB,                        -- Giá trị cũ (JSON)
    new_values     JSONB,                        -- Giá trị mới (JSON)
    changed_fields TEXT[],                       -- Danh sách các trường bị thay đổi
    ip_address     VARCHAR(50),                  -- Địa chỉ IP (nếu có)
    user_agent     TEXT,                         -- Thông tin trình duyệt/app
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    
    -- Index để tìm kiếm nhanh
);

CREATE INDEX idx_audit_table_record ON audit_logs (table_name, record_id);
CREATE INDEX idx_audit_created ON audit_logs (created_at DESC);

-- Hàm trigger tự động ghi audit log cho các bảng quan trọng
CREATE OR REPLACE FUNCTION log_audit_trail() RETURNS TRIGGER AS $$
DECLARE
    changed_cols TEXT[];
    old_data JSONB;
    new_data JSONB;
    audit_action VARCHAR(20);  -- Biến để xác định loại action
BEGIN
    -- Bọc toàn bộ logic audit trong exception handler
    -- Đảm bảo lỗi audit log KHÔNG làm rollback transaction chính
    BEGIN
        -- Chỉ log khi có thay đổi thực sự (UPDATE)
        IF TG_OP = 'UPDATE' THEN
            old_data := to_jsonb(OLD);
            new_data := to_jsonb(NEW);
            
            -- Tìm các cột bị thay đổi
            SELECT ARRAY_AGG(key) INTO changed_cols
            FROM jsonb_each(old_data)
            WHERE old_data->key IS DISTINCT FROM new_data->key;
            
            -- Nếu không có gì thay đổi thì bỏ qua
            IF changed_cols IS NULL THEN
                RETURN NEW;
            END IF;
            
            -- Phát hiện Soft Delete: deleted_at từ NULL → NOT NULL
            IF 'deleted_at' = ANY(changed_cols) 
               AND (old_data->>'deleted_at') IS NULL 
               AND (new_data->>'deleted_at') IS NOT NULL THEN
                audit_action := 'SOFT_DELETE';
                
            -- Phát hiện Restore: deleted_at từ NOT NULL → NULL
            ELSIF 'deleted_at' = ANY(changed_cols) 
                  AND (old_data->>'deleted_at') IS NOT NULL 
                  AND (new_data->>'deleted_at') IS NULL THEN
                audit_action := 'RESTORE';
                
            -- UPDATE thông thường
            ELSE
                audit_action := 'UPDATE';
            END IF;
            
            INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_fields)
            VALUES (TG_TABLE_NAME, COALESCE(new_data->>'id', new_data->>'user_id', '0')::BIGINT, audit_action, old_data, new_data, changed_cols);
            
        ELSIF TG_OP = 'INSERT' THEN
            INSERT INTO audit_logs (table_name, record_id, action, new_values)
            VALUES (TG_TABLE_NAME, COALESCE(to_jsonb(NEW)->>'id', to_jsonb(NEW)->>'user_id', '0')::BIGINT, 'INSERT', to_jsonb(NEW));
            
        ELSIF TG_OP = 'DELETE' THEN
            -- Hard Delete (xóa vật lý khỏi DB)
            INSERT INTO audit_logs (table_name, record_id, action, old_values)
            VALUES (TG_TABLE_NAME, COALESCE(to_jsonb(OLD)->>'id', to_jsonb(OLD)->>'user_id', '0')::BIGINT, 'HARD_DELETE', to_jsonb(OLD));
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Log lỗi vào PostgreSQL log (không crash transaction)
            -- Có thể xem trong pg_log hoặc dùng: SELECT * FROM pg_stat_statements;
            RAISE WARNING 'Audit log failed for table=% id=% error=%', 
                TG_TABLE_NAME, 
                COALESCE((to_jsonb(NEW)->>'id')::BIGINT, (to_jsonb(NEW)->>'user_id')::BIGINT, (to_jsonb(OLD)->>'id')::BIGINT, (to_jsonb(OLD)->>'user_id')::BIGINT, 0), 
                SQLERRM;
            -- Transaction chính vẫn tiếp tục bình thường
    END;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Áp dụng audit log cho các bảng tài chính & vận hành quan trọng
CREATE TRIGGER audit_fare_config AFTER INSERT OR UPDATE OR DELETE ON fare_config 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_booking AFTER INSERT OR UPDATE OR DELETE ON booking 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_trip AFTER UPDATE ON trip 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_refund AFTER INSERT ON refund_transactions 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Audit cho Master Data (Danh mục)
CREATE TRIGGER audit_province AFTER INSERT OR UPDATE OR DELETE ON province 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_bus_station AFTER INSERT OR UPDATE OR DELETE ON bus_station 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_ticket_office AFTER INSERT OR UPDATE OR DELETE ON ticket_office 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_departments AFTER INSERT OR UPDATE OR DELETE ON departments 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Audit cho Fleet Management
CREATE TRIGGER audit_bus_type AFTER INSERT OR UPDATE OR DELETE ON bus_type 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_bus AFTER INSERT OR UPDATE OR DELETE ON bus 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Audit cho Route & Planning
CREATE TRIGGER audit_route AFTER INSERT OR UPDATE OR DELETE ON route 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_trip_schedule AFTER INSERT OR UPDATE OR DELETE ON trip_schedule 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_fare_policies AFTER INSERT OR UPDATE OR DELETE ON fare_policies 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Audit cho Users & Auth
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_admin_detail AFTER INSERT OR UPDATE OR DELETE ON admin_detail 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_staff_detail AFTER INSERT OR UPDATE OR DELETE ON staff_detail 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_driver_detail AFTER INSERT OR UPDATE OR DELETE ON driver_detail 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_customer_detail AFTER INSERT OR UPDATE OR DELETE ON customer_detail 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Audit cho Operation
CREATE TRIGGER audit_vehicle_handover AFTER INSERT OR UPDATE OR DELETE ON vehicle_handover 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_shift_assignment AFTER INSERT OR UPDATE OR DELETE ON shift_assignment 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- [REMOVED Phase 3] audit_trip_staff: bảng trip_staff đã xóa

-- Audit cho Sales (Ticket đã có trigger riêng để check seat availability)
CREATE TRIGGER audit_ticket AFTER INSERT OR UPDATE OR DELETE ON ticket 
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- ======================================================================================
-- 7. INDEXES (TỐI ƯU HIỆU NĂNG TRUY VẤN)
-- ======================================================================================

-- Đảm bảo không bán trùng ghế (Chỉ check các vé đang ACTIVE)
CREATE UNIQUE INDEX uq_ticket_seat_trip_active ON ticket (trip_id, seat_number) WHERE status = 'ACTIVE';

-- Tối ưu tìm kiếm Chính sách giá theo điều kiện JSON
CREATE INDEX idx_fare_policies_conditions ON fare_policies USING GIN (conditions);

-- Tối ưu lọc Chính sách giá đang hiệu lực
CREATE INDEX idx_fare_policies_lookup ON fare_policies (type, is_active);

-- Đảm bảo một xe/tài xế chỉ có tối đa 1 phiếu bàn giao chưa trả (Active Handover)
CREATE UNIQUE INDEX uq_bus_active_handover ON vehicle_handover (bus_id) WHERE actual_return_time IS NULL;
CREATE UNIQUE INDEX uq_driver_active_handover ON vehicle_handover (driver_id) WHERE actual_return_time IS NULL;

-- Tối ưu tìm kiếm lịch sử bàn giao xe để check trùng
CREATE INDEX idx_vehicle_handover_overlap ON vehicle_handover (bus_id, handover_time, actual_return_time);

-- Đảm bảo tên loại xe là duy nhất (trừ bản ghi đã xóa mềm)
CREATE UNIQUE INDEX uq_bus_type_name ON bus_type (name) WHERE deleted_at IS NULL;

-- Tối ưu lọc xe theo trạng thái
CREATE INDEX idx_bus_status ON bus (status) WHERE deleted_at IS NULL;

-- Đảm bảo không có 2 cấu hình giá trùng nhau cho cùng 1 tuyến & loại xe & ngày áp dụng
CREATE UNIQUE INDEX uq_fare_unique_active ON fare_config (route_id, bus_type_id, effective_from) WHERE status = 'ACTIVE' AND deleted_at IS NULL;

-- Tối ưu tìm ghế trống (Vé chưa check-in và đang Active)
CREATE INDEX idx_ticket_trip_seat_active ON ticket (trip_id, seat_number) WHERE is_checked_in = FALSE AND status = 'ACTIVE';

-- Tối ưu tìm cấu hình giá đang Active
CREATE INDEX idx_fare_active ON fare_config (route_id, bus_type_id, effective_from) WHERE status = 'ACTIVE' AND deleted_at IS NULL;

-- Tối ưu tìm chuyến xe đang mở bán
CREATE INDEX idx_trip_sell ON trip (trip_schedule_id, departure_date) WHERE status = 'SCHEDULED' AND deleted_at IS NULL;

-- Helper Index cho thuật toán check trùng lịch xe & tài xế
CREATE INDEX idx_trip_overlap ON trip (bus_id, departure_date, actual_departure_time);
-- [Phase 3] Index tối ưu tìm chuyến theo tài xế
CREATE INDEX idx_driver_assignment_trip ON driver_assignment (trip_id, driver_id, status);

-- Tối ưu job quét Booking hết hạn (Expired)
CREATE INDEX idx_booking_pending ON booking (status, expired_at) WHERE status = 'PENDING';

-- Tối ưu tìm thiết bị theo Token để gửi Push
CREATE INDEX idx_user_devices_token ON user_devices (fcm_token);

-- Tối ưu xác thực Refresh Token
CREATE INDEX idx_refresh_token_lookup ON refresh_tokens (token) WHERE revoked = FALSE;

-- Tối ưu thống kê hoàn vé
CREATE INDEX idx_refund_stats ON refund_transactions (refund_category, created_at);

-- Đảm bảo mỗi lịch chạy chỉ sinh ra 1 chuyến xe Loại MAIN trong ngày
CREATE UNIQUE INDEX uq_trip_schedule_main_unique ON trip (trip_schedule_id, departure_date) WHERE deleted_at IS NULL AND trip_type = 'MAIN';

-- Tối ưu tra cứu phân ca làm việc
CREATE INDEX idx_shift_assignment_lookup ON shift_assignment (office_id, work_date);

-- Đảm bảo một nhân viên không làm trùng 2 ca trong 1 ngày (hoặc trùng ca tại 2 nơi)
CREATE UNIQUE INDEX uq_user_shift_date ON shift_assignment (user_id, work_date, shift_id);

-- ======================================================================================
-- 8. TRIGGERS (LOGIC BẢO VỆ DỮ LIỆU)
-- ======================================================================================

-- AUTO TIMESTAMP: Tự động cập nhật cột updated_at = NOW() trước khi UPDATE bản ghi
CREATE TRIGGER update_timestamp_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_timestamp_user_devices BEFORE UPDATE ON user_devices FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_timestamp_refresh_tokens BEFORE UPDATE ON refresh_tokens FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_timestamp_bus_type BEFORE UPDATE ON bus_type FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_timestamp_bus BEFORE UPDATE ON bus FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_timestamp_route BEFORE UPDATE ON route FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_timestamp_fare_policies BEFORE UPDATE ON fare_policies FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_timestamp_fare BEFORE UPDATE ON fare_config FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_timestamp_handover BEFORE UPDATE ON vehicle_handover FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_timestamp_trip_sched BEFORE UPDATE ON trip_schedule FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_timestamp_trip BEFORE UPDATE ON trip FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_timestamp_booking BEFORE UPDATE ON booking FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_timestamp_ticket BEFORE UPDATE ON ticket FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_timestamp_change_request BEFORE UPDATE ON trip_change_request FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- [LOGIC] Tự động hủy Vé khi Chuyến xe bị Hủy (Status -> CANCELLED)
CREATE OR REPLACE FUNCTION auto_cancel_tickets_on_trip_cancel() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'CANCELLED' AND OLD.status <> 'CANCELLED' THEN
        -- Cập nhật tất cả vé ACTIVE của chuyến này thành CANCELLED
        UPDATE ticket SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
        WHERE trip_id = NEW.id AND status = 'ACTIVE';
    END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_auto_cancel_tickets AFTER UPDATE ON trip FOR EACH ROW EXECUTE FUNCTION auto_cancel_tickets_on_trip_cancel();

-- [LOGIC] Kiểm tra Ghế trống trước khi tạo Vé (Tránh Overselling - Bán quá số ghế)
-- Logic: Nếu ghế X đang có vé ACTIVE thuộc Booking PENDING (còn hạn giữ chỗ) thì báo lỗi.
CREATE OR REPLACE FUNCTION check_seat_availability() RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM ticket t JOIN booking b ON t.booking_id = b.id
        WHERE t.trip_id = NEW.trip_id AND t.seat_number = NEW.seat_number AND t.id <> NEW.id
          AND t.status = 'ACTIVE' AND b.status = 'PENDING' AND b.expired_at > CURRENT_TIMESTAMP
    ) THEN
        RAISE EXCEPTION 'Ghế % đang được giữ chỗ bởi người khác.', NEW.seat_number;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_check_seat_availability BEFORE INSERT ON ticket FOR EACH ROW EXECUTE FUNCTION check_seat_availability();

-- [LOGIC] Ngăn chặn tạo Cấu hình giá bị trùng khoảng thời gian (Overlap) trên cùng 1 tuyến + loại xe
CREATE OR REPLACE FUNCTION check_fare_overlap() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.deleted_at IS NOT NULL OR NEW.status <> 'ACTIVE' THEN RETURN NEW; END IF;
    IF EXISTS (SELECT 1 FROM fare_config WHERE route_id = NEW.route_id AND bus_type_id = NEW.bus_type_id AND id <> NEW.id AND deleted_at IS NULL AND status = 'ACTIVE' AND ((effective_to IS NULL OR effective_to >= NEW.effective_from) AND (NEW.effective_to IS NULL OR effective_from <= NEW.effective_to))) THEN RAISE EXCEPTION 'Giá vé bị trùng lặp thời gian.'; END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_check_fare_overlap BEFORE INSERT OR UPDATE ON fare_config FOR EACH ROW EXECUTE FUNCTION check_fare_overlap();

-- [LOGIC CORE] Kiểm tra trùng lịch XE và TÀI XẾ (Overlap Check) cho chuyến xe
-- 1. Xe/Tài xế phải ACTIVE.
-- 2. Tính thời gian kết thúc chuyến dự kiến (= Xuất bến + Thời gian chạy).
-- 3. Quét DB xem có chuyến nào khác chồng lấn khoảng thời gian này không.
CREATE OR REPLACE FUNCTION check_trip_logic() RETURNS TRIGGER AS $$
DECLARE new_end TIMESTAMP; estimated_duration INTERVAL;
BEGIN
    IF NEW.bus_id IS NOT NULL AND (SELECT status FROM bus WHERE id = NEW.bus_id) <> 'ACTIVE' THEN RAISE EXCEPTION 'Xe không khả dụng.'; END IF;
    -- [REMOVED Phase 2] check main_driver_id: Tài xế giờ validate qua driver_assignment
SELECT (r.duration_hours * INTERVAL '1 hour') INTO estimated_duration FROM trip_schedule ts JOIN route r ON ts.route_id = r.id WHERE ts.id = NEW.trip_schedule_id;
IF estimated_duration IS NULL THEN estimated_duration := INTERVAL '4 hours'; END IF;
    new_end := COALESCE(NEW.arrival_time, (NEW.departure_date + NEW.actual_departure_time) + estimated_duration);
    
    -- Chặn kẹt Biển Số Xe (Kể cả Đang chạy hay Đang lên lịch)
    IF NEW.bus_id IS NOT NULL AND EXISTS (SELECT 1 FROM trip WHERE bus_id = NEW.bus_id AND id <> NEW.id AND deleted_at IS NULL AND status IN ('SCHEDULED', 'RUNNING') AND ((departure_date + actual_departure_time) < new_end AND COALESCE(arrival_time, (departure_date + actual_departure_time) + estimated_duration) > (NEW.departure_date + NEW.actual_departure_time))) THEN RAISE EXCEPTION 'Xe trùng lịch.'; END IF;
    
    -- Chặn kẹt Tài Xế (Mới Phục Hồi: Sửa lỗi 1 Bác Tài lái 2 tuyến cùng lúc)
    -- LÚC NÃY BẬT SAI!! Bảng Trip không còn driver_id. (Trùng tài xế phải Check bằng bảng driver_assignment + overlap trip_id)
    -- IF NEW.driver_id IS NOT NULL AND EXISTS (SELECT 1 FROM trip WHERE driver_id = NEW.driver_id AND id <> NEW.id AND deleted_at IS NULL AND status IN ('SCHEDULED', 'RUNNING') AND ((departure_date + actual_departure_time) < new_end AND COALESCE(arrival_time, (departure_date + actual_departure_time) + estimated_duration) > (NEW.departure_date + NEW.actual_departure_time))) THEN RAISE EXCEPTION 'Tài xế đang kẹt lịch chạy chuyến khác.'; END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_check_trip_overlap BEFORE INSERT OR UPDATE ON trip FOR EACH ROW EXECUTE FUNCTION check_trip_logic();

-- [REMOVED Phase 3] check_trip_staff_logic + trg_check_trip_staff: bảng trip_staff đã xóa
-- Kiểm tra trùng lịch tài xế giờ thực hiện ở driver_assignment level (qua trip overlap)

-- [LOGIC] Kiểm tra giãn cách chuyến (Tần suất)
-- Không cho phép tạo 2 lịch chạy (Trip Schedule) cách nhau dưới 30 phút trên cùng 1 tuyến.
CREATE OR REPLACE FUNCTION check_schedule_overlap() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.deleted_at IS NOT NULL OR NEW.status <> 'ACTIVE' THEN RETURN NEW; END IF;
    IF EXISTS (SELECT 1 FROM trip_schedule WHERE route_id = NEW.route_id AND id <> NEW.id AND deleted_at IS NULL AND status = 'ACTIVE' AND ((effective_to IS NULL OR effective_to >= NEW.effective_from) AND (NEW.effective_to IS NULL OR effective_from <= NEW.effective_to)) AND departure_time >= (NEW.departure_time - INTERVAL '30 minutes') AND departure_time <= (NEW.departure_time + INTERVAL '30 minutes')) THEN RAISE EXCEPTION 'Vi phạm khoảng giãn cách 30 phút.'; END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_check_schedule_overlap BEFORE INSERT OR UPDATE ON trip_schedule FOR EACH ROW EXECUTE FUNCTION check_schedule_overlap();

-- [LOGIC] Kiểm tra trùng lịch Bàn giao xe (Handover Overlap)
-- Xe hoặc Tài xế không thể nằm trong 2 biên bản bàn giao có thời gian chồng lấn nhau.
CREATE OR REPLACE FUNCTION check_handover_overlap() RETURNS TRIGGER AS $$
DECLARE infinity_timestamp TIMESTAMP := 'infinity'::TIMESTAMP; new_end TIMESTAMP := COALESCE(NEW.actual_return_time, infinity_timestamp);
BEGIN
    -- Chỉ kiểm tra Overlap đối với Biên bản ĐANG TRONG QUÁ TRÌNH chạy (IN_PROGRESS) để tránh kẹt lịch Tương Lai (PENDING)
    IF NEW.status = 'IN_PROGRESS' THEN
        IF EXISTS (SELECT 1 FROM vehicle_handover vh WHERE vh.bus_id = NEW.bus_id AND vh.status = 'IN_PROGRESS' AND vh.id <> COALESCE(NEW.id, -1) AND (vh.handover_time < new_end AND COALESCE(vh.actual_return_time, infinity_timestamp) > NEW.handover_time)) THEN RAISE EXCEPTION 'Xe đang bị trùng lịch bàn giao. Vui lòng kết thúc ca trước.'; END IF;
        IF EXISTS (SELECT 1 FROM vehicle_handover vh WHERE vh.driver_id = NEW.driver_id AND vh.status = 'IN_PROGRESS' AND vh.id <> COALESCE(NEW.id, -1) AND (vh.handover_time < new_end AND COALESCE(vh.actual_return_time, infinity_timestamp) > NEW.handover_time)) THEN RAISE EXCEPTION 'Tài xế đang giữ xe khác. Vui lòng kết thúc ca trước.'; END IF;
    END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_check_handover_overlap BEFORE INSERT OR UPDATE ON vehicle_handover FOR EACH ROW EXECUTE FUNCTION check_handover_overlap();

-- [LOGIC SAFETY] Chặn xóa Tuyến đường (Route) nếu đang có chuyến (Trip) hoạt động
CREATE OR REPLACE FUNCTION check_route_delete_safety() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM trip t JOIN trip_schedule ts ON t.trip_schedule_id = ts.id WHERE ts.route_id = OLD.id AND t.departure_date >= CURRENT_DATE AND t.status IN ('SCHEDULED', 'RUNNING')) THEN RAISE EXCEPTION 'Không thể xóa tuyến đang có chuyến chạy.'; END IF;
    END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_route_safe_delete BEFORE UPDATE ON route FOR EACH ROW EXECUTE FUNCTION check_route_delete_safety();

-- ======================================================================================
-- TRIGGER updated_at cho các bảng mới
-- ======================================================================================
CREATE TRIGGER set_depot_updated_at
    BEFORE UPDATE ON depot FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_bus_assignment_updated_at
    BEFORE UPDATE ON bus_assignment FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_driver_assignment_updated_at
    BEFORE UPDATE ON driver_assignment FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_route_bus_registration_updated_at
    BEFORE UPDATE ON route_bus_registration FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_schedule_bus_type_updated_at
    BEFORE UPDATE ON schedule_bus_type FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Audit cho Planning (Đăng ký tuyến & Loại xe lịch)
CREATE TRIGGER audit_route_bus_registration AFTER INSERT OR UPDATE OR DELETE ON route_bus_registration
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_schedule_bus_type AFTER INSERT OR UPDATE OR DELETE ON schedule_bus_type
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- ======================================================================================
-- TRIGGER BẢO VỆ DỮ LIỆU — CHỐNG OVERLAP THỜI GIAN CA XE VỚI CHUYẾN
-- ======================================================================================

-- TRIGGER 1: Khi INSERT/UPDATE trip.bus_assignment_id → kiểm tra trip nằm trong ca xe
CREATE OR REPLACE FUNCTION check_trip_within_assignment()
RETURNS TRIGGER AS $$
DECLARE
    v_scheduled_start TIMESTAMP;
    v_scheduled_end   TIMESTAMP;
    v_trip_start      TIMESTAMP;
    v_trip_end        TIMESTAMP;
    v_route_duration  DECIMAL;
BEGIN
    IF NEW.bus_assignment_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT scheduled_start, scheduled_end
    INTO v_scheduled_start, v_scheduled_end
    FROM bus_assignment
    WHERE id = NEW.bus_assignment_id;

    IF v_scheduled_start IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.departure_date IS NOT NULL AND NEW.actual_departure_time IS NOT NULL THEN
        v_trip_start := NEW.departure_date + NEW.actual_departure_time;
    ELSE
        RETURN NEW;
    END IF;

    IF NEW.arrival_time IS NOT NULL THEN
        v_trip_end := NEW.arrival_time;
    ELSE
        SELECT r.duration_hours INTO v_route_duration
        FROM trip_schedule ts
        JOIN route r ON r.id = ts.route_id
        WHERE ts.id = NEW.trip_schedule_id;

        v_trip_end := v_trip_start + COALESCE(v_route_duration, 2) * INTERVAL '1 hour';
    END IF;

    IF v_trip_start < v_scheduled_start THEN
        RAISE EXCEPTION 'Chuyến xe khởi hành lúc % trước giờ xuất bãi của ca xe (%). Không thể gán.',
            v_trip_start::TIME, v_scheduled_start::TIME;
    END IF;

    IF v_scheduled_end IS NOT NULL AND v_trip_end > v_scheduled_end THEN
        RAISE EXCEPTION 'Chuyến xe kết thúc lúc % sau giờ nhập bãi của ca xe (%). Không thể gán.',
            v_trip_end::TIME, v_scheduled_end::TIME;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_trip_assignment_bound_check
    BEFORE INSERT OR UPDATE OF bus_assignment_id ON trip
    FOR EACH ROW EXECUTE FUNCTION check_trip_within_assignment();

-- TRIGGER 2: Khi UPDATE bus_assignment.scheduled_start/end → kiểm tra bao phủ trips
CREATE OR REPLACE FUNCTION check_assignment_covers_trips()
RETURNS TRIGGER AS $$
DECLARE
    v_earliest_trip_start TIMESTAMP;
    v_latest_trip_end     TIMESTAMP;
BEGIN
    IF NEW.scheduled_start IS NOT DISTINCT FROM OLD.scheduled_start
       AND NEW.scheduled_end IS NOT DISTINCT FROM OLD.scheduled_end THEN
        RETURN NEW;
    END IF;

    SELECT
        MIN(t.departure_date + t.actual_departure_time),
        MAX(COALESCE(t.arrival_time,
            t.departure_date + t.actual_departure_time +
            COALESCE(r.duration_hours, 2) * INTERVAL '1 hour'))
    INTO v_earliest_trip_start, v_latest_trip_end
    FROM trip t
    LEFT JOIN trip_schedule ts ON ts.id = t.trip_schedule_id
    LEFT JOIN route r ON r.id = ts.route_id
    WHERE t.bus_assignment_id = NEW.id
      AND t.deleted_at IS NULL
      AND t.actual_departure_time IS NOT NULL;

    IF v_earliest_trip_start IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.scheduled_start > v_earliest_trip_start THEN
        RAISE EXCEPTION 'Giờ xuất bãi mới (%) trễ hơn giờ khởi hành chuyến sớm nhất (%). Không thể cập nhật.',
            NEW.scheduled_start::TIME, v_earliest_trip_start::TIME;
    END IF;

    IF NEW.scheduled_end IS NOT NULL AND NEW.scheduled_end < v_latest_trip_end THEN
        RAISE EXCEPTION 'Giờ nhập bãi mới (%) sớm hơn giờ kết thúc chuyến muộn nhất (%). Không thể cập nhật.',
            NEW.scheduled_end::TIME, v_latest_trip_end::TIME;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assignment_time_covers_trips
    BEFORE UPDATE OF scheduled_start, scheduled_end ON bus_assignment
    FOR EACH ROW EXECUTE FUNCTION check_assignment_covers_trips();

-- TRIGGER 3: Khi gán trip vào ca xe → kiểm tra trip mới không overlap với trip đã có
CREATE OR REPLACE FUNCTION check_trip_overlap_in_assignment()
RETURNS TRIGGER AS $$
DECLARE
    v_new_start   TIMESTAMP;
    v_new_end     TIMESTAMP;
    v_conflict    RECORD;
    v_route_duration DECIMAL;
BEGIN
    IF NEW.bus_assignment_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.departure_date IS NOT NULL AND NEW.actual_departure_time IS NOT NULL THEN
        v_new_start := NEW.departure_date + NEW.actual_departure_time;
    ELSE
        RETURN NEW;
    END IF;

    IF NEW.arrival_time IS NOT NULL THEN
        v_new_end := NEW.arrival_time;
    ELSE
        SELECT r.duration_hours INTO v_route_duration
        FROM trip_schedule ts
        JOIN route r ON r.id = ts.route_id
        WHERE ts.id = NEW.trip_schedule_id;

        v_new_end := v_new_start + COALESCE(v_route_duration, 2) * INTERVAL '1 hour';
    END IF;

    SELECT t.id, t.code,
           (t.departure_date + t.actual_departure_time) AS trip_start,
           COALESCE(t.arrival_time,
               t.departure_date + t.actual_departure_time +
               COALESCE(r.duration_hours, 2) * INTERVAL '1 hour') AS trip_end
    INTO v_conflict
    FROM trip t
    LEFT JOIN trip_schedule ts ON ts.id = t.trip_schedule_id
    LEFT JOIN route r ON r.id = ts.route_id
    WHERE t.bus_assignment_id = NEW.bus_assignment_id
      AND t.id != NEW.id
      AND t.deleted_at IS NULL
      AND t.actual_departure_time IS NOT NULL
      AND v_new_start < COALESCE(t.arrival_time,
              t.departure_date + t.actual_departure_time +
              COALESCE(r.duration_hours, 2) * INTERVAL '1 hour')
      AND v_new_end > (t.departure_date + t.actual_departure_time)
    LIMIT 1;

    IF v_conflict.id IS NOT NULL THEN
        RAISE EXCEPTION 'Chuyến xe trùng lịch với chuyến % (% → %). Không thể gán vào cùng ca xe.',
            COALESCE(v_conflict.code, '#' || v_conflict.id),
            v_conflict.trip_start::TIME,
            v_conflict.trip_end::TIME;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_trip_overlap_in_assignment
    BEFORE INSERT OR UPDATE OF bus_assignment_id ON trip
    FOR EACH ROW EXECUTE FUNCTION check_trip_overlap_in_assignment();