-- Lay ra 1 trip_schedule_id va 1 bus_id, bus_assignment_id ton tai
-- De tao cac trip test cho 5 zone

-- Zone 1 (STANDARD): khoi hanh sau 90 phut
INSERT INTO trip (trip_schedule_id, departure_date, actual_departure_time, trip_type, status, bus_id, bus_assignment_id)
SELECT
    s.id,
    CURRENT_DATE,
    (CURRENT_TIME + INTERVAL '90 minutes')::time,
    'MAIN', 'APPROVED',
    (SELECT bus_id FROM trip WHERE bus_id IS NOT NULL LIMIT 1),
    (SELECT bus_assignment_id FROM trip WHERE bus_assignment_id IS NOT NULL LIMIT 1)
FROM trip_schedule s WHERE s.route_id = 1 LIMIT 1
RETURNING id, 'ZONE1_STANDARD' as zone;

-- Zone 2 (URGENT): khoi hanh sau 30 phut (15<=T<=60)
INSERT INTO trip (trip_schedule_id, departure_date, actual_departure_time, trip_type, status, bus_id, bus_assignment_id)
SELECT
    s.id,
    CURRENT_DATE,
    (CURRENT_TIME + INTERVAL '30 minutes')::time,
    'MAIN', 'APPROVED',
    (SELECT bus_id FROM trip WHERE bus_id IS NOT NULL LIMIT 1),
    (SELECT bus_assignment_id FROM trip WHERE bus_assignment_id IS NOT NULL LIMIT 1)
FROM trip_schedule s WHERE s.route_id = 1 LIMIT 1
RETURNING id, 'ZONE2_URGENT' as zone;

-- Zone 3 (CRITICAL): khoi hanh sau 7 phut (T<15)
INSERT INTO trip (trip_schedule_id, departure_date, actual_departure_time, trip_type, status, bus_id, bus_assignment_id)
SELECT
    s.id,
    CURRENT_DATE,
    (CURRENT_TIME + INTERVAL '7 minutes')::time,
    'MAIN', 'APPROVED',
    (SELECT bus_id FROM trip WHERE bus_id IS NOT NULL LIMIT 1),
    (SELECT bus_assignment_id FROM trip WHERE bus_assignment_id IS NOT NULL LIMIT 1)
FROM trip_schedule s WHERE s.route_id = 1 LIMIT 1
RETURNING id, 'ZONE3_CRITICAL' as zone;

-- Zone 4+5 (DEPARTED/RUNNING): trang thai RUNNING
INSERT INTO trip (trip_schedule_id, departure_date, actual_departure_time, trip_type, status, bus_id, bus_assignment_id)
SELECT
    s.id,
    CURRENT_DATE,
    (CURRENT_TIME - INTERVAL '2 hours')::time,
    'MAIN', 'RUNNING',
    (SELECT bus_id FROM trip WHERE bus_id IS NOT NULL LIMIT 1),
    (SELECT bus_assignment_id FROM trip WHERE bus_assignment_id IS NOT NULL LIMIT 1)
FROM trip_schedule s WHERE s.route_id = 1 LIMIT 1
RETURNING id, 'ZONE4_ZONE5_RUNNING' as zone;
