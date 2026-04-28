-- Xoa het cac request PENDING/ESCALATED cu de tranh EscalationJob retry
-- Sau khi xoa, job se khong escalate gi nua
DELETE FROM trip_change_request WHERE trip_id IN (2768,2769,2770,2771);

-- Reset driver_assignment cho sach de test lai tu dau
-- Xoa het records cu (ENDED_EARLY, PENDING, etc.) chi giu ACTIVE
DELETE FROM driver_assignment WHERE trip_id IN (2768,2769,2770,2771) AND status != 'ACTIVE';

-- Kiem tra
SELECT id, trip_id, status, urgency_zone, new_driver_id FROM trip_change_request WHERE trip_id IN (2768,2769,2770,2771);
SELECT trip_id, driver_id, status FROM driver_assignment WHERE trip_id IN (2768,2769,2770,2771);
