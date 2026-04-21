-- Tao 5 tai xe hoàn toàn mới không có chuyến nào để test từng zone
INSERT INTO users (username, password, full_name, email, phone, status)
VALUES
('test_drv1', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Test Driver Zone1', 'tdrv1@test.vn', '0911111111', 'ACTIVE'),
('test_drv2', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Test Driver Zone2', 'tdrv2@test.vn', '0911111112', 'ACTIVE'),
('test_drv3', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Test Driver Zone3', 'tdrv3@test.vn', '0911111113', 'ACTIVE'),
('test_drv4', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Test Driver Zone4', 'tdrv4@test.vn', '0911111114', 'ACTIVE'),
('test_drv5', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Test Driver Zone5', 'tdrv5@test.vn', '0911111115', 'ACTIVE')
RETURNING id, username;

-- Gan role DRIVER cho ho
INSERT INTO user_roles (user_id, role)
SELECT id, 'DRIVER' FROM users WHERE username LIKE 'test_drv%';

-- Tao driver_detail cho ho
INSERT INTO driver_detail (user_id, department_id, license_number, license_class, license_expiry_date, issue_date)
SELECT u.id, (SELECT id FROM departments WHERE code='OP'), 'TEST-' || u.id, 'FC', '2030-01-01', '2020-01-01'
FROM users u WHERE u.username LIKE 'test_drv%';

-- Ket qua
SELECT id, username FROM users WHERE username LIKE 'test_drv%';
