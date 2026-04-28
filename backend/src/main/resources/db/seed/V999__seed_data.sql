/* ======================================================================================
 * SCRIPT DỮ LIỆU MẪU ĐA DẠNG CHO BUS OPERATION SYSTEM (BOS) - VERSION 2026
 * ======================================================================================
 * Dữ liệu được khôi phục nguyên trạng gốc + Mở rộng kịch bản Demo
 * Password mặc định cho TẤT CẢ accounts: root@123456
 * (Hash: $2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja)
 * ====================================================================================== */

-- 1. CLEANUP DATA (Xóa sạch và Reset ID về 1)
TRUNCATE TABLE 
    refund_transactions,
    payment_history,
    ticket,
    booking,
    refresh_tokens,
    pickup_point,
    fare_config, 
    fare_policies,
    schedule_bus_type,
    route_bus_registration,
    trip_change_request,
    trip, 
    trip_schedule, 
    vehicle_handover,
    bus_assignment,
    route, 
    bus, 
    bus_type, 
    depot,
    driver_detail, 
    staff_detail, 
    ticket_office, 
    bus_station, 
    province, 
    departments, 
    user_roles,
    users
    RESTART IDENTITY CASCADE;

-- 2. TẠO DEPARTMENTS
INSERT INTO departments (code, name, description, status) VALUES
('BOD', 'Ban Giám Đốc', 'Board of Directors', 'ACTIVE'),
('OP', 'Vận hành', 'Quản lý tài xế và xe', 'ACTIVE'),
('SALES', 'Kinh doanh', 'Bán vé và CSKH', 'ACTIVE'),
('HR', 'Nhân sự', 'Tuyển dụng và đào tạo', 'ACTIVE'),
('FIN', 'Tài chính', 'Kế toán và kiểm toán', 'ACTIVE');

-- 3. TẠO USERS (ADMIN, STAFF, DRIVER)
-- Password chung: root@123456
INSERT INTO users (username, password, full_name, email, phone, employee_code, status) VALUES
-- Admin (ID 1)
('admin', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'System Administrator', 'admin@bos.vn', '0900000000', 'EMP-0001', 'ACTIVE'),
-- Staff (ID 2-6)
('staff01', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Nguyễn Thu Hà', 'staff01@bos.vn', '0901111111', 'EMP-0002', 'ACTIVE'),
('staff02', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Lê Văn Tám', 'staff02@bos.vn', '0901111112', 'EMP-0003', 'ACTIVE'),
('staff03', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Trần Thị B', 'staff03@bos.vn', '0901111113', 'EMP-0004', 'ACTIVE'),
('staff04', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Hoàng Văn C', 'staff04@bos.vn', '0901111114', 'EMP-0005', 'ACTIVE'),
('staff05', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Phạm Thị D', 'staff05@bos.vn', '0901111115', 'EMP-0006', 'ACTIVE'),
-- Drivers (ID 7-16)
('driver01', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Nguyễn Văn Tài', 'driver01@bos.vn', '0902222201', 'DRV-0007', 'ACTIVE'),
('driver02', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Lê Văn Xế', 'driver02@bos.vn', '0902222202', 'DRV-0008', 'ACTIVE'),
('driver03', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Trần Văn Be', 'driver03@bos.vn', '0902222203', 'DRV-0009', 'ACTIVE'),
('driver04', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Hoàng Văn Dũng', 'driver04@bos.vn', '0902222204', 'DRV-0010', 'ACTIVE'),
('driver05', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Phạm Văn Eo', 'driver05@bos.vn', '0902222205', 'DRV-0011', 'ACTIVE'),
('driver06', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Võ Văn F', 'driver06@bos.vn', '0902222206', 'DRV-0012', 'ACTIVE'),
('driver07', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Đặng Văn G', 'driver07@bos.vn', '0902222207', 'DRV-0013', 'ACTIVE'),
('driver08', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Bùi Văn H', 'driver08@bos.vn', '0902222208', 'DRV-0014', 'ACTIVE'),
('driver09', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Dương Văn I', 'driver09@bos.vn', '0902222209', 'DRV-0015', 'ACTIVE'),
('driver10', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Lý Văn K', 'driver10@bos.vn', '0902222210', 'DRV-0016', 'ACTIVE'),
-- EXTENDED DEMO: Drivers (ID 17-26)
('driver11', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Ngô Văn L', 'driver11@bos.vn', '0902222211', 'DRV-0017', 'ACTIVE'),
('driver12', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Đỗ Văn M', 'driver12@bos.vn', '0902222212', 'DRV-0018', 'ACTIVE'),
('driver13', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Hồ Văn N', 'driver13@bos.vn', '0902222213', 'DRV-0019', 'ACTIVE'),
('driver14', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Châu Văn O', 'driver14@bos.vn', '0902222214', 'DRV-0020', 'ACTIVE'),
('driver15', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Huỳnh Văn P', 'driver15@bos.vn', '0902222215', 'DRV-0021', 'ACTIVE'),
('driver16', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Phan Văn Q', 'driver16@bos.vn', '0902222216', 'DRV-0022', 'ACTIVE'),
('driver17', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Vũ Văn R', 'driver17@bos.vn', '0902222217', 'DRV-0023', 'ACTIVE'),
('driver18', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Đinh Văn S', 'driver18@bos.vn', '0902222218', 'DRV-0024', 'ACTIVE'),
('driver19', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Lại Văn T', 'driver19@bos.vn', '0902222219', 'DRV-0025', 'ACTIVE'),
('driver20', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Đào Văn U', 'driver20@bos.vn', '0902222220', 'DRV-0026', 'ACTIVE'),
-- RESCUE DEMO: Drivers for Incident Swaps (ID 27-28)
('driver21', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Tài xế Cứu hộ 1', 'res1@bos.vn', '0999999901', 'DRV-9991', 'ACTIVE'),
('driver22', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Tài xế Cứu hộ 2', 'res2@bos.vn', '0999999902', 'DRV-9992', 'ACTIVE');

-- 3.1 GÁN ROLES CHO USERS
INSERT INTO user_roles (user_id, role) VALUES
-- Admin
(1, 'ADMIN'), (1, 'MANAGER'),
-- Staff (Gốc)
(2, 'STAFF'), (3, 'STAFF'), (4, 'STAFF'), (5, 'STAFF'), (6, 'STAFF'),
-- Drivers (Gốc)
(7, 'DRIVER'), (8, 'DRIVER'), (9, 'DRIVER'), (10, 'DRIVER'), (11, 'DRIVER'),
(12, 'DRIVER'), (13, 'DRIVER'), (14, 'DRIVER'), (15, 'DRIVER'), (16, 'DRIVER'),
-- Drivers (Demo Bổ sung)
(17, 'DRIVER'), (18, 'DRIVER'), (19, 'DRIVER'), (20, 'DRIVER'), (21, 'DRIVER'),
(22, 'DRIVER'), (23, 'DRIVER'), (24, 'DRIVER'), (25, 'DRIVER'), (26, 'DRIVER'),
(27, 'DRIVER'), (28, 'DRIVER');

-- 4. MASTER DATA (PROVINCES & STATIONS) - FULL ĐẦY ĐỦ NHƯ GỐC + 63 Tỉnh Thành
INSERT INTO province (name, gov_code) VALUES 
('Hồ Chí Minh', '79'), ('Hà Nội', '01'), ('Đà Nẵng', '48'), ('Cần Thơ', '92'), ('Lâm Đồng', '68'),
('Khánh Hòa', '56'), ('Bà Rịa - Vũng Tàu', '77'), ('Đồng Nai', '75'), ('Bình Thuận', '60'), ('Kiên Giang', '91'),
('Hà Giang', '02'), ('Cao Bằng', '04'), ('Bắc Kạn', '06'), ('Tuyên Quang', '08'), ('Lào Cai', '10'), 
('Điện Biên', '11'), ('Lai Châu', '12'), ('Sơn La', '14'), ('Yên Bái', '15'), ('Hoà Bình', '17'), 
('Thái Nguyên', '19'), ('Lạng Sơn', '20'), ('Quảng Ninh', '22'), ('Bắc Giang', '24'), ('Phú Thọ', '25'), 
('Vĩnh Phúc', '26'), ('Bắc Ninh', '27'), ('Hải Dương', '30'), ('Hải Phòng', '31'), ('Hưng Yên', '33'), 
('Thái Bình', '34'), ('Hà Nam', '35'), ('Nam Định', '36'), ('Ninh Bình', '37'), ('Thanh Hóa', '38'), 
('Nghệ An', '40'), ('Hà Tĩnh', '42'), ('Quảng Bình', '44'), ('Quảng Trị', '45'), ('Thừa Thiên Huế', '46'), 
('Quảng Nam', '49'), ('Quảng Ngãi', '51'), ('Bình Định', '52'), ('Phú Yên', '54'), ('Ninh Thuận', '58'), 
('Kon Tum', '62'), ('Gia Lai', '64'), ('Đắk Lắk', '66'), ('Đắk Nông', '67'), ('Bình Phước', '70'), 
('Tây Ninh', '72'), ('Bình Dương', '74'), ('Long An', '80'), ('Tiền Giang', '82'), ('Bến Tre', '83'), 
('Trà Vinh', '84'), ('Vĩnh Long', '86'), ('Đồng Tháp', '87'), ('An Giang', '89'), ('Hậu Giang', '93'), 
('Sóc Trăng', '94'), ('Bạc Liêu', '95'), ('Cà Mau', '96');

INSERT INTO bus_station (name, address, province_id, gov_code, status) VALUES 
('BX Miền Đông', '292 Đinh Bộ Lĩnh, HCM', 1, 'BX_MD', 'ACTIVE'), -- ID 1
('BX Mỹ Đình', '20 Phạm Hùng, Hà Nội', 2, 'BX_MDINH', 'ACTIVE'), -- ID 2
('BX Trung Tâm Đà Nẵng', '201 Tôn Đức Thắng', 3, 'BX_DN', 'ACTIVE'), -- ID 3
('BX 91B Cần Thơ', 'Nguyễn Văn Linh', 4, 'BX_91B', 'ACTIVE'), -- ID 4
('BX Liên Tỉnh Đà Lạt', '01 Tô Hiến Thành', 5, 'BX_DL', 'ACTIVE'), -- ID 5
('BX Phía Nam Nha Trang', 'Vĩnh Trung', 6, 'BX_NT', 'ACTIVE'), -- ID 6
('BX Vũng Tàu', 'Nam Kỳ Khởi Nghĩa', 7, 'BX_VT', 'ACTIVE'), -- ID 7
('BX Biên Hòa', 'Nguyễn Ái Quốc', 8, 'BX_BH', 'ACTIVE'), -- ID 8
('BX Phan Thiết', 'Từ Văn Tư', 9, 'BX_PT', 'ACTIVE'), -- ID 9
('BX Rạch Giá', 'Nguyễn Bỉnh Khiêm', 10, 'BX_RG', 'ACTIVE'), -- ID 10
('BX Cà Mau', 'Quốc Lộ 1A', 63, 'BX_CM', 'ACTIVE');      -- ID 11

-- Bãi đỗ xe (Depot)
INSERT INTO depot (name, address, capacity, latitude, longitude, status) VALUES
('Bãi xe Thủ Đức', 'Xa lộ Hà Nội, Thủ Đức, HCM', 50, 10.85810000, 106.77150000, 'ACTIVE'),       -- ID 1
('Bãi xe Bình Triệu', '402 Xô Viết Nghệ Tĩnh, Bình Thạnh, HCM', 40, 10.82750000, 106.71550000, 'ACTIVE'), -- ID 2
('Bãi xe An Sương', 'Ngã tư An Sương, Hóc Môn, HCM', 60, 10.87300000, 106.61850000, 'ACTIVE'),  -- ID 3
('Bãi xe Đà Lạt', 'Phường 4, TP Đà Lạt, Lâm Đồng', 30, 11.94040000, 108.45830000, 'ACTIVE'),   -- ID 4
('Bãi xe Cần Thơ', 'Cái Răng, TP Cần Thơ', 35, 10.01300000, 105.76650000, 'ACTIVE'),            -- ID 5
('Bãi xe Vũng Tàu', 'TP Vũng Tàu, BRVT', 25, 10.34600000, 107.08430000, 'ACTIVE'),             -- ID 6
('Bãi xe Nha Trang', 'Phước Hải, Nha Trang, Khánh Hòa', 30, 12.23880000, 109.19680000, 'ACTIVE'), -- ID 7
('Bãi xe Mỹ Đình', 'Phạm Hùng, Nam Từ Liêm, Hà Nội', 45, 21.02850000, 105.78230000, 'ACTIVE'); -- ID 8

-- Văn phòng bán vé
INSERT INTO ticket_office (name, station_id, address, phone, status) VALUES 
('Quầy vé sô 1 - BX Miền Đông', 1, 'Cổng 2, BX MĐ', '02833333333', 'ACTIVE'),
('Quầy vé số 5 - BX Đà Lạt', 5, 'Khu A', '02633333333', 'ACTIVE'),
('Văn phòng Quận 1', NULL, '123 Nguyễn Huệ, Q1', '02899999999', 'ACTIVE'),
('Quầy vé 91B Cần Thơ', 4, 'Cổng chính', '02923333333', 'ACTIVE');

-- Các chính sách quy định (Fare Policies / House Rules)
INSERT INTO fare_policies (code, name, type, "action", conditions, priority, is_active, created_by, start_time, scope, category, description, legal_reference_doc, max_usage) VALUES
('P001', 'Phí cam kết giữ chỗ', 'SURCHARGE', '{"amount": 50000, "type": "FIXED"}'::jsonb, '{"time_limit_hours": 24}'::jsonb, 1, TRUE, 1, CURRENT_TIMESTAMP, 'GLOBAL', 'HOUSE_RULE', 'Phí giữ chỗ khi đặt vé online', 'Nội quy công ty', NULL),
('P002', 'Hoàn vé 24h', 'REFUND', '{"refund_percent": 100}'::jsonb, '{"cancel_before_hours": 24}'::jsonb, 1, TRUE, 1, CURRENT_TIMESTAMP, 'GLOBAL', 'HOUSE_RULE', 'Hoàn 100% nếu hủy trước 24h', 'Nội quy công ty', NULL),
('P003', 'Hoàn vé 12h', 'REFUND', '{"refund_percent": 50}'::jsonb, '{"cancel_before_hours": 12}'::jsonb, 2, TRUE, 1, CURRENT_TIMESTAMP, 'GLOBAL', 'HOUSE_RULE', 'Hoàn 50% nếu hủy trước 12h', 'Nội quy công ty', NULL),
('POS01', 'Khuyến mãi POS', 'DISCOUNT', '{"amount": 10000, "type": "FIXED"}'::jsonb, '{"min_order": 0}'::jsonb, 9097, TRUE, 1, CURRENT_TIMESTAMP, 'GLOBAL', 'MARKETING', 'Giảm giá test cho POS', NULL, 573);

-- 5. FLEET (BUS TYPE & BUS)
INSERT INTO bus_type (name, total_seats, seat_map) VALUES 
('Limousine 34 Phòng', 34, '[{"code": "A01", "type": "BED"}, {"code": "A02", "type": "BED"}, {"code": "A03", "type": "BED"}, {"code": "A04", "type": "BED"}]'::jsonb), -- ID 1
('Ghế ngồi 47 Chỗ', 47, '[]'::jsonb), -- ID 2
('Limousine 22 Phòng VIP', 22, '[]'::jsonb), -- ID 3
('Giường nằm 40 Chỗ', 40, '[]'::jsonb); -- ID 4

-- Xe Bus (10 xe gốc + Đã bổ sung thành 20 xe cho Demo siêu to)
INSERT INTO bus (license_plate, bus_type_id, manufacturing_year, insurance_expiry_date, registration_expiry_date, status) VALUES
('51B-123.45', 1, 2024, '2027-12-31', '2027-06-30', 'ACTIVE'), -- 1
('51B-222.22', 1, 2023, '2027-11-30', '2027-05-30', 'ACTIVE'), -- 2
('51B-333.33', 1, 2023, '2027-10-31', '2027-04-30', 'MAINTENANCE'), -- 3
('29B-444.44', 2, 2022, '2027-09-30', '2027-03-30', 'ACTIVE'), -- 4
('29B-555.55', 2, 2022, '2027-08-31', '2027-02-28', 'ACTIVE'), -- 5
('43B-666.66', 3, 2024, '2027-01-01', '2027-07-01', 'ACTIVE'), -- 6
('65B-777.77', 4, 2021, '2027-07-31', '2027-01-30', 'ACTIVE'), -- 7
('49B-888.88', 1, 2023, '2027-12-31', '2027-06-30', 'ACTIVE'), -- 8
('79B-999.99', 3, 2024, '2027-06-01', '2027-12-01', 'ACTIVE'), -- 9
('72B-101.01', 4, 2020, '2027-05-30', '2027-11-30', 'ACTIVE'), -- 10
('51B-111.01', 1, 2022, '2027-10-31', '2027-06-30', 'ACTIVE'), -- 11
('51B-111.02', 2, 2023, '2027-11-30', '2027-05-30', 'ACTIVE'), -- 12
('51B-111.03', 3, 2021, '2027-10-31', '2027-04-30', 'ACTIVE'), -- 13
('29B-111.04', 4, 2019, '2027-09-30', '2027-03-30', 'ACTIVE'), -- 14
('29B-111.05', 1, 2020, '2027-08-31', '2027-02-28', 'ACTIVE'), -- 15
('43B-111.06', 2, 2024, '2027-01-01', '2027-07-01', 'ACTIVE'), -- 16
('65B-111.07', 3, 2021, '2027-07-31', '2027-01-30', 'ACTIVE'), -- 17
('49B-111.08', 4, 2023, '2027-12-31', '2027-06-30', 'ACTIVE'), -- 18
('79B-111.09', 1, 2024, '2027-06-01', '2027-12-01', 'ACTIVE'), -- 19
('72B-111.10', 2, 2020, '2027-05-30', '2027-11-30', 'ACTIVE'), -- 20
('99B-000.01', 1, 2025, '2028-01-01', '2028-01-01', 'ACTIVE'), -- 21 (Xe mới, chưa gán bãi)
('99B-000.02', 2, 2025, '2028-01-01', '2028-01-01', 'ACTIVE'); -- 22 (Xe mới, chưa gán bãi)

-- 6. ROUTES & SCHEDULES
-- Tuyến đường (10 tuyến Gốc)
INSERT INTO route (code, name, departure_station_id, arrival_station_id, distance, duration_hours, status) VALUES 
('SG-DL', 'Sài Gòn - Đà Lạt', 1, 5, 305.5, 7.5, 'ACTIVE'), -- Route 1
('DL-SG', 'Đà Lạt - Sài Gòn', 5, 1, 305.5, 7.5, 'ACTIVE'), -- Route 2
('SG-CT', 'Sài Gòn - Cần Thơ', 1, 4, 169.0, 3.5, 'ACTIVE'), -- Route 3
('CT-SG', 'Cần Thơ - Sài Gòn', 4, 1, 169.0, 3.5, 'ACTIVE'), -- Route 4
('SG-VT', 'Sài Gòn - Vũng Tàu', 1, 7, 95.0, 2.0, 'ACTIVE'), -- Route 5
('VT-SG', 'Vũng Tàu - Sài Gòn', 7, 1, 95.0, 2.0, 'ACTIVE'), -- Route 6
('HN-HP', 'Hà Nội - Hải Phòng', 2, 8, 120.0, 2.5, 'ACTIVE'), -- Route 7
('SG-NT', 'Sài Gòn - Nha Trang', 1, 6, 435.0, 9.0, 'ACTIVE'), -- Route 8
('NT-SG', 'Nha Trang - Sài Gòn', 6, 1, 435.0, 9.0, 'ACTIVE'), -- Route 9
('DL-NT', 'Đà Lạt - Nha Trang', 5, 6, 135.0, 3.5, 'ACTIVE'); -- Route 10

-- 9. FARE CONFIG & PICKUP POINTS
-- Bao phủ TẤT CẢ tổ hợp route + bus_type → loại bỏ hoàn toàn trip giá 0đ
-- Bus types: 1=Limousine 34, 2=Ghế ngồi 47, 3=Limousine VIP 22, 4=Giường nằm 40
INSERT INTO fare_config (route_id, bus_type_id, price, effective_from, status) VALUES
-- Route 1 (SG-DL, 305km)
(1, 1, 350000, CURRENT_DATE, 'ACTIVE'), (1, 2, 250000, CURRENT_DATE, 'ACTIVE'),
(1, 3, 450000, CURRENT_DATE, 'ACTIVE'), (1, 4, 300000, CURRENT_DATE, 'ACTIVE'),
-- Route 2 (DL-SG, 305km)
(2, 1, 350000, CURRENT_DATE, 'ACTIVE'), (2, 2, 250000, CURRENT_DATE, 'ACTIVE'),
(2, 3, 450000, CURRENT_DATE, 'ACTIVE'), (2, 4, 300000, CURRENT_DATE, 'ACTIVE'),
-- Route 3 (SG-CT, 169km)
(3, 1, 280000, CURRENT_DATE, 'ACTIVE'), (3, 2, 180000, CURRENT_DATE, 'ACTIVE'),
(3, 3, 350000, CURRENT_DATE, 'ACTIVE'), (3, 4, 220000, CURRENT_DATE, 'ACTIVE'),
-- Route 4 (CT-SG, 169km)
(4, 1, 280000, CURRENT_DATE, 'ACTIVE'), (4, 2, 180000, CURRENT_DATE, 'ACTIVE'),
(4, 3, 350000, CURRENT_DATE, 'ACTIVE'), (4, 4, 220000, CURRENT_DATE, 'ACTIVE'),
-- Route 5 (SG-VT, 95km)
(5, 1, 220000, CURRENT_DATE, 'ACTIVE'), (5, 2, 160000, CURRENT_DATE, 'ACTIVE'),
(5, 3, 280000, CURRENT_DATE, 'ACTIVE'), (5, 4, 200000, CURRENT_DATE, 'ACTIVE'),
-- Route 6 (VT-SG, 95km)
(6, 1, 220000, CURRENT_DATE, 'ACTIVE'), (6, 2, 160000, CURRENT_DATE, 'ACTIVE'),
(6, 3, 280000, CURRENT_DATE, 'ACTIVE'), (6, 4, 200000, CURRENT_DATE, 'ACTIVE'),
-- Route 7 (HN-HP, 120km)
(7, 1, 250000, CURRENT_DATE, 'ACTIVE'), (7, 2, 180000, CURRENT_DATE, 'ACTIVE'),
(7, 3, 320000, CURRENT_DATE, 'ACTIVE'), (7, 4, 220000, CURRENT_DATE, 'ACTIVE'),
-- Route 8 (SG-NT, 435km)
(8, 1, 450000, CURRENT_DATE, 'ACTIVE'), (8, 2, 350000, CURRENT_DATE, 'ACTIVE'),
(8, 3, 600000, CURRENT_DATE, 'ACTIVE'), (8, 4, 400000, CURRENT_DATE, 'ACTIVE'),
-- Route 9 (NT-SG, 435km)
(9, 1, 450000, CURRENT_DATE, 'ACTIVE'), (9, 2, 350000, CURRENT_DATE, 'ACTIVE'),
(9, 3, 600000, CURRENT_DATE, 'ACTIVE'), (9, 4, 400000, CURRENT_DATE, 'ACTIVE'),
-- Route 10 (DL-NT, 135km)
(10, 1, 250000, CURRENT_DATE, 'ACTIVE'), (10, 2, 180000, CURRENT_DATE, 'ACTIVE'),
(10, 3, 350000, CURRENT_DATE, 'ACTIVE'), (10, 4, 220000, CURRENT_DATE, 'ACTIVE');

-- KHÔI PHỤC HOÀN TOÀN PICKUP POINTS RẤT ĐẦY ĐỦ CỦA USER
-- Route 1: SG-DL
INSERT INTO pickup_point (route_id, name, address, latitude, longitude, sequence_order, estimated_minutes_from_departure, status) VALUES
(1, 'Ngã tư Bình Phước', 'Ngã tư Bình Phước, Thủ Đức, HCM', 10.8781, 106.7115, 1, 30, 'ACTIVE'),
(1, 'Ngã ba Dầu Giây', 'QL1 - QL20, Long Khánh, Đồng Nai', 10.9100, 107.0800, 2, 75, 'ACTIVE'),
(1, 'TT. Định Quán', 'QL20, Định Quán, Đồng Nai', 11.1505, 107.3634, 3, 120, 'ACTIVE'),
(1, 'TT. Madaguôi', 'QL20, Đạ Huoai, Lâm Đồng', 11.3900, 107.5900, 4, 180, 'ACTIVE'),
(1, 'TP Bảo Lộc', 'BX Bảo Lộc, Lâm Đồng', 11.5484, 107.8113, 5, 270, 'ACTIVE');
-- Route 2: DL-SG
INSERT INTO pickup_point (route_id, name, address, latitude, longitude, sequence_order, estimated_minutes_from_departure, status) VALUES
(2, 'TP Bảo Lộc', 'BX Bảo Lộc, Lâm Đồng', 11.5484, 107.8113, 1, 90, 'ACTIVE'),
(2, 'TT. Madaguôi', 'QL20, Đạ Huoai, Lâm Đồng', 11.3900, 107.5900, 2, 150, 'ACTIVE'),
(2, 'TT. Định Quán', 'QL20, Định Quán, Đồng Nai', 11.1505, 107.3634, 3, 240, 'ACTIVE'),
(2, 'Ngã ba Dầu Giây', 'QL1 - QL20, Long Khánh, Đồng Nai', 10.9100, 107.0800, 4, 330, 'ACTIVE'),
(2, 'Ngã tư Bình Phước', 'Ngã tư Bình Phước, Thủ Đức, HCM', 10.8781, 106.7115, 5, 400, 'ACTIVE');
-- Route 3: SG-CT
INSERT INTO pickup_point (route_id, name, address, latitude, longitude, sequence_order, estimated_minutes_from_departure, status) VALUES
(3, 'Trạm xăng An Lạc', 'Bình Chánh, HCM', 10.7144, 106.5944, 1, 20, 'ACTIVE'),
(3, 'Ngã tư Bình Nhựt', 'QL1A, Bến Lức, Long An', 10.6480, 106.4850, 2, 40, 'ACTIVE'),
(3, 'TP Tân An', 'BX Tân An, Long An', 10.5400, 106.4100, 3, 60, 'ACTIVE'),
(3, 'Cầu Mỹ Thuận', 'QL1A, Cái Bè, Tiền Giang', 10.2600, 105.9700, 4, 120, 'ACTIVE'),
(3, 'TP Cần Thơ - Cầu Cần Thơ', 'QL1A, Bình Minh, Vĩnh Long', 10.0400, 105.7700, 5, 160, 'ACTIVE');
-- Route 4: CT-SG
INSERT INTO pickup_point (route_id, name, address, latitude, longitude, sequence_order, estimated_minutes_from_departure, status) VALUES
(4, 'Cầu Cần Thơ', 'QL1A, Bình Minh, Vĩnh Long', 10.0400, 105.7700, 1, 30, 'ACTIVE'),
(4, 'Cầu Mỹ Thuận', 'QL1A, Cái Bè, Tiền Giang', 10.2600, 105.9700, 2, 60, 'ACTIVE'),
(4, 'TP Tân An', 'BX Tân An, Long An', 10.5400, 106.4100, 3, 120, 'ACTIVE'),
(4, 'Ngã tư Bình Nhựt', 'QL1A, Bến Lức, Long An', 10.6480, 106.4850, 4, 150, 'ACTIVE'),
(4, 'Trạm xăng An Lạc', 'Bình Chánh, HCM', 10.7144, 106.5944, 5, 170, 'ACTIVE');
-- Route 5: SG-VT
INSERT INTO pickup_point (route_id, name, address, latitude, longitude, sequence_order, estimated_minutes_from_departure, status) VALUES
(5, 'Cầu Đồng Nai', 'QL51, Biên Hòa, Đồng Nai', 10.9100, 106.8500, 1, 25, 'ACTIVE'),
(5, 'Ngã ba Vũng Tàu', 'Bà Rịa, BRVT', 10.4966, 107.1685, 2, 60, 'ACTIVE'),
(5, 'Thị xã Phú Mỹ', 'QL51, Phú Mỹ, BRVT', 10.6000, 107.0500, 3, 45, 'ACTIVE');
-- Route 6: VT-SG
INSERT INTO pickup_point (route_id, name, address, latitude, longitude, sequence_order, estimated_minutes_from_departure, status) VALUES
(6, 'Thị xã Phú Mỹ', 'QL51, Phú Mỹ, BRVT', 10.6000, 107.0500, 1, 30, 'ACTIVE'),
(6, 'Ngã ba Vũng Tàu', 'Bà Rịa, BRVT', 10.4966, 107.1685, 2, 45, 'ACTIVE'),
(6, 'Cầu Đồng Nai', 'QL51, Biên Hòa, Đồng Nai', 10.9100, 106.8500, 3, 85, 'ACTIVE');
-- Route 7: HN-HP
INSERT INTO pickup_point (route_id, name, address, latitude, longitude, sequence_order, estimated_minutes_from_departure, status) VALUES
(7, 'Cầu Thanh Trì', 'QL5, Thanh Trì, Hà Nội', 20.9700, 105.8900, 1, 20, 'ACTIVE'),
(7, 'TP Hưng Yên', 'QL5, TX Hưng Yên', 20.6500, 106.0600, 2, 50, 'ACTIVE'),
(7, 'TP Hải Dương', 'BX Hải Dương', 20.9400, 106.3300, 3, 80, 'ACTIVE');
-- Route 8: SG-NT
INSERT INTO pickup_point (route_id, name, address, latitude, longitude, sequence_order, estimated_minutes_from_departure, status) VALUES
(8, 'TP Biên Hòa', 'BX Biên Hòa, Đồng Nai', 10.9500, 106.8200, 1, 30, 'ACTIVE'),
(8, 'TP Phan Thiết', 'BX Phan Thiết, Bình Thuận', 10.9333, 108.1000, 2, 240, 'ACTIVE'),
(8, 'Tuy Phong', 'QL1A, Tuy Phong, Bình Thuận', 11.2200, 108.6500, 3, 300, 'ACTIVE'),
(8, 'Cam Ranh', 'Cam Ranh, Khánh Hòa', 11.9214, 109.1592, 4, 420, 'ACTIVE');
-- Route 9: NT-SG
INSERT INTO pickup_point (route_id, name, address, latitude, longitude, sequence_order, estimated_minutes_from_departure, status) VALUES
(9, 'Cam Ranh', 'Cam Ranh, Khánh Hòa', 11.9214, 109.1592, 1, 45, 'ACTIVE'),
(9, 'Tuy Phong', 'QL1A, Tuy Phong, Bình Thuận', 11.2200, 108.6500, 2, 180, 'ACTIVE'),
(9, 'TP Phan Thiết', 'BX Phan Thiết, Bình Thuận', 10.9333, 108.1000, 3, 240, 'ACTIVE'),
(9, 'TP Biên Hòa', 'BX Biên Hòa, Đồng Nai', 10.9500, 106.8200, 4, 480, 'ACTIVE');
-- Route 10: DL-NT
INSERT INTO pickup_point (route_id, name, address, latitude, longitude, sequence_order, estimated_minutes_from_departure, status) VALUES
(10, 'Ngã ba Ninh Gia', 'QL27C, Đức Trọng, Lâm Đồng', 11.6800, 108.3500, 1, 40, 'ACTIVE'),
(10, 'Ninh Sơn', 'QL27, Ninh Sơn, Ninh Thuận', 11.7700, 108.6700, 2, 90, 'ACTIVE'),
(10, 'Diên Khánh', 'QL26, Diên Khánh, Khánh Hòa', 12.1200, 108.9800, 3, 150, 'ACTIVE');

-- ======================================================================================
-- 10. LỊCH TRÌNH VÀ CHUYẾN ĐI (Bao trùm quá khứ - Tương lai đến tận giữa Tháng 4/2026)
-- ======================================================================================

INSERT INTO trip_schedule (route_id, departure_time, operation_days_bitmap, status, effective_from) VALUES
-- Route 1 (SG-DL): Chạy mỗi 2 tiếng (Gốc)
(1, '01:00:00', 127, 'ACTIVE', CURRENT_DATE), (1, '07:00:00', 127, 'ACTIVE', CURRENT_DATE),
(1, '08:00:00', 127, 'ACTIVE', CURRENT_DATE), (1, '09:00:00', 127, 'ACTIVE', CURRENT_DATE),
(1, '11:00:00', 127, 'ACTIVE', CURRENT_DATE), (1, '13:00:00', 127, 'ACTIVE', CURRENT_DATE),
(1, '15:00:00', 127, 'ACTIVE', CURRENT_DATE), (1, '17:00:00', 127, 'ACTIVE', CURRENT_DATE),
(1, '19:00:00', 127, 'ACTIVE', CURRENT_DATE), (1, '21:00:00', 127, 'ACTIVE', CURRENT_DATE),
(1, '22:00:00', 127, 'ACTIVE', CURRENT_DATE), (1, '23:00:00', 127, 'ACTIVE', CURRENT_DATE),
-- Route 3 (SG-CT): Chạy mỗi 1 tiếng (Gốc)
(3, '05:00:00', 127, 'ACTIVE', CURRENT_DATE), (3, '06:00:00', 127, 'ACTIVE', CURRENT_DATE),
(3, '07:30:00', 127, 'ACTIVE', CURRENT_DATE), (3, '08:30:00', 127, 'ACTIVE', CURRENT_DATE),
(3, '09:30:00', 127, 'ACTIVE', CURRENT_DATE), (3, '10:30:00', 127, 'ACTIVE', CURRENT_DATE),
(3, '11:30:00', 127, 'ACTIVE', CURRENT_DATE), (3, '12:30:00', 127, 'ACTIVE', CURRENT_DATE),
(3, '13:30:00', 127, 'ACTIVE', CURRENT_DATE), (3, '14:30:00', 127, 'ACTIVE', CURRENT_DATE),
(3, '15:30:00', 127, 'ACTIVE', CURRENT_DATE), (3, '16:30:00', 127, 'ACTIVE', CURRENT_DATE),
(3, '17:30:00', 127, 'ACTIVE', CURRENT_DATE), (3, '18:30:00', 127, 'ACTIVE', CURRENT_DATE),
-- Route 5 (SG-VT): Chạy mỗi 2 tiếng (Gốc)
(5, '06:00:00', 127, 'ACTIVE', CURRENT_DATE), (5, '08:00:00', 127, 'ACTIVE', CURRENT_DATE),
(5, '09:00:00', 127, 'ACTIVE', CURRENT_DATE), (5, '10:00:00', 127, 'ACTIVE', CURRENT_DATE),
(5, '14:00:00', 127, 'ACTIVE', CURRENT_DATE), (5, '16:00:00', 127, 'ACTIVE', CURRENT_DATE),
-- Route 8 (SG-NT): Chạy sáng và tối (Gốc)
(8, '08:00:00', 127, 'ACTIVE', CURRENT_DATE), (8, '20:00:00', 127, 'ACTIVE', CURRENT_DATE),
(8, '21:30:00', 127, 'ACTIVE', CURRENT_DATE), (8, '22:30:00', 127, 'ACTIVE', CURRENT_DATE),
-- TUYẾN VỀ (RETURN ROUTES) (Gốc)
(2, '01:00:00', 127, 'ACTIVE', CURRENT_DATE), (2, '04:00:00', 127, 'ACTIVE', CURRENT_DATE),
(2, '06:00:00', 127, 'ACTIVE', CURRENT_DATE), (2, '07:00:00', 127, 'ACTIVE', CURRENT_DATE),
(2, '08:00:00', 127, 'ACTIVE', CURRENT_DATE), (2, '09:00:00', 127, 'ACTIVE', CURRENT_DATE),
(2, '10:00:00', 127, 'ACTIVE', CURRENT_DATE), (2, '11:00:00', 127, 'ACTIVE', CURRENT_DATE),
(2, '12:00:00', 127, 'ACTIVE', CURRENT_DATE), (2, '13:00:00', 127, 'ACTIVE', CURRENT_DATE),
(2, '14:00:00', 127, 'ACTIVE', CURRENT_DATE), (2, '15:00:00', 127, 'ACTIVE', CURRENT_DATE),
(2, '16:00:00', 127, 'ACTIVE', CURRENT_DATE), (2, '17:00:00', 127, 'ACTIVE', CURRENT_DATE),
(2, '18:00:00', 127, 'ACTIVE', CURRENT_DATE), (2, '19:00:00', 127, 'ACTIVE', CURRENT_DATE),
(2, '20:00:00', 127, 'ACTIVE', CURRENT_DATE), (2, '21:00:00', 127, 'ACTIVE', CURRENT_DATE),
(2, '22:00:00', 127, 'ACTIVE', CURRENT_DATE), (2, '23:00:00', 127, 'ACTIVE', CURRENT_DATE),
(4, '05:00:00', 127, 'ACTIVE', CURRENT_DATE), (4, '06:00:00', 127, 'ACTIVE', CURRENT_DATE),
(4, '07:00:00', 127, 'ACTIVE', CURRENT_DATE), (4, '08:00:00', 127, 'ACTIVE', CURRENT_DATE),
(4, '09:00:00', 127, 'ACTIVE', CURRENT_DATE), (4, '10:00:00', 127, 'ACTIVE', CURRENT_DATE),
(4, '11:00:00', 127, 'ACTIVE', CURRENT_DATE), (4, '12:00:00', 127, 'ACTIVE', CURRENT_DATE),
(4, '13:00:00', 127, 'ACTIVE', CURRENT_DATE), (4, '14:00:00', 127, 'ACTIVE', CURRENT_DATE),
(4, '15:00:00', 127, 'ACTIVE', CURRENT_DATE), (4, '16:00:00', 127, 'ACTIVE', CURRENT_DATE),
(4, '17:00:00', 127, 'ACTIVE', CURRENT_DATE), (4, '18:00:00', 127, 'ACTIVE', CURRENT_DATE),
(4, '19:00:00', 127, 'ACTIVE', CURRENT_DATE), (4, '20:00:00', 127, 'ACTIVE', CURRENT_DATE),
(4, '21:00:00', 127, 'ACTIVE', CURRENT_DATE), (4, '22:00:00', 127, 'ACTIVE', CURRENT_DATE),
(4, '23:00:00', 127, 'ACTIVE', CURRENT_DATE),
(6, '06:30:00', 127, 'ACTIVE', CURRENT_DATE), (6, '08:30:00', 127, 'ACTIVE', CURRENT_DATE),
(6, '10:30:00', 127, 'ACTIVE', CURRENT_DATE), (6, '12:30:00', 127, 'ACTIVE', CURRENT_DATE),
(6, '15:00:00', 127, 'ACTIVE', CURRENT_DATE), (6, '17:00:00', 127, 'ACTIVE', CURRENT_DATE),
(9, '07:00:00', 127, 'ACTIVE', CURRENT_DATE), (9, '09:00:00', 127, 'ACTIVE', CURRENT_DATE),
(9, '19:00:00', 127, 'ACTIVE', CURRENT_DATE), (9, '21:00:00', 127, 'ACTIVE', CURRENT_DATE),
(10, '07:00:00', 127, 'ACTIVE', CURRENT_DATE), (10, '12:00:00', 127, 'ACTIVE', CURRENT_DATE),
(10, '16:00:00', 127, 'ACTIVE', CURRENT_DATE),
-- Route 7 (HN-HP): Bổ sung Lịch chạy tuyến trọng điểm miền Bắc để hỗ trợ tạo chuyến thủ công
(7, '06:00:00', 127, 'ACTIVE', CURRENT_DATE), (7, '08:30:00', 127, 'ACTIVE', CURRENT_DATE),
(7, '13:00:00', 127, 'ACTIVE', CURRENT_DATE), (7, '17:30:00', 127, 'ACTIVE', CURRENT_DATE);

-- ====================================================================================
-- 10.5 ROUTE REGISTRATION (Đăng ký xe chạy tuyến) + SCHEDULE BUS TYPE (Loại xe lịch chạy)
-- ====================================================================================

-- Route Registration: Đăng ký xe hoạt động trên từng tuyến cụ thể
-- Xe 1,2 → SG-DL/DL-SG (Limousine 34), Xe 4,5 → SG-CT/CT-SG (Ghế 47 chỗ), v.v.
INSERT INTO route_bus_registration (bus_id, route_id, status) VALUES
-- Route 1 (SG-DL) + Route 2 (DL-SG): 4 xe Limousine
(1, 1, 'ACTIVE'), (1, 2, 'ACTIVE'),
(2, 1, 'ACTIVE'), (2, 2, 'ACTIVE'),
(8, 1, 'ACTIVE'), (8, 2, 'ACTIVE'),
(15, 1, 'ACTIVE'), (15, 2, 'ACTIVE'),
-- Route 3 (SG-CT) + Route 4 (CT-SG): 4 xe Ghế ngồi + 2 xe Giường nằm
(4, 3, 'ACTIVE'), (4, 4, 'ACTIVE'),
(5, 3, 'ACTIVE'), (5, 4, 'ACTIVE'),
(12, 3, 'ACTIVE'), (12, 4, 'ACTIVE'),
(7, 3, 'ACTIVE'), (7, 4, 'ACTIVE'),
-- Route 5 (SG-VT) + Route 6 (VT-SG): 3 xe
(4, 5, 'ACTIVE'), (4, 6, 'ACTIVE'),
(5, 5, 'ACTIVE'), (5, 6, 'ACTIVE'),
(16, 5, 'ACTIVE'), (16, 6, 'ACTIVE'),
-- Route 7 (HN-HP): 2 xe
(4, 7, 'ACTIVE'), (5, 7, 'ACTIVE'),
-- Route 8 (SG-NT) + Route 9 (NT-SG): 4 xe Giường nằm + VIP
(7, 8, 'ACTIVE'), (7, 9, 'ACTIVE'),
(14, 8, 'ACTIVE'), (14, 9, 'ACTIVE'),
(6, 8, 'ACTIVE'), (6, 9, 'ACTIVE'),
(9, 8, 'ACTIVE'), (9, 9, 'ACTIVE'),
-- Route 10 (DL-NT): 2 xe
(1, 10, 'ACTIVE'), (6, 10, 'ACTIVE');

-- Schedule Bus Type: Loại xe được phép cho từng lịch chạy
-- Route 1 (SG-DL): Chỉ chạy Limousine 34 (bus_type 1)
INSERT INTO schedule_bus_type (trip_schedule_id, bus_type_id, status, reason)
SELECT s.id, 1, 'ACTIVE', 'Limousine cho tuyến SG-DL'
FROM trip_schedule s WHERE s.route_id = 1;

-- Route 2 (DL-SG): Limousine 34
INSERT INTO schedule_bus_type (trip_schedule_id, bus_type_id, status, reason)
SELECT s.id, 1, 'ACTIVE', 'Limousine cho tuyến DL-SG'
FROM trip_schedule s WHERE s.route_id = 2;

-- Route 3 (SG-CT): Ghế ngồi 47 + Giường nằm 40
INSERT INTO schedule_bus_type (trip_schedule_id, bus_type_id, status, reason)
SELECT s.id, 2, 'ACTIVE', 'Ghế ngồi cho tuyến SG-CT'
FROM trip_schedule s WHERE s.route_id = 3;
INSERT INTO schedule_bus_type (trip_schedule_id, bus_type_id, status, reason)
SELECT s.id, 4, 'ACTIVE', 'Giường nằm cho tuyến SG-CT'
FROM trip_schedule s WHERE s.route_id = 3;

-- Route 4 (CT-SG): Ghế ngồi 47 + Giường nằm 40
INSERT INTO schedule_bus_type (trip_schedule_id, bus_type_id, status, reason)
SELECT s.id, 2, 'ACTIVE', 'Ghế ngồi cho tuyến CT-SG'
FROM trip_schedule s WHERE s.route_id = 4;
INSERT INTO schedule_bus_type (trip_schedule_id, bus_type_id, status, reason)
SELECT s.id, 4, 'ACTIVE', 'Giường nằm cho tuyến CT-SG'
FROM trip_schedule s WHERE s.route_id = 4;

-- Route 5,6 (SG-VT, VT-SG): Ghế ngồi 47
INSERT INTO schedule_bus_type (trip_schedule_id, bus_type_id, status, reason)
SELECT s.id, 2, 'ACTIVE', 'Ghế ngồi cho tuyến VT'
FROM trip_schedule s WHERE s.route_id IN (5, 6);

-- Route 7 (HN-HP): Ghế ngồi 47
INSERT INTO schedule_bus_type (trip_schedule_id, bus_type_id, status, reason)
SELECT s.id, 2, 'ACTIVE', 'Ghế ngồi cho tuyến HN-HP'
FROM trip_schedule s WHERE s.route_id = 7;

-- Route 8,9 (SG-NT, NT-SG): Giường nằm 40 + VIP 22
INSERT INTO schedule_bus_type (trip_schedule_id, bus_type_id, status, reason)
SELECT s.id, 4, 'ACTIVE', 'Giường nằm cho tuyến NT'
FROM trip_schedule s WHERE s.route_id IN (8, 9);
INSERT INTO schedule_bus_type (trip_schedule_id, bus_type_id, status, reason)
SELECT s.id, 3, 'ACTIVE', 'VIP cho tuyến NT'
FROM trip_schedule s WHERE s.route_id IN (8, 9);

-- Route 10 (DL-NT): Limousine + VIP
INSERT INTO schedule_bus_type (trip_schedule_id, bus_type_id, status, reason)
SELECT s.id, 1, 'ACTIVE', 'Limousine cho tuyến DL-NT'
FROM trip_schedule s WHERE s.route_id = 10;
INSERT INTO schedule_bus_type (trip_schedule_id, bus_type_id, status, reason)
SELECT s.id, 3, 'ACTIVE', 'VIP cho tuyến DL-NT'
FROM trip_schedule s WHERE s.route_id = 10;

-- ====================================================================================
-- 11. TRIPS (Sinh chuyến tự động)
-- ====================================================================================

-- MỞ RỘNG LOẠT TRIP CHẠY LIÊN TỤC TRONG 45 NGÀY ĐỂ DEMO 
-- Một số chuyến tương lai đặt status=SCHEDULED để có thể test điều phối

INSERT INTO trip (trip_schedule_id, departure_date, actual_departure_time, trip_type, status, bus_id)
SELECT 
    s.id,
    d.day_series::date,
    s.departure_time + (s.id * INTERVAL '1 second'),
    'MAIN',
    CASE 
        WHEN (d.day_series::date + s.departure_time) < (CURRENT_TIMESTAMP - INTERVAL '2 days') AND (s.id * EXTRACT(DOY FROM d.day_series)::int) % 15 = 0 THEN 'CANCELLED'
        WHEN (d.day_series::date + s.departure_time) < CURRENT_TIMESTAMP THEN 'COMPLETED'
        ELSE 'SCHEDULED' -- Tất cả các chuyến Tương Lai & Hôm Nay đều tinh khôi Đang Chờ Phân Công
    END,
    NULL -- Tuyệt đối Không Gán Bừa Bãi Xe, để hệ thống Admin Dispatch thao tác chuẩn từ API
FROM 
    trip_schedule s
CROSS JOIN 
    generate_series((CURRENT_DATE - INTERVAL '10 days')::timestamp, (CURRENT_DATE + INTERVAL '5 days')::timestamp, '1 day'::interval) AS d(day_series)
WHERE 
    s.status = 'ACTIVE';

-- Bỏ qua tạo biên bản bàn giao xe tự động ở đây để tránh vi phạm trigger check_handover_overlap
-- Người dùng có thể tạo thủ công trên giao diện.

-- 8. DRIVER & STAFF DETAILS
-- Chú ý Driver ID Gốc từ 7->16 + Driver Bổ sung từ 17->26
INSERT INTO driver_detail (user_id, department_id, license_number, license_class, license_expiry_date, issue_date)
SELECT 
    u.id, 
    (SELECT id FROM departments WHERE code='OP'), 
    '79A000' || LPAD(u.id::text, 4, '0'), 
    CASE WHEN u.id % 2 = 0 THEN 'FC' ELSE 'E' END, 
    '2030-01-01', 
    '2020-01-01'
FROM users u WHERE u.username LIKE 'driver%';

INSERT INTO staff_detail (user_id, employee_code, department_id, job_title, station_id)
SELECT 
    u.id, 
    'NV' || LPAD(u.id::text, 3, '0'), 
    (SELECT id FROM departments WHERE code='SALES'), 
    'SALES_OFFICER', 
    1 
FROM users u WHERE u.username LIKE 'staff%';



-- 12. TỰ ĐỘNG SINH BUSINESS CODES CHO CÁC BẢNG (Tuân thủ Pháp lý)
UPDATE bus_type SET code = 'BT-' || total_seats::text || '-' || LPAD(id::text, 4, '0') WHERE code IS NULL;

UPDATE pickup_point p 
SET code = 'PP-' || REPLACE(r.code, '-', '') || '-' || LPAD(p.sequence_order::text, 2, '0') 
FROM route r 
WHERE p.route_id = r.id AND p.code IS NULL;

UPDATE trip_schedule s 
SET code = 'SCH-' || REPLACE(r.code, '-', '') || '-' || TO_CHAR(s.departure_time, 'HH24MI') || '-' || LPAD(s.id::text, 2, '0') 
FROM route r 
WHERE s.route_id = r.id AND s.code IS NULL;

UPDATE trip SET code = 'LVC-' || TO_CHAR(departure_date, 'YYYYMMDD') || '-' || LPAD(id::text, 4, '0') WHERE code IS NULL;

-- 13. TẠO CA XE MẶC ĐỊNH CHO TẤT CẢ XE (BUS ASSIGNMENT)
-- Để có dữ liệu bãi đỗ (last depot) khởi tạo dùng cho điều phối.
-- QUAN TRỌNG: Phải có check_in_time + check_out_time, vì query findLastCompletedPerBus()
-- dùng MAX(checkOutTime). Nếu NULL → NULL = NULL → FALSE → không tìm được depot.
INSERT INTO bus_assignment (
    bus_id, start_depot_id, end_depot_id, status,
    scheduled_start, scheduled_end,
    check_in_time, check_out_time
)
SELECT
    id AS bus_id,
    ((id % 8) + 1) AS start_depot_id,   -- Random depot từ 1 đến 8
    ((id % 8) + 1) AS end_depot_id,
    'COMPLETED' AS status,
    (CURRENT_DATE - interval '1 day' + interval '05:00:00'),
    (CURRENT_DATE - interval '1 day' + interval '14:00:00'),
    (CURRENT_DATE - interval '1 day' + interval '05:15:00'),  -- check-in (xuất bãi)
    (CURRENT_DATE - interval '1 day' + interval '13:45:00')   -- check-out (nhập bãi)
FROM bus WHERE id <= 20;

-- ====================================================================================
-- 14. BỔ SUNG KHÁCH HÀNG & DRIVER ASSIGNMENT CHO NGÀY HÔM NAY (Demo Động)
-- ====================================================================================

-- 14.1 Tạo 1 Khách Hàng (Customer) có tài khoản
INSERT INTO users (username, password, full_name, email, phone, status) VALUES
('customer.vip', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Khách VIP', 'vip@bos.vn', '0999999999', 'ACTIVE');
INSERT INTO user_roles (user_id, role) VALUES 
((SELECT id FROM users WHERE username='customer.vip'), 'CUSTOMER');
INSERT INTO customer_detail (user_id, loyalty_points) VALUES 
((SELECT id FROM users WHERE username='customer.vip'), 500);

-- 14.1B Phân công Tài xế chính (MAIN_DRIVER) và Phụ (CO_DRIVER) cho 2 chuyến đầu tiên của ngày hôm nay (CURRENT_DATE)
WITH todays_trips AS (
    SELECT t.id, row_number() OVER (ORDER BY s.departure_time) as rn 
    FROM trip t JOIN trip_schedule s ON t.trip_schedule_id = s.id 
    WHERE t.departure_date = CURRENT_DATE LIMIT 2
)
INSERT INTO driver_assignment (trip_id, driver_id, role, status)
SELECT t.id, 11, 'MAIN_DRIVER', 'PENDING' FROM todays_trips t WHERE t.rn = 1
UNION ALL
SELECT t.id, 12, 'CO_DRIVER', 'PENDING' FROM todays_trips t WHERE t.rn = 1
UNION ALL
SELECT t.id, 13, 'MAIN_DRIVER', 'PENDING' FROM todays_trips t WHERE t.rn = 2
UNION ALL
SELECT t.id, 14, 'CO_DRIVER', 'PENDING' FROM todays_trips t WHERE t.rn = 2
ON CONFLICT (trip_id, driver_id, status) DO NOTHING;

DO $$
DECLARE
    r_trip RECORD;
    v_bus_id BIGINT;
    v_bus_assign BIGINT;
BEGIN
    FOR r_trip IN 
        (SELECT t.id, (t.departure_date + s.departure_time) as dt_start, s.route_id 
        FROM trip t JOIN trip_schedule s ON t.trip_schedule_id = s.id 
        WHERE t.departure_date = CURRENT_DATE AND s.route_id = 3
        ORDER BY s.departure_time, t.id
        LIMIT 10)
        UNION ALL
        (SELECT t.id, (t.departure_date + s.departure_time) as dt_start, s.route_id 
        FROM trip t JOIN trip_schedule s ON t.trip_schedule_id = s.id 
        WHERE t.departure_date = CURRENT_DATE AND s.route_id = 4
        ORDER BY s.departure_time, t.id
        LIMIT 10)
    LOOP
        SELECT bus_id INTO v_bus_id FROM route_bus_registration WHERE route_id = r_trip.route_id AND status = 'ACTIVE' ORDER BY random() LIMIT 1;
        
        IF v_bus_id IS NOT NULL THEN
            INSERT INTO bus_assignment(bus_id, start_depot_id, end_depot_id, scheduled_start, scheduled_end, status)
            VALUES (v_bus_id, 1, 2, r_trip.dt_start - interval '1 hour', r_trip.dt_start + interval '9 hours', 'PENDING')
            RETURNING id INTO v_bus_assign;
            
            UPDATE trip SET bus_id = v_bus_id, bus_assignment_id = v_bus_assign, status = 'APPROVED' WHERE id = r_trip.id;
        END IF;
    END LOOP;
END $$;

-- ======================================================================================
-- 16. TRIP RESOURCE ENRICHMENT (NO MOCK)
-- Mục tiêu:
-- 1) Mọi trip vận hành đều có MAIN_DRIVER + CO_DRIVER.
-- 2) Mọi trip vận hành đều có bus_id + bus_assignment_id.
-- ======================================================================================

-- 16.1 Bổ sung đội ngũ cho trip còn thiếu role chính/phụ
WITH active_drivers AS (
    SELECT u.id AS driver_id,
           row_number() OVER (ORDER BY u.id) AS idx,
           count(*) OVER () AS total
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'DRIVER'
    WHERE u.status = 'ACTIVE'
),
trip_order AS (
    SELECT t.id AS trip_id,
           t.status,
           row_number() OVER (ORDER BY t.departure_date, ts.departure_time, t.id) AS rn
    FROM trip t
    JOIN trip_schedule ts ON ts.id = t.trip_schedule_id
    WHERE t.status IN ('SCHEDULED','APPROVED','RUNNING','COMPLETED')
)
INSERT INTO driver_assignment (
    trip_id,
    driver_id,
    role,
    status,
    created_at,
    updated_at,
    version
)
SELECT
    o.trip_id,
    d.driver_id,
    'MAIN_DRIVER',
    CASE
        WHEN o.status = 'COMPLETED' THEN 'COMPLETED'
        WHEN o.status = 'RUNNING' THEN 'ACTIVE'
        ELSE 'PENDING'
    END,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    0
FROM trip_order o
JOIN active_drivers d
  ON d.idx = ((o.rn - 1) % d.total) + 1
WHERE NOT EXISTS (
    SELECT 1
    FROM driver_assignment da
    WHERE da.trip_id = o.trip_id
      AND da.role = 'MAIN_DRIVER'
      AND da.status IN ('PENDING','ACTIVE','COMPLETED')
)
ON CONFLICT DO NOTHING;

WITH active_drivers AS (
    SELECT u.id AS driver_id,
           row_number() OVER (ORDER BY u.id) AS idx,
           count(*) OVER () AS total
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'DRIVER'
    WHERE u.status = 'ACTIVE'
),
trip_order AS (
    SELECT t.id AS trip_id,
           t.status,
           row_number() OVER (ORDER BY t.departure_date, ts.departure_time, t.id) AS rn
    FROM trip t
    JOIN trip_schedule ts ON ts.id = t.trip_schedule_id
    WHERE t.status IN ('SCHEDULED','APPROVED','RUNNING','COMPLETED')
)
INSERT INTO driver_assignment (
    trip_id,
    driver_id,
    role,
    status,
    created_at,
    updated_at,
    version
)
SELECT
    o.trip_id,
    d.driver_id,
    'CO_DRIVER',
    CASE
        WHEN o.status = 'COMPLETED' THEN 'COMPLETED'
        WHEN o.status = 'RUNNING' THEN 'ACTIVE'
        ELSE 'PENDING'
    END,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    0
FROM trip_order o
JOIN active_drivers d
  ON d.idx = ((o.rn) % d.total) + 1
WHERE NOT EXISTS (
    SELECT 1
    FROM driver_assignment da
    WHERE da.trip_id = o.trip_id
      AND da.role = 'CO_DRIVER'
      AND da.status IN ('PENDING','ACTIVE','COMPLETED')
)
ON CONFLICT DO NOTHING;

-- 16.2 Lập lịch bus và gắn trip vào bus_assignment (dùng xe dedicated cho trip còn thiếu)
DO $$
DECLARE
    r RECORD;
    v_new_bus_id BIGINT;
    v_assignment_id BIGINT;
    v_start_ts TIMESTAMP;
    v_end_ts TIMESTAMP;
    v_duration_hours NUMERIC;
    v_plate TEXT;
    v_idx INT := 0;
BEGIN
    FOR r IN
        SELECT t.id AS trip_id,
               t.status,
               ts.departure_time,
               t.departure_date,
               COALESCE(rt.duration_hours, 8)::numeric AS duration_hours,
               COALESCE(bt.id, 1) AS preferred_bus_type_id
        FROM trip t
        JOIN trip_schedule ts ON ts.id = t.trip_schedule_id
        JOIN route rt ON rt.id = ts.route_id
        LEFT JOIN bus b ON b.id = t.bus_id
        LEFT JOIN bus_type bt ON bt.id = b.bus_type_id
        WHERE t.status IN ('SCHEDULED','APPROVED','RUNNING','COMPLETED')
          AND (t.bus_id IS NULL OR t.bus_assignment_id IS NULL)
        ORDER BY t.departure_date, ts.departure_time, t.id
    LOOP
        v_idx := v_idx + 1;
        v_duration_hours := COALESCE(r.duration_hours, 8);
        v_start_ts := (r.departure_date::timestamp + r.departure_time) - INTERVAL '1 hour';
        v_end_ts := (r.departure_date::timestamp + r.departure_time)
                    + (v_duration_hours * INTERVAL '1 hour')
                    + INTERVAL '2 hour';

        v_plate := '97B-' || LPAD((500000 + v_idx)::text, 6, '0');

        INSERT INTO bus (
            license_plate,
            bus_type_id,
            manufacturing_year,
            insurance_expiry_date,
            registration_expiry_date,
            status,
            created_at,
            updated_at,
            version
        ) VALUES (
            v_plate,
            r.preferred_bus_type_id,
            2025,
            CURRENT_DATE + INTERVAL '3 years',
            CURRENT_DATE + INTERVAL '3 years',
            'ACTIVE',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            0
        ) RETURNING id INTO v_new_bus_id;

        UPDATE trip
        SET bus_id = v_new_bus_id
        WHERE id = r.trip_id;

        INSERT INTO bus_assignment (
            bus_id,
            start_depot_id,
            end_depot_id,
            scheduled_start,
            scheduled_end,
            status,
            created_at,
            updated_at,
            version
        ) VALUES (
            v_new_bus_id,
            NULL,
            NULL,
            v_start_ts,
            v_end_ts,
            CASE
                WHEN r.status = 'COMPLETED' THEN 'COMPLETED'
                WHEN r.status = 'RUNNING' THEN 'DEPARTED'
                ELSE 'PENDING'
            END,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            0
        ) RETURNING id INTO v_assignment_id;

        UPDATE trip
        SET bus_assignment_id = v_assignment_id
        WHERE id = r.trip_id;
    END LOOP;
END $$;

-- ======================================================================================
-- 15. REPORTS DEMO DATA (DETERMINISTIC - NO RANDOM)
-- Mục tiêu: luôn có dữ liệu thật cho dashboard reports sau khi Flyway chạy V999
-- ======================================================================================

-- 15.1 Chuẩn hóa seat_map cho tất cả bus_type (Tầng 1 = A01..A(n/2), Tầng 2 = B01..B(n/2))
WITH generated AS (
    SELECT
        bt.id,
        jsonb_agg(
            jsonb_build_object(
                'seat_number', CASE
                    WHEN gs <= (bt.total_seats / 2)
                        THEN 'A' || LPAD(gs::text, 2, '0')
                    ELSE
                        'B' || LPAD((gs - bt.total_seats / 2)::text, 2, '0')
                END,
                'code', CASE
                    WHEN gs <= (bt.total_seats / 2)
                        THEN 'A' || LPAD(gs::text, 2, '0')
                    ELSE
                        'B' || LPAD((gs - bt.total_seats / 2)::text, 2, '0')
                END,
                'type', CASE bt.id
                    WHEN 1 THEN 'BED'
                    WHEN 2 THEN 'SEAT'
                    WHEN 3 THEN 'VIP'
                    WHEN 4 THEN 'SLEEPER'
                    ELSE 'SEAT'
                END
            ) ORDER BY gs
        ) AS seat_map
    FROM bus_type bt
    CROSS JOIN generate_series(1, bt.total_seats) gs
    GROUP BY bt.id
)
UPDATE bus_type bt
SET seat_map = g.seat_map
FROM generated g
WHERE bt.id = g.id;

-- 15.2 Repair deterministic: gán bus cho trip COMPLETED chưa có bus_id (30 ngày gần nhất)
DO $$
DECLARE
    v_bus_ids BIGINT[];
    v_bus_count INT;
    v_idx INT := 0;
    r RECORD;
BEGIN
    SELECT array_agg(id ORDER BY id) INTO v_bus_ids
    FROM bus
    WHERE status = 'ACTIVE';

    v_bus_count := COALESCE(array_length(v_bus_ids, 1), 0);
    IF v_bus_count = 0 THEN
        RETURN;
    END IF;

    FOR r IN
        SELECT id
        FROM trip
        WHERE departure_date BETWEEN CURRENT_DATE - 30 AND CURRENT_DATE
          AND status = 'COMPLETED'
          AND bus_id IS NULL
        ORDER BY departure_date, id
    LOOP
        v_idx := v_idx + 1;
        UPDATE trip
        SET bus_id = v_bus_ids[((v_idx - 1) % v_bus_count) + 1]
        WHERE id = r.id;
    END LOOP;
END $$;

-- 15.3 Cleanup seed reports theo prefix trong ngày (idempotent)
DELETE FROM refund_transactions r
USING booking b
WHERE b.id = r.booking_id
  AND b.code LIKE ('RPTREAL-%-' || to_char(CURRENT_DATE, 'YYYYMMDD'));

DELETE FROM ticket t
USING booking b
WHERE b.id = t.booking_id
  AND b.code LIKE ('RPTREAL-%-' || to_char(CURRENT_DATE, 'YYYYMMDD'));

DELETE FROM booking
WHERE code LIKE ('RPTREAL-%-' || to_char(CURRENT_DATE, 'YYYYMMDD'));

-- 15.4 Build deterministic plan và insert booking/ticket/refund
DROP TABLE IF EXISTS tmp_rptreal_plan;
CREATE TEMP TABLE tmp_rptreal_plan AS
WITH trip_pool AS (
    SELECT
        t.id AS trip_id,
        t.departure_date,
        row_number() OVER (ORDER BY t.departure_date DESC, t.id DESC) AS rn
    FROM trip t
    JOIN bus bs ON bs.id = t.bus_id
    JOIN bus_type bt ON bt.id = bs.bus_type_id
    WHERE t.departure_date BETWEEN CURRENT_DATE - 30 AND CURRENT_DATE
      AND t.status IN ('SCHEDULED', 'APPROVED', 'RUNNING', 'COMPLETED')
      AND bt.seat_map IS NOT NULL
      AND jsonb_array_length(bt.seat_map) > 0
    LIMIT 900
),
seed_plan AS (
    SELECT
        tp.trip_id,
        tp.rn,
        'RPTREAL-' || tp.trip_id || '-' || to_char(CURRENT_DATE, 'YYYYMMDD') AS code,
        CASE
            WHEN tp.rn % 12 = 0 THEN 'CANCELLED'
            WHEN tp.rn % 9 = 0 THEN 'PENDING'
            ELSE 'CONFIRMED'
        END AS booking_status,
        CASE
            WHEN tp.rn % 3 = 0 THEN 'APP'
            WHEN tp.rn % 3 = 1 THEN 'WEB'
            ELSE 'COUNTER'
        END AS channel,
        CASE WHEN tp.rn % 2 = 0 THEN 'VNPAY' ELSE 'CASH' END AS payment_method,
        CASE
            WHEN tp.rn % 3 = 0 THEN (320000 + (tp.rn % 5) * 20000)::numeric(15,2)
            WHEN tp.rn % 3 = 1 THEN (240000 + (tp.rn % 5) * 15000)::numeric(15,2)
            ELSE (180000 + (tp.rn % 5) * 12000)::numeric(15,2)
        END AS amount,
        CASE
            WHEN tp.rn % 3 = 0 THEN 'BUSINESS'
            WHEN tp.rn % 3 = 1 THEN 'SLEEPER'
            ELSE 'ECONOMY'
        END AS seat_class
    FROM trip_pool tp
),
seat_candidates AS (
    SELECT 'B' || lpad(gs::text, 2, '0') AS seat_number, 'BUSINESS'::text AS seat_class FROM generate_series(1, 99) gs
    UNION ALL
    SELECT 'L' || lpad(gs::text, 2, '0') AS seat_number, 'SLEEPER'::text AS seat_class FROM generate_series(1, 99) gs
    UNION ALL
    SELECT 'E' || lpad(gs::text, 2, '0') AS seat_number, 'ECONOMY'::text AS seat_class FROM generate_series(1, 99) gs
)
SELECT
    sp.trip_id,
    sp.rn,
    sp.code,
    sp.booking_status,
    sp.channel,
    sp.payment_method,
    sp.amount,
    sp.seat_class,
    picked.seat_number
FROM seed_plan sp
JOIN LATERAL (
    SELECT sc.seat_number
    FROM seat_candidates sc
    WHERE sc.seat_class = sp.seat_class
      AND NOT EXISTS (
          SELECT 1
          FROM ticket t
          WHERE t.trip_id = sp.trip_id
            AND upper(trim(t.seat_number)) = upper(trim(sc.seat_number))
      )
    ORDER BY sc.seat_number
    LIMIT 1
) picked ON true;

INSERT INTO booking (
    user_id, guest_name, guest_phone, guest_email, confirmed_by_id,
    code, total_amount, channel, payment_method, status, expired_at
)
SELECT
    NULL,
    'Khach Real ' || p.rn,
    '09' || lpad((70000000 + p.rn)::text, 8, '0'),
    'real' || p.rn || '@example.com',
    1, -- Admin xác nhận TT (seed data demo)
    p.code,
    p.amount,
    p.channel,
    p.payment_method,
    p.booking_status,
    CURRENT_TIMESTAMP + INTERVAL '2 day'
FROM tmp_rptreal_plan p
ON CONFLICT (code) DO NOTHING;

INSERT INTO ticket (
    booking_id, trip_id, fare_config_id, pickup_point_id, dropoff_point_id,
    seat_number, price, vat_rate, is_checked_in, status
)
SELECT
    b.id,
    p.trip_id,
    NULL,
    NULL,
    NULL,
    p.seat_number,
    b.total_amount,
    0.08,
    FALSE,
    CASE
        WHEN b.status = 'CANCELLED' THEN 'CANCELLED'
        WHEN b.status = 'PENDING' THEN 'PENDING'
        ELSE 'CONFIRMED'
    END
FROM tmp_rptreal_plan p
JOIN booking b ON b.code = p.code
ON CONFLICT (trip_id, seat_number) WHERE status NOT IN ('CANCELLED', 'EXPIRED') DO NOTHING;

INSERT INTO refund_transactions (booking_id, ticket_id, amount, refund_rate, refund_category, refunded_by, status)
SELECT
    b.id,
    t.id,
    round(t.price * 0.5, 2),
    0.50,
    'CUSTOMER_CANCEL',
    1,
    'SUCCESS'
FROM booking b
JOIN ticket t ON t.booking_id = b.id
WHERE b.code LIKE ('RPTREAL-%-' || to_char(CURRENT_DATE, 'YYYYMMDD'))
  AND b.status = 'CANCELLED'
  AND NOT EXISTS (
      SELECT 1 FROM refund_transactions r WHERE r.ticket_id = t.id
  );

INSERT INTO refund_transactions (booking_id, ticket_id, amount, refund_rate, refund_category, refunded_by, status)
SELECT
    b.id,
    t.id,
    round(t.price * 0.1, 2),
    0.10,
    'SERVICE_ADJUSTMENT',
    1,
    'SUCCESS'
FROM booking b
JOIN ticket t ON t.booking_id = b.id
WHERE b.code LIKE ('RPTREAL-%-' || to_char(CURRENT_DATE, 'YYYYMMDD'))
  AND b.status = 'CONFIRMED'
  AND (b.id % 17 = 0)
  AND NOT EXISTS (
      SELECT 1 FROM refund_transactions r WHERE r.ticket_id = t.id
  );

DO $$
DECLARE
    v_trip_id BIGINT;
    v_user_id BIGINT;
    v_fare_config_id BIGINT;
    v_booking_id BIGINT;
BEGIN
    SELECT id INTO v_trip_id FROM trip WHERE departure_date = (CURRENT_DATE)::date LIMIT 1;
    SELECT f.id INTO v_fare_config_id FROM fare_config f JOIN trip t ON t.id = v_trip_id JOIN trip_schedule ts ON t.trip_schedule_id = ts.id WHERE f.route_id = ts.route_id LIMIT 1;
    SELECT id INTO v_user_id FROM users WHERE username='customer.vip';
    IF v_trip_id IS NULL OR v_fare_config_id IS NULL THEN RETURN; END IF;
    INSERT INTO booking (user_id, guest_name, guest_phone, guest_email, code, total_amount, channel, status, expired_at)
    VALUES (v_user_id, 'Khách VIP', '0999999999', 'vip@bos.vn', 'BOS-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-VIP-TD', 350000, 'APP', 'CONFIRMED', CURRENT_TIMESTAMP + interval '1 day') RETURNING id INTO v_booking_id;
    INSERT INTO ticket (booking_id, trip_id, fare_config_id, seat_number, price, status) VALUES (v_booking_id, v_trip_id, v_fare_config_id, 'A01', 350000, 'CONFIRMED')
    ON CONFLICT (trip_id, seat_number) WHERE status NOT IN ('CANCELLED', 'EXPIRED') DO NOTHING;
END $$;

-- 14.2 Phân công Tài xế chính (MAIN_DRIVER) và Phụ (CO_DRIVER) cho 2 chuyến đầu tiên của ngày mai (CURRENT_DATE + 1)
-- Bỏ qua ATTENDANT theo yêu cầu
WITH tomorrows_trips AS (
    SELECT t.id, row_number() OVER (ORDER BY s.departure_time) as rn 
    FROM trip t JOIN trip_schedule s ON t.trip_schedule_id = s.id 
    WHERE t.departure_date = CURRENT_DATE + 1 LIMIT 2
)
INSERT INTO driver_assignment (trip_id, driver_id, role, status)
SELECT t.id, 7, 'MAIN_DRIVER', 'PENDING' FROM tomorrows_trips t WHERE t.rn = 1
UNION ALL
SELECT t.id, 8, 'CO_DRIVER', 'PENDING' FROM tomorrows_trips t WHERE t.rn = 1
UNION ALL
SELECT t.id, 9, 'MAIN_DRIVER', 'PENDING' FROM tomorrows_trips t WHERE t.rn = 2
UNION ALL
SELECT t.id, 10, 'CO_DRIVER', 'PENDING' FROM tomorrows_trips t WHERE t.rn = 2
ON CONFLICT (trip_id, driver_id, status) DO NOTHING;

-- Update lại Bus và Status cho 2 chuyến demo này (Mô phỏng thao tác Dispatch thành công)
DO $$
DECLARE
    r_trip RECORD;
    v_bus_id BIGINT;
    v_bus_assign BIGINT;
BEGIN
    FOR r_trip IN 
        (SELECT t.id, (t.departure_date + s.departure_time) as dt_start, s.route_id 
        FROM trip t JOIN trip_schedule s ON t.trip_schedule_id = s.id 
        WHERE t.departure_date = CURRENT_DATE + 1 AND s.route_id = 3
        ORDER BY s.departure_time, t.id
        LIMIT 10)
        UNION ALL
        (SELECT t.id, (t.departure_date + s.departure_time) as dt_start, s.route_id 
        FROM trip t JOIN trip_schedule s ON t.trip_schedule_id = s.id 
        WHERE t.departure_date = CURRENT_DATE + 1 AND s.route_id = 4
        ORDER BY s.departure_time, t.id
        LIMIT 10)
    LOOP
        SELECT bus_id INTO v_bus_id FROM route_bus_registration WHERE route_id = r_trip.route_id AND status = 'ACTIVE' ORDER BY random() LIMIT 1;
        
        IF v_bus_id IS NOT NULL THEN
            INSERT INTO bus_assignment(bus_id, start_depot_id, end_depot_id, scheduled_start, scheduled_end, status)
            VALUES (v_bus_id, 1, 2, r_trip.dt_start - interval '1 hour', r_trip.dt_start + interval '9 hours', 'PENDING')
            RETURNING id INTO v_bus_assign;
            
            UPDATE trip SET bus_id = v_bus_id, bus_assignment_id = v_bus_assign, status = 'APPROVED' WHERE id = r_trip.id;
        END IF;
    END LOOP;
END $$;


-- 14.3 Tạo Booking cho Chuyến xe đầu tiên của ngày mai
-- Chọn chuyến đầu ngày mai
DO $$
DECLARE
    v_trip_id BIGINT;
    v_user_id BIGINT;
    v_fare_config_id BIGINT;
    v_booking_id BIGINT;
BEGIN
    -- Lấy 1 chuyến xuất phát vào ngày mai
    SELECT id INTO v_trip_id FROM trip WHERE departure_date = (CURRENT_DATE + 1)::date LIMIT 1;
    
    -- Lấy fare_config_id phù hợp với chuyến đó
    SELECT f.id INTO v_fare_config_id 
    FROM fare_config f 
    JOIN trip t ON t.id = v_trip_id
    JOIN trip_schedule ts ON t.trip_schedule_id = ts.id
    WHERE f.route_id = ts.route_id LIMIT 1;
    
    -- Lấy UserID của khách VIP vừa tạo
    SELECT id INTO v_user_id FROM users WHERE username='customer.vip';
    
    -- Bỏ qua nếu ko tìm được Trip hoặc Fare (Safety check)
    IF v_trip_id IS NULL OR v_fare_config_id IS NULL THEN
        RETURN;
    END IF;

    -- BOOKING 1: Khách hàng CÓ tài khoản (User ID)
    INSERT INTO booking (user_id, guest_name, guest_phone, guest_email, code, total_amount, channel, status, expired_at)
    VALUES (v_user_id, 'Khách VIP', '0999999999', 'vip@bos.vn', 'BOS-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-VIP', 350000, 'APP', 'CONFIRMED', CURRENT_TIMESTAMP + interval '1 day')
    RETURNING id INTO v_booking_id;
    
    INSERT INTO ticket (booking_id, trip_id, fare_config_id, seat_number, price, status)
    VALUES (v_booking_id, v_trip_id, v_fare_config_id, 'A01', 350000, 'CONFIRMED')
    ON CONFLICT (trip_id, seat_number) WHERE status NOT IN ('CANCELLED', 'EXPIRED') DO NOTHING;

    -- BOOKING 2: Khách vãng lai (Ẩn danh)
    INSERT INTO booking (guest_name, guest_phone, guest_email, code, total_amount, channel, status, expired_at)
    VALUES ('Khách Lẻ 1', '0901234567', 'le1@gmail.com', 'BOS-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-LE1', 700000, 'WEB', 'CONFIRMED', CURRENT_TIMESTAMP + interval '1 day')
    RETURNING id INTO v_booking_id;
    
    INSERT INTO ticket (booking_id, trip_id, fare_config_id, seat_number, price, status)
    VALUES 
    (v_booking_id, v_trip_id, v_fare_config_id, 'A02', 350000, 'CONFIRMED'),
    (v_booking_id, v_trip_id, v_fare_config_id, 'A03', 350000, 'CONFIRMED')
    ON CONFLICT (trip_id, seat_number) WHERE status NOT IN ('CANCELLED', 'EXPIRED') DO NOTHING;
    
    -- BOOKING 3: Khách Hủy (Guest)
    INSERT INTO booking (guest_name, guest_phone, guest_email, code, total_amount, channel, status, expired_at)
    VALUES ('Khách Lẻ Hủy', '0901234568', 'le2@gmail.com', 'BOS-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-LE2-CANC', 350000, 'WEB', 'CANCELLED', CURRENT_TIMESTAMP + interval '1 day')
    RETURNING id INTO v_booking_id;
    
    INSERT INTO ticket (booking_id, trip_id, fare_config_id, seat_number, price, status)
    VALUES (v_booking_id, v_trip_id, v_fare_config_id, 'A04', 350000, 'CANCELLED')
    ON CONFLICT (trip_id, seat_number) WHERE status NOT IN ('CANCELLED', 'EXPIRED') DO NOTHING;

    -- BOOKING 4: Chờ thanh toán (Guest)
    INSERT INTO booking (guest_name, guest_phone, guest_email, code, total_amount, channel, status, expired_at)
    VALUES ('Khách Lẻ Pending', '0901234569', 'le3@gmail.com', 'BOS-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-LE3-PEND', 700000, 'WEB', 'PENDING', CURRENT_TIMESTAMP + interval '1 day')
    RETURNING id INTO v_booking_id;
    
    INSERT INTO ticket (booking_id, trip_id, fare_config_id, seat_number, price, status)
    VALUES 
    (v_booking_id, v_trip_id, v_fare_config_id, 'A05', 350000, 'ACTIVE'),
    (v_booking_id, v_trip_id, v_fare_config_id, 'A06', 350000, 'ACTIVE')
    ON CONFLICT (trip_id, seat_number) WHERE status NOT IN ('CANCELLED', 'EXPIRED') DO NOTHING;

    -- BOOKING 5: Thanh toán tại quầy (Guest)
    INSERT INTO booking (guest_name, guest_phone, guest_email, code, total_amount, channel, payment_method, status, confirmed_by_id, expired_at)
    VALUES ('Khách Lẻ Quầy', '0901234570', 'le4@gmail.com', 'BOS-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-LE4-QUAY', 350000, 'COUNTER', 'CASH', 'CONFIRMED', 2, CURRENT_TIMESTAMP + interval '1 day')
    RETURNING id INTO v_booking_id;
    
    INSERT INTO ticket (booking_id, trip_id, fare_config_id, seat_number, price, status)
    VALUES (v_booking_id, v_trip_id, v_fare_config_id, 'A07', 350000, 'CONFIRMED')
    ON CONFLICT (trip_id, seat_number) WHERE status NOT IN ('CANCELLED', 'EXPIRED') DO NOTHING;
    
END $$;

-- 17. Tự động sinh Booking & Ticket cho các chuyến xe APPROVED trong hôm nay và ngày mai
-- Yêu cầu: Ít nhất 20 vé mỗi chuyến, chia đều thành nhiều booking (tối đa 5 vé/1 booking)
DO $$
DECLARE
    r_trip RECORD;
    v_fare_config_id BIGINT;
    v_total_tickets INT;
    v_tickets_for_booking INT;
    v_booking_id BIGINT;
    v_seat_number VARCHAR(10);
    v_guest_suffix INT := 1;
    -- Cursor to iterate through available seats (Tầng 1 = A01..A(n/2), Tầng 2 = B01..B(n/2))
    c_seats CURSOR (c_trip_id BIGINT) FOR
        SELECT CASE
            WHEN gs <= (bt.total_seats / 2)
                THEN 'A' || LPAD(gs::text, 2, '0')
            ELSE
                'B' || LPAD((gs - bt.total_seats / 2)::text, 2, '0')
        END AS seat
        FROM trip t
        JOIN bus b ON t.bus_id = b.id
        JOIN bus_type bt ON b.bus_type_id = bt.id
        CROSS JOIN generate_series(1, bt.total_seats) gs
        WHERE t.id = c_trip_id
          AND NOT EXISTS (
              SELECT 1 FROM ticket tk
              WHERE tk.trip_id = c_trip_id
                AND tk.seat_number = CASE
                    WHEN gs <= (bt.total_seats / 2)
                        THEN 'A' || LPAD(gs::text, 2, '0')
                    ELSE
                        'B' || LPAD((gs - bt.total_seats / 2)::text, 2, '0')
                END
                AND tk.status <> 'CANCELLED'
          )
        ORDER BY random();
BEGIN
    FOR r_trip IN
        SELECT t.id, t.bus_id, ts.route_id, t.departure_date
        FROM trip t
        JOIN trip_schedule ts ON t.trip_schedule_id = ts.id
        WHERE t.status = 'APPROVED' 
          AND t.departure_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + 1)
        ORDER BY t.departure_date, t.id
    LOOP
        SELECT f.id INTO v_fare_config_id 
        FROM fare_config f 
        WHERE f.route_id = r_trip.route_id LIMIT 1;
        
        IF v_fare_config_id IS NULL THEN
            CONTINUE;
        END IF;

        v_total_tickets := 0;
        
        OPEN c_seats(r_trip.id);
        
        WHILE v_total_tickets < 20 LOOP
            v_tickets_for_booking := floor(random() * 5 + 1)::int;
            
            IF (v_total_tickets + v_tickets_for_booking) > 20 THEN
                v_tickets_for_booking := 20 - v_total_tickets;
            END IF;

            INSERT INTO booking (guest_name, guest_phone, guest_email, code, total_amount, channel, status, expired_at)
            VALUES (
                'Khách Nhóm ' || v_guest_suffix, 
                '095' || LPAD(v_guest_suffix::text, 7, '0'), 
                'nhom' || v_guest_suffix || '@gmail.com', 
                'BOS-' || TO_CHAR(r_trip.departure_date, 'YYYYMMDD') || '-T' || r_trip.id || '-G' || v_guest_suffix, 
                350000 * v_tickets_for_booking, 
                CASE WHEN (v_guest_suffix % 2 = 0) THEN 'WEB' ELSE 'APP' END, 
                'CONFIRMED', 
                CURRENT_TIMESTAMP + interval '1 day'
            ) RETURNING id INTO v_booking_id;

            v_guest_suffix := v_guest_suffix + 1;

            FOR i IN 1..v_tickets_for_booking LOOP
                FETCH c_seats INTO v_seat_number;
                IF NOT FOUND THEN
                    EXIT;
                END IF;
                
                INSERT INTO ticket (booking_id, trip_id, fare_config_id, seat_number, price, status)
                VALUES (v_booking_id, r_trip.id, v_fare_config_id, v_seat_number, 350000, 'CONFIRMED')
                ON CONFLICT (trip_id, seat_number) WHERE status NOT IN ('CANCELLED', 'EXPIRED') DO NOTHING;
            END LOOP;
            
            IF NOT FOUND THEN
                EXIT;
            END IF;

            v_total_tickets := v_total_tickets + v_tickets_for_booking;
        END LOOP;
        
        CLOSE c_seats;
    END LOOP;
END $$;


-- 18. Tự động sinh 5 chuyến xe "Demo 5 Vùng Khẩn Cấp" (Trip Change Zones)
DO $$
DECLARE
    r_trip1 RECORD; r_trip2 RECORD; r_trip3 RECORD; r_trip4 RECORD; r_trip5 RECORD;
    v_drv1 BIGINT; v_drv2 BIGINT; v_drv3 BIGINT; v_drv4 BIGINT; v_drv5 BIGINT; v_drv6 BIGINT; v_drv7 BIGINT;
    v_bus1 BIGINT; v_bus2 BIGINT; v_bus3 BIGINT; v_bus4 BIGINT; v_bus5 BIGINT;
BEGIN
    SELECT user_id INTO v_drv1 FROM driver_detail ORDER BY user_id LIMIT 1 OFFSET 0;
    SELECT user_id INTO v_drv2 FROM driver_detail ORDER BY user_id LIMIT 1 OFFSET 1;
    SELECT user_id INTO v_drv3 FROM driver_detail ORDER BY user_id LIMIT 1 OFFSET 2;
    SELECT user_id INTO v_drv4 FROM driver_detail ORDER BY user_id LIMIT 1 OFFSET 3;
    SELECT user_id INTO v_drv5 FROM driver_detail ORDER BY user_id LIMIT 1 OFFSET 4;
    SELECT user_id INTO v_drv6 FROM driver_detail ORDER BY user_id LIMIT 1 OFFSET 5;
    SELECT user_id INTO v_drv7 FROM driver_detail ORDER BY user_id LIMIT 1 OFFSET 6;

    SELECT id, bus_id INTO r_trip1 FROM trip WHERE departure_date = CURRENT_DATE AND status = 'APPROVED' ORDER BY id LIMIT 1 OFFSET 0;
    SELECT id, bus_id INTO r_trip2 FROM trip WHERE departure_date = CURRENT_DATE AND status = 'APPROVED' ORDER BY id LIMIT 1 OFFSET 1;
    SELECT id, bus_id INTO r_trip3 FROM trip WHERE departure_date = CURRENT_DATE AND status = 'APPROVED' ORDER BY id LIMIT 1 OFFSET 2;
    SELECT id, bus_id INTO r_trip4 FROM trip WHERE departure_date = CURRENT_DATE AND status = 'APPROVED' ORDER BY id LIMIT 1 OFFSET 3;
    SELECT id, bus_id INTO r_trip5 FROM trip WHERE departure_date = CURRENT_DATE AND status = 'APPROVED' ORDER BY id LIMIT 1 OFFSET 4;

    IF r_trip5.id IS NULL OR v_drv5 IS NULL THEN
        RETURN;
    END IF;

    DELETE FROM driver_assignment WHERE trip_id IN (r_trip1.id, r_trip2.id, r_trip3.id, r_trip4.id, r_trip5.id);
    DELETE FROM vehicle_handover WHERE trip_id IN (r_trip1.id, r_trip2.id, r_trip3.id, r_trip4.id, r_trip5.id);

    DELETE FROM driver_assignment WHERE trip_id IN (r_trip1.id, r_trip2.id, r_trip3.id, r_trip4.id, r_trip5.id);
    DELETE FROM vehicle_handover WHERE trip_id IN (r_trip1.id, r_trip2.id, r_trip3.id, r_trip4.id, r_trip5.id);

    -- Lấy 5 chiếc xe hoàn toàn trống lịch trong ngày hôm nay (thuần toán học để pass Trigger)
    SELECT id INTO v_bus1 FROM bus WHERE status = 'ACTIVE' AND id NOT IN (SELECT bus_id FROM trip WHERE departure_date = (CURRENT_DATE) AND bus_id IS NOT NULL) OFFSET 0 LIMIT 1;
    SELECT id INTO v_bus2 FROM bus WHERE status = 'ACTIVE' AND id NOT IN (SELECT bus_id FROM trip WHERE departure_date = (CURRENT_DATE) AND bus_id IS NOT NULL) OFFSET 1 LIMIT 1;
    SELECT id INTO v_bus3 FROM bus WHERE status = 'ACTIVE' AND id NOT IN (SELECT bus_id FROM trip WHERE departure_date = (CURRENT_DATE) AND bus_id IS NOT NULL) OFFSET 2 LIMIT 1;
    SELECT id INTO v_bus4 FROM bus WHERE status = 'ACTIVE' AND id NOT IN (SELECT bus_id FROM trip WHERE departure_date = (CURRENT_DATE) AND bus_id IS NOT NULL) OFFSET 3 LIMIT 1;
    SELECT id INTO v_bus5 FROM bus WHERE status = 'ACTIVE' AND id NOT IN (SELECT bus_id FROM trip WHERE departure_date = (CURRENT_DATE) AND bus_id IS NOT NULL) OFFSET 4 LIMIT 1;

    -- Setup Zone 1 (STANDARD: T + 90m)
    UPDATE trip SET actual_departure_time = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::time + INTERVAL '90 minutes', status = 'APPROVED', bus_id = v_bus1 WHERE id = r_trip1.id;
    INSERT INTO driver_assignment (trip_id, driver_id, role, status) VALUES (r_trip1.id, v_drv1, 'MAIN_DRIVER', 'ACTIVE');

    -- Setup Zone 2 (URGENT: T + 30m)
    UPDATE trip SET actual_departure_time = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::time + INTERVAL '30 minutes', status = 'APPROVED', bus_id = v_bus2 WHERE id = r_trip2.id;
    INSERT INTO driver_assignment (trip_id, driver_id, role, status) VALUES (r_trip2.id, v_drv2, 'MAIN_DRIVER', 'ACTIVE');

    -- Setup Zone 3 (CRITICAL: T + 8m)
    UPDATE trip SET actual_departure_time = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::time + INTERVAL '8 minutes', status = 'APPROVED', bus_id = v_bus3 WHERE id = r_trip3.id;
    INSERT INTO driver_assignment (trip_id, driver_id, role, status) VALUES (r_trip3.id, v_drv3, 'MAIN_DRIVER', 'ACTIVE');

    -- Setup Zone 4 (DEPARTED: Running)
    UPDATE trip SET actual_departure_time = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::time - INTERVAL '30 minutes', status = 'RUNNING', bus_id = v_bus4 WHERE id = r_trip4.id;
    INSERT INTO driver_assignment (trip_id, driver_id, role, status) VALUES (r_trip4.id, v_drv4, 'MAIN_DRIVER', 'ACTIVE');
    INSERT INTO driver_assignment (trip_id, driver_id, role, status) VALUES (r_trip4.id, v_drv6, 'CO_DRIVER', 'ACTIVE');
    INSERT INTO vehicle_handover (trip_id, bus_id, driver_id, is_emergency, handover_time, status) 
        VALUES (r_trip4.id, v_bus4, v_drv4, false, CURRENT_TIMESTAMP - INTERVAL '30 minutes', 'IN_PROGRESS');

    -- Setup Zone 5 (MID_ROUTE: Running)
    UPDATE trip SET actual_departure_time = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::time - INTERVAL '60 minutes', status = 'RUNNING', bus_id = v_bus5 WHERE id = r_trip5.id;
    INSERT INTO driver_assignment (trip_id, driver_id, role, status) VALUES (r_trip5.id, v_drv5, 'MAIN_DRIVER', 'ACTIVE');
    INSERT INTO driver_assignment (trip_id, driver_id, role, status) VALUES (r_trip5.id, v_drv7, 'CO_DRIVER', 'ACTIVE');
    INSERT INTO vehicle_handover (trip_id, bus_id, driver_id, is_emergency, handover_time, status) 
        VALUES (r_trip5.id, v_bus5, v_drv5, false, CURRENT_TIMESTAMP - INTERVAL '60 minutes', 'IN_PROGRESS');

    -- ==================== SEED: BIÊN BẢN SỰ CỐ & YÊU CẦU PHÂN CÔNG LẠI ====================
    -- Xóa records cũ (nếu có)
    DELETE FROM trip_change_request;

    -- 1. Vùng STANDARD (> 60 phút) — Đã duyệt: Đổi tài xế do giấy phép hết hạn
    INSERT INTO trip_change_request (trip_id, change_type, old_driver_id, new_driver_id, urgency_zone, request_reason, status, is_emergency, created_by, approved_by, created_at, updated_at)
    VALUES (r_trip1.id, 'REPLACE_DRIVER', v_drv1, v_drv2, 'STANDARD',
        'GPLX tài xế hết hạn ngày 18/04/2026. Thay thế bằng tài xế dự phòng theo quy trình.',
        'APPROVED', false, 1, 1, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour 50 minutes');

    -- 2. Vùng URGENT (15-60 phút) — Chờ duyệt: Tài xế xin nghỉ đột xuất
    INSERT INTO trip_change_request (trip_id, change_type, old_driver_id, new_driver_id, urgency_zone, request_reason, status, is_emergency, created_by, created_at, updated_at)
    VALUES (r_trip2.id, 'REPLACE_DRIVER', v_drv2, v_drv3, 'URGENT',
        'Tài xế báo ốm đột xuất 30 phút trước giờ xuất bến. Cần thay thế gấp.',
        'PENDING', false, 1, CURRENT_TIMESTAMP - INTERVAL '25 minutes', CURRENT_TIMESTAMP - INTERVAL '25 minutes');

    -- 3. Vùng CRITICAL (< 15 phút) — Auto-execute, chờ hậu kiểm
    INSERT INTO trip_change_request (trip_id, change_type, old_driver_id, new_driver_id, urgency_zone, request_reason, status, is_emergency, created_by, created_at, updated_at)
    VALUES (r_trip3.id, 'REPLACE_DRIVER', v_drv3, v_drv4, 'CRITICAL',
        'Tài xế không có mặt tại bến 8 phút trước giờ xuất. Hệ thống tự động thay thế.',
        'PENDING', true, 1, CURRENT_TIMESTAMP - INTERVAL '8 minutes', CURRENT_TIMESTAMP - INTERVAL '8 minutes');

    -- 4. Vùng DEPARTED (Xe đã xuất bến) — Auto-execute, đã hậu kiểm đạt
    INSERT INTO trip_change_request (trip_id, change_type, old_driver_id, new_driver_id, urgency_zone, request_reason, status, is_emergency, created_by, approved_by, created_at, updated_at)
    VALUES (r_trip4.id, 'REPLACE_DRIVER', v_drv4, v_drv5, 'DEPARTED',
        'Tài xế có biểu hiện mệt mỏi sau khi xuất bến. Đổi ca tại trạm dừng Km42.',
        'APPROVED', true, 1, 1, CURRENT_TIMESTAMP - INTERVAL '30 minutes', CURRENT_TIMESTAMP - INTERVAL '20 minutes');

    -- 5. Vùng MID_ROUTE (Sự cố dọc đường) — Auto-execute, chờ hậu kiểm
    INSERT INTO trip_change_request (trip_id, change_type, old_driver_id, new_driver_id, urgency_zone, incident_type, incident_gps, request_reason, status, is_emergency, created_by, created_at, updated_at)
    VALUES (r_trip5.id, 'INCIDENT_SWAP', v_drv5, v_drv1, 'MID_ROUTE', 'VEHICLE_BREAKDOWN', '10.0365,105.7838',
        'Xe hỏng máy lạnh giữa QL1A, Km68 đoạn Cần Thơ - Vĩnh Long. Xe cứu hộ đã đến, hành khách chuyển sang xe thay thế.',
        'PENDING', true, 1, CURRENT_TIMESTAMP - INTERVAL '15 minutes', CURRENT_TIMESTAMP - INTERVAL '15 minutes');

    -- 6. Bổ sung: Từ chối — Đổi xe không hợp lệ
    INSERT INTO trip_change_request (trip_id, change_type, old_bus_id, new_bus_id, urgency_zone, request_reason, rejected_reason, status, is_emergency, created_by, approved_by, created_at, updated_at)
    VALUES (r_trip1.id, 'REPLACE_BUS', v_bus1, v_bus2, 'STANDARD',
        'Xe 51B-123.45 có tiếng ồn bất thường từ động cơ, đề xuất đổi sang xe dự phòng.',
        'Xe thay thế đã hết hạn đăng kiểm. Vui lòng chọn xe khác.',
        'REJECTED', false, 1, 1, CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours 50 minutes');

END $$;
