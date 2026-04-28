-- =============================================================================
-- V2: Fix trigger check_trip_within_assignment
-- Vấn đề: Trigger bắn khi startTrip() cập nhật status → RUNNING, khiến
-- tính lại v_trip_end từ actual_departure_time thực tế vượt quá scheduled_end
-- của bus_assignment → RAISE EXCEPTION "Hệ thống bận".
--
-- Giải pháp: Bỏ qua kiểm tra bound khi chuyến đã RUNNING/COMPLETED/CANCELLED.
-- Trigger chỉ có ý nghĩa ngăn gán sai khi trip mới được tạo/lập lịch (SCHEDULED/APPROVED).
-- =============================================================================

CREATE OR REPLACE FUNCTION check_trip_within_assignment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_scheduled_start TIMESTAMP;
    v_scheduled_end   TIMESTAMP;
    v_trip_start      TIMESTAMP;
    v_trip_end        TIMESTAMP;
    v_route_duration  DECIMAL;
BEGIN
    IF NEW.bus_assignment_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- [FIX V2] Bỏ qua kiểm tra khi chuyến đã vào trạng thái vận hành / kết thúc.
    -- Khi startTrip() được gọi: status → RUNNING, actual_departure_time = NOW().
    -- Trigger sẽ tính v_trip_end = NOW() + duration, có thể vượt scheduled_end dù hợp lệ.
    -- Trigger này chỉ cần bảo vệ lúc LẬP LỊCH ban đầu (SCHEDULED / APPROVED).
    IF NEW.status IN ('RUNNING', 'COMPLETED', 'CANCELLED') THEN
        RETURN NEW;
    END IF;

    SELECT scheduled_start, scheduled_end
    INTO v_scheduled_start, v_scheduled_end
    FROM bus_assignment
    WHERE id = NEW.bus_assignment_id;

    IF v_scheduled_start IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.departure_date IS NOT NULL AND NEW.actual_departure_time IS NOT NULL THEN
        v_trip_start := NEW.departure_date + NEW.actual_departure_time;
    ELSE
        RETURN NEW;
    END IF;

    IF NEW.arrival_time IS NOT NULL THEN
        v_trip_end := NEW.arrival_time;
    ELSE
        SELECT r.duration_hours INTO v_route_duration
        FROM trip_schedule ts
        JOIN route r ON r.id = ts.route_id
        WHERE ts.id = NEW.trip_schedule_id;

        v_trip_end := v_trip_start + COALESCE(v_route_duration, 2) * INTERVAL '1 hour';
    END IF;

    IF v_trip_start < v_scheduled_start THEN
        RAISE EXCEPTION 'Chuyến xe khởi hành lúc % trước giờ xuất bãi của ca xe (%). Không thể gán.',
            v_trip_start::TIME, v_scheduled_start::TIME;
    END IF;

    IF v_scheduled_end IS NOT NULL AND v_trip_end > v_scheduled_end THEN
        RAISE EXCEPTION 'Chuyến xe kết thúc lúc % sau giờ nhập bãi của ca xe (%). Không thể gán.',
            v_trip_end::TIME, v_scheduled_end::TIME;
    END IF;

    RETURN NEW;
END;
$$;
