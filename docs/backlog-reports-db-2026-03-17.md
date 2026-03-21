# Backlog DB/Data Layer - Reports

## 1. Cong viec chuan bi
- [ ] Chot metric contract V1 (status duoc tinh doanh thu, sold_seats, no_show).
- [ ] Chot timezone he thong: Asia/Ho_Chi_Minh.
- [ ] Chot grain mac dinh: day, support week/month.
- [ ] Chot dimension seat_type tu bang loai ghe hien co (BUSINESS/SLEEPER/ECONOMY).
- [ ] Chot valid_trips = status COMPLETED cho KPI revenue_per_trip/profit_per_trip.
- [ ] Chot funnel identity theo booking_id + attribution window 24h.

## 2. DDL/View can tao
- [ ] report_daily_revenue
- [ ] report_daily_load_factor
- [ ] report_trip_efficiency
- [ ] report_daily_cancel_refund_noshow
- [ ] report_daily_funnel
- [ ] report_alert_events

## 3. Yeu cau cho tung view
### 3.1 report_daily_revenue
- Key: report_date, route_id, bus_type_id, seat_type_id.
- Fields: seat_type_code, gross_revenue, refund_amount, net_revenue, booking_count, aov.

### 3.2 report_daily_load_factor
- Key: report_date, route_id, bus_type_id, seat_type_id.
- Fields: seat_type_code, sold_seats, available_seats, load_factor, trip_count.

### 3.3 report_trip_efficiency
- Key: trip_id.
- Fields: route_id, bus_type_id, seat_type_id, seat_type_code, sold_seats, available_seats, net_revenue, revenue_per_trip, revenue_per_capacity_seat, avg_ticket_price, trip_cost, profit_per_trip.

### 3.4 report_daily_cancel_refund_noshow
- Key: report_date, route_id, bus_type_id, seat_type_id.
- Fields: seat_type_code, cancel_count, refund_count, no_show_count, cancel_rate, refund_rate, no_show_rate.
- Constraint: no_show_count chi lay tu ticket_status NO_SHOW da qua cut-off rule.

### 3.5 report_daily_funnel
- Key: report_date, route_id, seat_type_id, channel, payment_method.
- Fields: seat_type_code, booking_created, payment_initiated, payment_success, booking_confirmed, step_conversion_*.
- Constraint: join event theo booking_id, khong theo session.
- Constraint: payment_success/confirmed chi tinh trong attribution window 24h tu booking_created.

### 3.6 report_alert_events
- Key: alert_id.
- Fields: metric_code, severity, observed_value, threshold_value, route_id, bus_type_id, trip_id, owner_user_id, status, detection_time, resolved_at, resolution_note.

## 4. Index va hieu nang
- [ ] Index (report_date, route_id, bus_type_id, seat_type_id) cho 5 view daily.
- [ ] Index (trip_id) cho report_trip_efficiency.
- [ ] Index (status, detection_time), (owner_user_id, status) cho alert_events.

## 4.1 Mapping seat type
- [ ] Mapping seat_number -> seat_type_id tu seat_map/bang loai ghe.
- [ ] Kiem tra seat_type null/unknown va co rule fallback ro rang.

## 5. Refresh strategy
- [ ] Incremental refresh moi 5-10 phut cho ngay hien tai.
- [ ] Backfill qua khu chay theo batch ban dem.
- [ ] Alert evaluate moi 5 phut.

## 6. Doi soat du lieu
- [ ] Tao 20 bo test data de doi soat tay.
- [ ] Script compare KPI reports vs query raw.
- [ ] Log sai so va auto fail neu > 0.5%.
- [ ] Script doi soat naming/metric formula (avg_ticket_price, revenue_per_capacity_seat, profit_per_trip).

## 7. Migration + rollback
- [ ] Script migration co id ro rang.
- [ ] Script rollback cho tung view/index.
- [ ] Chay migration tren staging truoc.

## 8. Ke hoach seed du lieu test (bat buoc)
- [ ] Seed ~2000 customer that.
- [ ] Seed 50-70 tai xe.
- [ ] Seed 10-15 staff dieu phoi.
- [ ] Tao trip + bus assignment + crew assignment day du (trip nao cung co doi ngu/ca xe).
- [ ] Co booking customer + guest.
- [ ] Dam bao 1 ghe = 1 ve trong tap valid.
- [ ] Co ve huy, ve chua thanh toan, booking huy mot phan.

## 9. Rule valid du lieu truoc khi insert
- [ ] Du lieu valid phai di qua backend validation pipeline (khong bypass SQL raw).
- [ ] Khong overlap trip/assignment trong tap valid.
- [ ] Khong co tai xe chay 2 chuyen cung luc trong tap valid.
- [ ] Khong vi pham luat lao dong trong tap valid.

## 10. Tap du lieu loi co chu dich (negative pack)
- [ ] Driver vi pham luat lao dong.
- [ ] Trip/assignment overlap.
- [ ] Driver double-booked cung thoi diem.
- [ ] Seat/ticket state conflict de test alert va hardening.
- [ ] Tach schema/namespace hoac tag ro rang de tranh tron voi tap valid.

## 11. Doi soat KPI voi tap valid
- [ ] KPI report chi doi soat tren tap valid baseline.
- [ ] Sai so KPI tong <= 0.5%.
- [ ] Log bo record bi loai/invalid de de truy vet.
