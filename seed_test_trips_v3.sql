-- Tao 4 trip test cho 5 Zone TripChange (bypass trigger bang cach dat scheduled_end = NULL)
DO $$
DECLARE
    v_sched_id BIGINT;
    v_ba1 BIGINT; v_ba2 BIGINT; v_ba3 BIGINT; v_ba4 BIGINT;
    v_t1 BIGINT; v_t2 BIGINT; v_t3 BIGINT; v_t4 BIGINT;
    v_now TIME := CURRENT_TIME;
    v_today DATE := CURRENT_DATE;
BEGIN
    SELECT id INTO v_sched_id FROM trip_schedule WHERE route_id = 1 LIMIT 1;

    -- Zone1 (STANDARD): T=90 phut
    INSERT INTO bus_assignment(bus_id, start_depot_id, end_depot_id, scheduled_start, scheduled_end, status)
    VALUES(2666, NULL, NULL, (v_today + (v_now + INTERVAL '89 minutes'))::timestamp, NULL, 'PENDING')
    RETURNING id INTO v_ba1;
    INSERT INTO trip(trip_schedule_id, departure_date, actual_departure_time, trip_type, status, bus_id, bus_assignment_id)
    VALUES(v_sched_id, v_today, (v_now + INTERVAL '90 minutes')::time, 'MAIN', 'APPROVED', 2666, v_ba1)
    RETURNING id INTO v_t1;

    -- Zone2 (URGENT): T=30 phut
    INSERT INTO bus_assignment(bus_id, start_depot_id, end_depot_id, scheduled_start, scheduled_end, status)
    VALUES(2667, NULL, NULL, (v_today + (v_now + INTERVAL '29 minutes'))::timestamp, NULL, 'PENDING')
    RETURNING id INTO v_ba2;
    INSERT INTO trip(trip_schedule_id, departure_date, actual_departure_time, trip_type, status, bus_id, bus_assignment_id)
    VALUES(v_sched_id, v_today, (v_now + INTERVAL '30 minutes')::time, 'MAIN', 'APPROVED', 2667, v_ba2)
    RETURNING id INTO v_t2;

    -- Zone3 (CRITICAL): T=7 phut
    INSERT INTO bus_assignment(bus_id, start_depot_id, end_depot_id, scheduled_start, scheduled_end, status)
    VALUES(2668, NULL, NULL, (v_today + (v_now + INTERVAL '6 minutes'))::timestamp, NULL, 'PENDING')
    RETURNING id INTO v_ba3;
    INSERT INTO trip(trip_schedule_id, departure_date, actual_departure_time, trip_type, status, bus_id, bus_assignment_id)
    VALUES(v_sched_id, v_today, (v_now + INTERVAL '7 minutes')::time, 'MAIN', 'APPROVED', 2668, v_ba3)
    RETURNING id INTO v_t3;

    -- Zone4+5 (DEPARTED/RUNNING): da chay
    INSERT INTO bus_assignment(bus_id, start_depot_id, end_depot_id, scheduled_start, scheduled_end, status)
    VALUES(2669, NULL, NULL, (v_today + (v_now - INTERVAL '3 hours'))::timestamp, NULL, 'ACTIVE')
    RETURNING id INTO v_ba4;
    INSERT INTO trip(trip_schedule_id, departure_date, actual_departure_time, trip_type, status, bus_id, bus_assignment_id)
    VALUES(v_sched_id, v_today, (v_now - INTERVAL '2 hours')::time, 'MAIN', 'RUNNING', 2669, v_ba4)
    RETURNING id INTO v_t4;

    -- Them driver_assignment (MAIN_DRIVER) cho tat ca 4 trip test
    INSERT INTO driver_assignment(trip_id, driver_id, role, status)
    VALUES(v_t1, 7, 'MAIN_DRIVER', 'ACTIVE'),
          (v_t2, 7, 'MAIN_DRIVER', 'ACTIVE'),
          (v_t3, 7, 'MAIN_DRIVER', 'ACTIVE'),
          (v_t4, 7, 'MAIN_DRIVER', 'ACTIVE')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'CREATED: TRIP_Z1=% TRIP_Z2=% TRIP_Z3=% TRIP_Z4=%', v_t1, v_t2, v_t3, v_t4;
END $$;

-- Kiem tra ket qua
SELECT id, departure_date, actual_departure_time, status, bus_id
FROM trip
WHERE bus_id IN (2666, 2667, 2668, 2669)
ORDER BY id;
