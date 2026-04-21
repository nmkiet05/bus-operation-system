-- Tao trip thu 5 cho Zone 5 MID_ROUTE test
-- Route 5 (Sai Gon - Vung Tau), dang RUNNING (da xuat ben 1h truoc)
-- Bus moi, tai xe moi

-- Insert test bus Z5
INSERT INTO bus (license_plate, status, purchased_at, seats_count)
VALUES ('TEST-Z5-005', 'IN_USE', '2020-01-01', 40) RETURNING id;

-- Insert bus_assignment cho bus moi voi NULL depot_id de bypass trigger
INSERT INTO bus_assignment (bus_id, route_id, assigned_date, status)
VALUES (
    (SELECT id FROM bus WHERE license_plate='TEST-Z5-005'),
    5,
    CURRENT_DATE,
    'DEPARTED'
) RETURNING id;

-- Insert trip Z5 (RUNNING, xuat ben 1 tieng truoc)
INSERT INTO trip (
    trip_schedule_id, route_id, bus_id, departure_date,
    actual_departure_time, status
) VALUES (
    505,
    5,
    (SELECT id FROM bus WHERE license_plate='TEST-Z5-005'),
    CURRENT_DATE,
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::time - INTERVAL '60 minutes',
    'RUNNING'
) RETURNING id;

-- Lay trip id vua tao
DO $$
DECLARE
    v_trip_id  BIGINT;
    v_ba_id    BIGINT;
    v_driver_id BIGINT;
BEGIN
    SELECT id INTO v_trip_id FROM trip WHERE license_plate=(SELECT license_plate FROM bus WHERE license_plate='TEST-Z5-005') ORDER BY id DESC LIMIT 1;
    -- fallback: lay trip moi nhat vua insert
    SELECT id INTO v_trip_id FROM trip WHERE trip_schedule_id=505 AND departure_date=CURRENT_DATE ORDER BY id DESC LIMIT 1;
    SELECT id INTO v_ba_id FROM bus_assignment WHERE bus_id=(SELECT id FROM bus WHERE license_plate='TEST-Z5-005') ORDER BY id DESC LIMIT 1;
    SELECT id INTO v_driver_id FROM users WHERE username='test_drv6';

    -- Gan driver cho trip Z5
    INSERT INTO driver_assignment (trip_id, driver_id, role, status)
    VALUES (v_trip_id, v_driver_id, 'MAIN_DRIVER', 'ACTIVE');

    RAISE NOTICE 'Z5 Trip ID: %, BusAssignment ID: %, Driver ID: %', v_trip_id, v_ba_id, v_driver_id;
END $$;

SELECT t.id, t.status, t.actual_departure_time, da.driver_id, da.status as da_status
FROM trip t
JOIN driver_assignment da ON da.trip_id=t.id
WHERE t.trip_schedule_id=505 AND t.departure_date=CURRENT_DATE;
