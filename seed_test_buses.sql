-- Tao bus va bus_assignment rieng cho test (khong bi trigger chan)
-- Tao xe test
INSERT INTO bus (license_plate, bus_type_id, manufacturing_year, insurance_expiry_date, registration_expiry_date, status)
VALUES ('TEST-Z1-001', 1, 2025, '2030-01-01', '2030-01-01', 'ACTIVE') RETURNING id;

INSERT INTO bus (license_plate, bus_type_id, manufacturing_year, insurance_expiry_date, registration_expiry_date, status)
VALUES ('TEST-Z2-002', 1, 2025, '2030-01-01', '2030-01-01', 'ACTIVE') RETURNING id;

INSERT INTO bus (license_plate, bus_type_id, manufacturing_year, insurance_expiry_date, registration_expiry_date, status)
VALUES ('TEST-Z3-003', 1, 2025, '2030-01-01', '2030-01-01', 'ACTIVE') RETURNING id;

INSERT INTO bus (license_plate, bus_type_id, manufacturing_year, insurance_expiry_date, registration_expiry_date, status)
VALUES ('TEST-Z45-004', 1, 2025, '2030-01-01', '2030-01-01', 'ACTIVE') RETURNING id;
