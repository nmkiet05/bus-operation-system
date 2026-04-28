INSERT INTO users (username, password, full_name, email, phone, status)
VALUES ('fresh_drv_z3', '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja', 'Fresh Z3 Driver', 'freshz3@test.vn', '0922222201', 'ACTIVE') RETURNING id;
INSERT INTO user_roles VALUES (currval('users_id_seq'), 'DRIVER');
INSERT INTO driver_detail(user_id, department_id, license_number, license_class, license_expiry_date, issue_date)
VALUES(currval('users_id_seq'), (SELECT id FROM departments WHERE code='OP'), 'FRESHZ3', 'FC', '2030-01-01', '2020-01-01');
SELECT id, username FROM users WHERE username='fresh_drv_z3';
