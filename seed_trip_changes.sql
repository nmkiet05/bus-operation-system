DELETE FROM trip_change_request;

DO $$
DECLARE
  v_trip1 BIGINT; v_trip2 BIGINT; v_trip3 BIGINT; v_trip4 BIGINT; v_trip5 BIGINT;
  v_drv1 BIGINT := 7; v_drv2 BIGINT := 8; v_drv3 BIGINT := 9; v_drv4 BIGINT := 10; v_drv5 BIGINT := 11;
  v_bus1 BIGINT := 1; v_bus2 BIGINT := 2;
BEGIN
  SELECT id INTO v_trip1 FROM trip WHERE status = 'APPROVED' AND bus_id IS NOT NULL ORDER BY id LIMIT 1;
  SELECT id INTO v_trip2 FROM trip WHERE status = 'APPROVED' AND bus_id IS NOT NULL AND id > v_trip1 ORDER BY id LIMIT 1;
  SELECT id INTO v_trip3 FROM trip WHERE status = 'APPROVED' AND bus_id IS NOT NULL AND id > v_trip2 ORDER BY id LIMIT 1;
  SELECT id INTO v_trip4 FROM trip WHERE status = 'APPROVED' AND bus_id IS NOT NULL AND id > v_trip3 ORDER BY id LIMIT 1;
  SELECT id INTO v_trip5 FROM trip WHERE status = 'APPROVED' AND bus_id IS NOT NULL AND id > v_trip4 ORDER BY id LIMIT 1;

  -- 1. STANDARD - Da duyet
  INSERT INTO trip_change_request (trip_id, change_type, old_driver_id, new_driver_id, urgency_zone, request_reason, status, is_emergency, created_by, approved_by, created_at, updated_at)
  VALUES (v_trip1, 'REPLACE_DRIVER', v_drv1, v_drv2, 'STANDARD', 'GPLX tai xe het han. Thay the bang tai xe du phong theo quy trinh.', 'APPROVED', false, 1, 1, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '110 minutes');

  -- 2. URGENT - Cho duyet
  INSERT INTO trip_change_request (trip_id, change_type, old_driver_id, new_driver_id, urgency_zone, request_reason, status, is_emergency, created_by, created_at, updated_at)
  VALUES (v_trip2, 'REPLACE_DRIVER', v_drv2, v_drv3, 'URGENT', 'Tai xe bao om dot xuat 30 phut truoc gio xuat ben. Can thay the gap.', 'PENDING', false, 1, CURRENT_TIMESTAMP - INTERVAL '25 minutes', CURRENT_TIMESTAMP - INTERVAL '25 minutes');

  -- 3. CRITICAL - Auto-execute, cho hau kiem
  INSERT INTO trip_change_request (trip_id, change_type, old_driver_id, new_driver_id, urgency_zone, request_reason, status, is_emergency, created_by, created_at, updated_at)
  VALUES (v_trip3, 'REPLACE_DRIVER', v_drv3, v_drv4, 'CRITICAL', 'Tai xe vang mat tai ben 8 phut truoc gio xuat. He thong tu dong thay the.', 'PENDING', true, 1, CURRENT_TIMESTAMP - INTERVAL '8 minutes', CURRENT_TIMESTAMP - INTERVAL '8 minutes');

  -- 4. DEPARTED - Da hau kiem dat
  INSERT INTO trip_change_request (trip_id, change_type, old_driver_id, new_driver_id, urgency_zone, request_reason, status, is_emergency, created_by, approved_by, created_at, updated_at)
  VALUES (v_trip4, 'REPLACE_DRIVER', v_drv4, v_drv5, 'DEPARTED', 'Tai xe co bieu hien met moi sau khi xuat ben. Doi ca tai tram dung Km42.', 'APPROVED', true, 1, 1, CURRENT_TIMESTAMP - INTERVAL '30 minutes', CURRENT_TIMESTAMP - INTERVAL '20 minutes');

  -- 5. MID_ROUTE - Su co doc duong, cho hau kiem
  INSERT INTO trip_change_request (trip_id, change_type, old_driver_id, new_driver_id, urgency_zone, incident_type, incident_gps, request_reason, status, is_emergency, created_by, created_at, updated_at)
  VALUES (v_trip5, 'INCIDENT_SWAP', v_drv5, v_drv1, 'MID_ROUTE', 'VEHICLE_BREAKDOWN', '10.0365,105.7838', 'Xe hong may lanh giua QL1A Km68 doan CT-VL. Hanh khach chuyen sang xe thay the.', 'PENDING', true, 1, CURRENT_TIMESTAMP - INTERVAL '15 minutes', CURRENT_TIMESTAMP - INTERVAL '15 minutes');

  -- 6. REJECTED - Doi xe khong hop le
  INSERT INTO trip_change_request (trip_id, change_type, old_bus_id, new_bus_id, urgency_zone, request_reason, rejected_reason, status, is_emergency, created_by, approved_by, created_at, updated_at)
  VALUES (v_trip1, 'REPLACE_BUS', v_bus1, v_bus2, 'STANDARD', 'Xe co tieng on bat thuong tu dong co, de xuat doi xe du phong.', 'Xe thay the het han dang kiem. Vui long chon xe khac.', 'REJECTED', false, 1, 1, CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '170 minutes');
END $$;
