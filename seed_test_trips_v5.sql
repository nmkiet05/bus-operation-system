-- Xoa cac trip test cu
DELETE FROM trip WHERE bus_id IN (2666, 2667, 2668, 2669);
DELETE FROM bus_assignment WHERE bus_id IN (2666, 2667, 2668, 2669);

-- Tao lai 4 trip dung route 5 (SG-VT, 2 tieng)  
DO $$
DECLARE
    v_ba1 BIGINT; v_ba2 BIGINT; v_ba3 BIGINT; v_ba4 BIGINT;
    v_t1 BIGINT; v_t2 BIGINT; v_t3 BIGINT; v_t4 BIGINT;
    v_now TIME := CURRENT_TIME;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Zone1 (STANDARD): T=90 phut, route 5 sched 27
    INSERT INTO bus_assignment(bus_id, start_depot_id, end_depot_id, scheduled_start, scheduled_end, status)
    VALUES(2666, NULL, NULL, (v_today + (v_now + INTERVAL '89 minutes'))::timestamp, NULL, 'PENDING')
    RETURNING id INTO v_ba1;
    INSERT INTO trip(trip_schedule_id, departure_date, actual_departure_time, trip_type, status, bus_id, bus_assignment_id)
    VALUES(27, v_today + 1, (v_now + INTERVAL '90 minutes')::time, 'MAIN', 'APPROVED', 2666, v_ba1)
    RETURNING id INTO v_t1;

    -- Zone2 (URGENT): T=30 phut, route 5 sched 28
    INSERT INTO bus_assignment(bus_id, start_depot_id, end_depot_id, scheduled_start, scheduled_end, status)
    VALUES(2667, NULL, NULL, (v_today + (v_now + INTERVAL '29 minutes'))::timestamp, NULL, 'PENDING')
    RETURNING id INTO v_ba2;
    INSERT INTO trip(trip_schedule_id, departure_date, actual_departure_time, trip_type, status, bus_id, bus_assignment_id)
    VALUES(28, v_today, (v_now + INTERVAL '30 minutes')::time, 'MAIN', 'APPROVED', 2667, v_ba2)
    RETURNING id INTO v_t2;

    -- Zone3 (CRITICAL): T=7 phut, route 5 sched 29
    INSERT INTO bus_assignment(bus_id, start_depot_id, end_depot_id, scheduled_start, scheduled_end, status)
    VALUES(2668, NULL, NULL, (v_today + (v_now + INTERVAL '6 minutes'))::timestamp, NULL, 'PENDING')
    RETURNING id INTO v_ba3;
    INSERT INTO trip(trip_schedule_id, departure_date, actual_departure_time, trip_type, status, bus_id, bus_assignment_id)
    VALUES(29, v_today, (v_now + INTERVAL '7 minutes')::time, 'MAIN', 'APPROVED', 2668, v_ba3)
    RETURNING id INTO v_t3;

    -- Zone4+5 (RUNNING), route 5 sched 30
    INSERT INTO bus_assignment(bus_id, start_depot_id, end_depot_id, scheduled_start, scheduled_end, status)
    VALUES(2669, NULL, NULL, (v_today + (v_now - INTERVAL '3 hours'))::timestamp, NULL, 'ACTIVE')
    RETURNING id INTO v_ba4;
    INSERT INTO trip(trip_schedule_id, departure_date, actual_departure_time, trip_type, status, bus_id, bus_assignment_id)
    VALUES(30, v_today, (v_now - INTERVAL '2 hours')::time, 'MAIN', 'RUNNING', 2669, v_ba4)
    RETURNING id INTO v_t4;

    -- Driver assignments (driver 28,29,30,31 - fresh no trips)
    INSERT INTO driver_assignment(trip_id, driver_id, role, status)
    VALUES(v_t1, 28, 'MAIN_DRIVER', 'ACTIVE'),
          (v_t2, 29, 'MAIN_DRIVER', 'ACTIVE'),
          (v_t3, 30, 'MAIN_DRIVER', 'ACTIVE'),
          (v_t4, 31, 'MAIN_DRIVER', 'ACTIVE')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'CREATED: TRIP_Z1=% TRIP_Z2=% TRIP_Z3=% TRIP_Z4=%', v_t1, v_t2, v_t3, v_t4;
END $$;

SELECT id, departure_date, actual_departure_time::text, status, bus_id, trip_schedule_id
FROM trip WHERE bus_id IN (2666, 2667, 2668, 2669) ORDER BY id;
