-- Cap nhat cac trip cu dung route 5 trip_schedule (27,28,29,30)
-- Dong thoi dat departure_time moi cho dung vung thoi gian
DO $$
DECLARE
    v_now TIME := CURRENT_TIME;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Trip 2768 = Zone1 (STANDARD): T > 60 (dat sang ngay mai, dung sched_id=27)
    UPDATE trip SET
        trip_schedule_id = 27,
        departure_date   = v_today + 1,
        actual_departure_time = (v_now + INTERVAL '90 minutes')::time,
        status = 'APPROVED'
    WHERE id = 2768;

    -- Trip 2769 = Zone2 (URGENT): 15 <= T <= 60, dat T=30 phut
    UPDATE trip SET
        trip_schedule_id = 28,
        departure_date   = v_today,
        actual_departure_time = (v_now + INTERVAL '30 minutes')::time,
        status = 'APPROVED'
    WHERE id = 2769;

    -- Trip 2770 = Zone3 (CRITICAL): T < 15, dat T=7 phut
    UPDATE trip SET
        trip_schedule_id = 29,
        departure_date   = v_today,
        actual_departure_time = (v_now + INTERVAL '7 minutes')::time,
        status = 'APPROVED'
    WHERE id = 2770;

    -- Trip 2771 = Zone4+5 (RUNNING): da chay
    UPDATE trip SET
        trip_schedule_id = 30,
        departure_date   = v_today,
        actual_departure_time = (v_now - INTERVAL '2 hours')::time,
        status = 'RUNNING'
    WHERE id = 2771;

    -- Doi driver_assignment sang driver moi khong co lich
    UPDATE driver_assignment SET driver_id = 28 WHERE trip_id = 2768;
    UPDATE driver_assignment SET driver_id = 29 WHERE trip_id = 2769;
    UPDATE driver_assignment SET driver_id = 30 WHERE trip_id = 2770;
    UPDATE driver_assignment SET driver_id = 31 WHERE trip_id = 2771;

    RAISE NOTICE 'OK: Updated 4 test trips to route 5 with correct zone times';
END $$;

-- Kiem tra
SELECT t.id, t.departure_date, t.actual_departure_time::text, t.status, 
       t.trip_schedule_id, ts.route_id, r.name as route_name, r.duration_hours
FROM trip t
JOIN trip_schedule ts ON ts.id = t.trip_schedule_id
JOIN route r ON r.id = ts.route_id
WHERE t.id IN (2768, 2769, 2770, 2771);

SELECT da.trip_id, da.driver_id, da.role, u.username 
FROM driver_assignment da JOIN users u ON u.id=da.driver_id
WHERE da.trip_id IN (2768, 2769, 2770, 2771);
