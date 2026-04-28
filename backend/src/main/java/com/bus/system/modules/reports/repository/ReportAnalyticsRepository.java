package com.bus.system.modules.reports.repository;

import com.bus.system.modules.reports.dto.ReportsFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

/**
 * KIẾN TRÚC BÁO CÁO DOANH NGHIỆP:
 * Tuyệt đối KHÔNG dùng JPA/Hibernate ở đây để tránh kịch bản N+1 Query làm sập Database.
 * Tận dụng NamedParameterJdbcTemplate cho phép chạy Native SQL (như PostgreSQL CTEs, jsonb extract),
 * giúp hệ thống báo cáo có thể phân tích OLAP qua hàng triệu vé bán ra mà vẫn chịu tải tốt.
 */
@Repository
@RequiredArgsConstructor
public class ReportAnalyticsRepository {

    private final NamedParameterJdbcTemplate jdbc;

    private static final String SEAT_NO_EXPR = "upper(trim(coalesce(sm.elem->>'seat_number', sm.elem->>'seatNumber', sm.elem->>'seat_no', sm.elem->>'number', sm.elem->>'code', '')))";

    public Map<String, Object> revenueSummary(ReportsFilter filter) {
        String sql = baseCte(filter) + """
                , agg AS (
                    SELECT report_date, route_id, route_name, bus_type_id, bus_type_name,
                           sum(gross_revenue) AS gross_revenue,
                           sum(refund_amount) AS refund_amount,
                           sum(gross_revenue) - sum(refund_amount) AS net_revenue,
                           sum(sold_seats) AS sold_seats,
                           sum(booking_count) AS booking_count
                    FROM revenue_rows
                    GROUP BY report_date, route_id, route_name, bus_type_id, bus_type_name
                )
                SELECT
                  coalesce(sum(gross_revenue),0) AS gross_revenue,
                  coalesce(sum(refund_amount),0) AS refund_amount,
                  coalesce(sum(net_revenue),0) AS net_revenue,
                  coalesce(sum(sold_seats),0) AS sold_seats,
                  coalesce(sum(booking_count),0) AS booking_count,
                  CASE WHEN coalesce(sum(sold_seats),0) = 0 THEN 0
                       ELSE round(coalesce(sum(net_revenue),0) / sum(sold_seats), 2) END AS avg_ticket_price
                FROM agg
                """;
        return jdbc.queryForMap(sql, params(filter));
    }

    public List<Map<String, Object>> revenueSeries(ReportsFilter filter) {
        String sql = baseCte(filter) + """
                , agg AS (
                    SELECT report_date,
                           sum(gross_revenue) AS gross_revenue,
                           sum(refund_amount) AS refund_amount,
                           sum(gross_revenue) - sum(refund_amount) AS net_revenue,
                           sum(sold_seats) AS sold_seats
                    FROM revenue_rows
                    GROUP BY report_date
                )
                SELECT report_date, gross_revenue, refund_amount, net_revenue, sold_seats
                FROM agg
                ORDER BY report_date
                """;
        return jdbc.queryForList(sql, params(filter));
    }

    public List<Map<String, Object>> revenueBreakdown(ReportsFilter filter) {
        String sql = baseCte(filter) + """
                , agg AS (
                    SELECT bus_type_id,
                           bus_type_name,
                           sum(gross_revenue) AS gross_revenue,
                           sum(refund_amount) AS refund_amount,
                           sum(gross_revenue) - sum(refund_amount) AS net_revenue,
                           sum(sold_seats) AS sold_seats
                    FROM revenue_rows
                    GROUP BY bus_type_id, bus_type_name
                )
                , all_types AS (
                    SELECT bt.id AS bus_type_id,
                           bt.name AS bus_type_name
                    FROM bus_type bt
                    WHERE bt.deleted_at IS NULL
                      AND (CAST(:busTypeId AS BIGINT) IS NULL OR bt.id = CAST(:busTypeId AS BIGINT))
                )
                SELECT null::bigint AS route_id,
                       null::text AS route_name,
                       t.bus_type_id,
                       t.bus_type_name,
                       coalesce(a.gross_revenue, 0) AS gross_revenue,
                       coalesce(a.refund_amount, 0) AS refund_amount,
                       coalesce(a.net_revenue, 0) AS net_revenue,
                       coalesce(a.sold_seats, 0) AS sold_seats,
                       CASE WHEN coalesce(a.sold_seats, 0) = 0 THEN 0
                            ELSE round(coalesce(a.net_revenue, 0) / a.sold_seats, 2) END AS avg_ticket_price
                FROM all_types t
                LEFT JOIN agg a
                  ON t.bus_type_id = a.bus_type_id
                ORDER BY net_revenue DESC, t.bus_type_name ASC
                """;
        return jdbc.queryForList(sql, params(filter));
    }

    public Map<String, Object> loadFactorSummary(ReportsFilter filter) {
        String sql = loadFactorBaseCte(filter) + """
                , merged AS (
                    SELECT coalesce(a.report_date,s.report_date) AS report_date,
                           coalesce(a.route_id,s.route_id) AS route_id,
                           coalesce(a.route_name,s.route_name) AS route_name,
                           coalesce(a.bus_type_id,s.bus_type_id) AS bus_type_id,
                           coalesce(a.bus_type_name,s.bus_type_name) AS bus_type_name,
                           coalesce(a.available_seats,0) AS available_seats,
                           coalesce(s.sold_seats,0) AS sold_seats
                    FROM available_rows a
                    FULL OUTER JOIN sold_rows s
                      ON a.report_date = s.report_date
                     AND a.route_id = s.route_id
                     AND a.bus_type_id = s.bus_type_id
                )
                SELECT
                  coalesce(sum(sold_seats),0) AS sold_seats,
                  coalesce(sum(available_seats),0) AS available_seats,
                  CASE WHEN coalesce(sum(available_seats),0) = 0 THEN 0
                       ELSE round((coalesce(sum(sold_seats),0)::numeric / sum(available_seats)) * 100, 2) END AS load_factor
                FROM merged
                """;
        return jdbc.queryForMap(sql, params(filter));
    }

    public List<Map<String, Object>> loadFactorSeries(ReportsFilter filter) {
        String sql = loadFactorBaseCte(filter) + """
                , merged AS (
                    SELECT coalesce(a.report_date,s.report_date) AS report_date,
                           coalesce(a.available_seats,0) AS available_seats,
                           coalesce(s.sold_seats,0) AS sold_seats
                    FROM available_rows a
                    FULL OUTER JOIN sold_rows s
                      ON a.report_date = s.report_date
                     AND a.route_id = s.route_id
                     AND a.bus_type_id = s.bus_type_id
                )
                SELECT report_date,
                       sum(sold_seats) AS sold_seats,
                       sum(available_seats) AS available_seats,
                       CASE WHEN sum(available_seats) = 0 THEN 0
                            ELSE round((sum(sold_seats)::numeric / sum(available_seats)) * 100, 2) END AS load_factor
                FROM merged
                GROUP BY report_date
                ORDER BY report_date
                """;
        return jdbc.queryForList(sql, params(filter));
    }

    public List<Map<String, Object>> loadFactorBreakdown(ReportsFilter filter) {
        String sql = loadFactorBaseCte(filter) + """
                , merged AS (
                  SELECT coalesce(a.bus_type_id,s.bus_type_id) AS bus_type_id,
                      coalesce(a.bus_type_name,s.bus_type_name) AS bus_type_name,
                           coalesce(a.available_seats,0) AS available_seats,
                           coalesce(s.sold_seats,0) AS sold_seats
                    FROM available_rows a
                    FULL OUTER JOIN sold_rows s
                      ON a.report_date = s.report_date
                     AND a.route_id = s.route_id
                     AND a.bus_type_id = s.bus_type_id
                )
              , agg AS (
                  SELECT bus_type_id,
                      bus_type_name,
                      sum(sold_seats) AS sold_seats,
                      sum(available_seats) AS available_seats
                  FROM merged
                  WHERE bus_type_id IS NOT NULL
                  GROUP BY bus_type_id, bus_type_name
              )
              , all_types AS (
                  SELECT bt.id AS bus_type_id,
                      bt.name AS bus_type_name
                  FROM bus_type bt
                  WHERE bt.deleted_at IS NULL
                 AND (CAST(:busTypeId AS BIGINT) IS NULL OR bt.id = CAST(:busTypeId AS BIGINT))
              )
                SELECT null::bigint AS route_id,
                       null::text AS route_name,
                  t.bus_type_id,
                  t.bus_type_name,
                  coalesce(a.sold_seats, 0) AS sold_seats,
                  coalesce(a.available_seats, 0) AS available_seats,
                  CASE WHEN coalesce(a.available_seats, 0) = 0 THEN 0
                    ELSE round((a.sold_seats::numeric / a.available_seats) * 100, 2) END AS load_factor
              FROM all_types t
              LEFT JOIN agg a
                ON t.bus_type_id = a.bus_type_id
              ORDER BY load_factor DESC, t.bus_type_name ASC
                """;
        return jdbc.queryForList(sql, params(filter));
    }

    private String baseCte(ReportsFilter filter) {
        return """
                -- CTE (Common Table Expression): Bảng tạm RAM siêu tốc để nhóm theo cấp độ Ngày -> Chuyến
                WITH revenue_rows AS (
                    SELECT tr.departure_date AS report_date,
                           r.id AS route_id,
                           r.name AS route_name,
                           bt.id AS bus_type_id,
                           bt.name AS bus_type_name,
                           sum(t.price) AS gross_revenue,               -- BÁN ĐƯỢC BAO NHIÊU? (Tổng giá vé)
                           coalesce(sum(rt.amount),0) AS refund_amount, -- HOÀN TIỀN BAO NHIÊU? (Lọc status='SUCCESS')
                           count(distinct (tr.id, upper(trim(t.seat_number)))) AS sold_seats, -- DISTINT Lọc trùng lặp 1 vé đếm 2 lần
                           count(distinct b.id) AS booking_count
                    FROM ticket t
                    JOIN booking b ON b.id = t.booking_id
                    JOIN trip tr ON tr.id = t.trip_id
                    JOIN trip_schedule ts ON ts.id = tr.trip_schedule_id
                    JOIN route r ON r.id = ts.route_id
                          LEFT JOIN bus bs ON bs.id = tr.bus_id
                          LEFT JOIN bus_type bt ON bt.id = bs.bus_type_id
                          -- TUYỆT KỸ JSONB LATERAL: Cắt nhuyễn Mảng Sơ Đồ Xe '[]' của từng loại xe thành nhiều dòng, 
                          -- mỗi vị trí ghế biến thành 1 bản ghi khớp với seat_number thực tế trên Cột vé.
                          LEFT JOIN LATERAL jsonb_array_elements(coalesce(bt.seat_map, '[]'::jsonb)) sm(elem)
                           ON %s = upper(trim(t.seat_number))
                    LEFT JOIN refund_transactions rt
                           ON rt.ticket_id = t.id AND rt.status = 'SUCCESS'
                    WHERE tr.deleted_at IS NULL
                      AND tr.departure_date BETWEEN :fromDate AND :toDate
                                            AND tr.status IN ('SCHEDULED','APPROVED','RUNNING','COMPLETED')
                                            AND bt.id IS NOT NULL
                      AND b.status = 'CONFIRMED'
                      AND t.status IN ('ACTIVE','CONFIRMED')
                                            
                                            -- KỸ THUẬT DYNAMIC SQL: Xử lý linh động mọi Filter Parameters từ Frontend.
                                            -- Nếu Front-end gửi :routeId bị NULL => Biểu thức Logical rẽ sang vế Phải OR và cho kết quả TRUE.
                                            -- Database Engine sẽ tự bỏ qua nhánh WHERE này mà Backend ko cần nối chuỗi if-else dài ngoằng.
                                            AND (CAST(:routeId AS BIGINT) IS NULL OR r.id = CAST(:routeId AS BIGINT))
                                            AND (CAST(:busTypeId AS BIGINT) IS NULL OR bt.id = CAST(:busTypeId AS BIGINT))
                    GROUP BY tr.departure_date, r.id, r.name, bt.id, bt.name
                )
                """.formatted(SEAT_NO_EXPR);
    }

    private String loadFactorBaseCte(ReportsFilter filter) {
        return """
                WITH available_rows AS (
                    SELECT tr.departure_date AS report_date,
                           r.id AS route_id,
                           r.name AS route_name,
                           bt.id AS bus_type_id,
                           bt.name AS bus_type_name,
                           count(*)::bigint AS available_seats
                    FROM trip tr
                    JOIN trip_schedule ts ON ts.id = tr.trip_schedule_id
                    JOIN route r ON r.id = ts.route_id
                          LEFT JOIN bus bs ON bs.id = tr.bus_id
                          LEFT JOIN bus_type bt ON bt.id = bs.bus_type_id
                          LEFT JOIN LATERAL jsonb_array_elements(coalesce(bt.seat_map, '[]'::jsonb)) sm(elem)
                           ON true
                    WHERE tr.deleted_at IS NULL
                      AND tr.departure_date BETWEEN :fromDate AND :toDate
                      AND tr.status IN ('SCHEDULED','APPROVED','RUNNING','COMPLETED')
                                            AND (CAST(:routeId AS BIGINT) IS NULL OR r.id = CAST(:routeId AS BIGINT))
                                            AND (CAST(:busTypeId AS BIGINT) IS NULL OR bt.id = CAST(:busTypeId AS BIGINT))
                                        GROUP BY tr.departure_date, r.id, r.name, bt.id, bt.name
                ),
                sold_rows AS (
                    SELECT tr.departure_date AS report_date,
                           r.id AS route_id,
                           r.name AS route_name,
                           bt.id AS bus_type_id,
                           bt.name AS bus_type_name,
                          count(distinct (tr.id, upper(trim(t.seat_number))))::bigint AS sold_seats
                    FROM ticket t
                    JOIN booking b ON b.id = t.booking_id
                    JOIN trip tr ON tr.id = t.trip_id
                    JOIN trip_schedule ts ON ts.id = tr.trip_schedule_id
                    JOIN route r ON r.id = ts.route_id
                          LEFT JOIN bus bs ON bs.id = tr.bus_id
                          LEFT JOIN bus_type bt ON bt.id = bs.bus_type_id
                          LEFT JOIN LATERAL jsonb_array_elements(coalesce(bt.seat_map, '[]'::jsonb)) sm(elem)
                           ON %s = upper(trim(t.seat_number))
                    WHERE tr.deleted_at IS NULL
                      AND tr.departure_date BETWEEN :fromDate AND :toDate
                                            AND tr.status IN ('SCHEDULED','APPROVED','RUNNING','COMPLETED')
                                            AND bt.id IS NOT NULL
                      AND b.status = 'CONFIRMED'
                      AND t.status IN ('ACTIVE','CONFIRMED')
                                            AND (CAST(:routeId AS BIGINT) IS NULL OR r.id = CAST(:routeId AS BIGINT))
                                            AND (CAST(:busTypeId AS BIGINT) IS NULL OR bt.id = CAST(:busTypeId AS BIGINT))
                    GROUP BY tr.departure_date, r.id, r.name, bt.id, bt.name
                )
                """.formatted(
                SEAT_NO_EXPR);
    }

    private MapSqlParameterSource params(ReportsFilter f) {
        return new MapSqlParameterSource()
                .addValue("fromDate", f.getFromDate())
                .addValue("toDate", f.getToDate())
                .addValue("routeId", f.getRouteId())
            .addValue("busTypeId", f.getBusTypeId());
    }
}
