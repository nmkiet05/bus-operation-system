# Plan Trien Khai Bao Cao Kinh Doanh Va Alert Center

## 1. Muc tieu
- Chot bo bao cao de quan tri doanh thu, lap day, hieu qua van hanh.
- Ho tro phat hien som van de de team tap trung fix loi.
- Tach rieng Alert Center de phuc vu xu ly su co theo SLA.

## 2. Pham vi trien khai
- 5 bao cao loi:
  - Bao cao doanh thu tong hop.
  - Bao cao ti le lap day (load factor).
  - Bao cao hieu qua chuyen (revenue per trip/seat).
  - Bao cao huy ve, hoan tien, no-show.
  - Bao cao funnel booking -> payment -> confirmed.
- 1 module tach rieng:
  - Alert Center van hanh (gom canh bao bat thuong tu 5 bao cao loi).

## 2.1 Quy mo du lieu test bat buoc (gan san xuat)
- Customer that: ~2000 records.
- Tai xe: 50-70 records.
- Nhan vien dieu phoi/staff van hanh: 10-15 records.
- Tat ca trip co doi ngu + ca xe ro rang (main driver/co-driver neu co).

## 2.2 Nguyen tac seed du lieu
- Chi ghi du lieu da pass validation backend, khong insert tay bo qua business rule.
- Booking phai dung chuan 1 ghe = 1 ve (khong double booking seat).
- Co booking cua customer va guest.
- Co ve da huy, ve chua thanh toan, va booking co huy mot phan ve.
- Co du lieu doi khan cap de test quy trinh approve/review/escalate.

## 2.3 Tap du lieu loi co chu dich (negative scenarios)
- Tai xe vi pham luat lao dong (vuot gio/ngay, vuot gio/lien tuc, thieu nghi).
- Lich overlap trip/assignment.
- 1 tai xe bi gan 2 chuyen cung thoi diem.
- Trip co booking/seat state khong hop le de test alert + hardening.

Ghi chu:
- Tap loi co chu dich tach rieng voi tap du lieu valid de doi soat KPI.
- Alert Center phai nhan duoc su kien tu tap loi co chu dich de test SLA lifecycle.

## 3. Kien truc nghiep vu
- Lop 1: Dashboard phan tich (nhin xu huong).
- Lop 2: Alert Center (nhin viec can xu ly ngay).
- Lop 3: Drill-down ve chi tiet chuyen, booking, ticket.

Nguyen tac:
- Bao cao va canh bao dung chung metric contract.
- Alert Center khong tinh toan rieng metric, chi dung ket qua metric + rule.
- Moi canh bao phai co owner, severity, SLA, trang thai xu ly.
- Khong gop chung nhu cau tat ca loai ghe: bat buoc phan tach theo seat_class.

## 3.1 Glossary bat buoc truoc khi implement
- Booking state machine (single source of truth):
  - CREATED -> PAYMENT_INITIATED -> PAYMENT_SUCCESS -> CONFIRMED -> COMPLETED
  - Nhom that bai/khong hoan tat: CANCELLED, PAYMENT_FAILED, EXPIRED
- Dinh nghia valid trip cho KPI van hanh:
  - completed_trips = trips co status COMPLETED
  - Khong dua CANCELLED vao mau so revenue_per_trip/profit_per_trip
- Dinh nghia booking hop le cho doanh thu:
  - booking/ticket da du dieu kien ghi nhan doanh thu theo contract V1

## 4. Metric contract bat buoc (v1)
### 4.1 Revenue
- gross_revenue: Tong tien tu booking da ghi nhan (confirmed/completed).
- refund_amount: Tong tien refund thanh cong.
- net_revenue = gross_revenue - refund_amount.
- aov = net_revenue / so_booking_hop_le.

### 4.2 Load factor
- available_seats: Tong ghe cung ung cua tap chuyen theo bo loc + seat_class.
- sold_seats: Tong ve da ban hop le theo seat_class.
- load_factor = sold_seats / available_seats * 100 (tinh rieng tung seat_class).
- seat_class bat buoc v1: BUSINESS, SLEEPER, ECONOMY.

### 4.3 Efficiency
- revenue_per_trip = net_revenue / so_trip_hop_le.
- avg_ticket_price (alias revenue_per_sold_seat) = net_revenue / sold_seats.
- revenue_per_capacity_seat (ten chuan) = net_revenue / available_seats.
- profit_per_trip = (net_revenue - trip_cost) / completed_trips.

### 4.4 Refund/Cancel/No-show
- cancel_rate = so_ve_cancelled / tong_ve_tao.
- refund_rate = so_ve_refunded / tong_ve_confirmed.
- no_show_rate = so_ve_no_show / tong_ve_confirmed.

### 4.5 Funnel
- booking_created.
- payment_initiated.
- payment_success.
- booking_confirmed.
- conversion theo tung buoc.
- Identity rule: funnel theo booking_id (khong theo session).
- Attribution window v1: 24h tu booking_created den payment_success/confirmed.

### 4.6 Quy uoc chung
- Timezone: Asia/Ho_Chi_Minh.
- Grain mac dinh: day.
- Bo loc chung: from_date, to_date, route_id, bus_type_id, seat_class, departure_time_bucket.
- Week granularity: ISO-8601, tu thu Hai den Chu Nhat.
- Month granularity: theo lich local timezone (khong tach theo UTC boundary).
- Currency field bat buoc trong response summary: VND (v1).

### 4.7 No-show source of truth
- Nguon no-show phai xac dinh ro qua ticket lifecycle:
  - ticket_status = NO_SHOW do dispatcher/driver check sau gio khoi hanh theo rule.
- Rule v1 de tranh tranh cai:
  - chi tinh no-show voi ve da CONFIRMED va qua nguong cut-off sau gio khoi hanh.

## 5. Danh sach 5 bao cao loi
## 5.1 Bao cao doanh thu tong hop
Muc tieu:
- Theo doi tong thu, thuan thu va xu huong doanh thu.

KPI:
- gross_revenue, refund_amount, net_revenue, aov.
- revenue by route.
- revenue by bus_type.
- revenue by time bucket.

Visual:
- KPI cards.
- Trend line theo ngay.
- Bar chart theo route va bus type.
- Bang chi tiet theo ngay/tuyen/chuyen.

Drill-down:
- month -> day -> route -> trip -> booking.

## 5.2 Bao cao ti le lap day
Muc tieu:
- Theo doi muc do toi uu cong suat ghe.

KPI:
- avg_load_factor.
- top low-load trips.
- top high-load trips.
- empty_seats_avg.
- demand_split_by_seat_class.

Visual:
- Heatmap route x hour.
- Trend line load factor.
- Stacked/clustered chart theo seat_class (BUSINESS/SLEEPER/ECONOMY).
- Bang ranking chuyen.

Drill-down:
- route -> bus_type -> seat_class -> trip -> seat status.

## 5.3 Bao cao hieu qua chuyen
Muc tieu:
- Danh gia hieu qua tai chinh o cap chuyen.

KPI:
- revenue_per_trip.
- revenue_per_available_seat.
- revenue_per_sold_seat.
- load_factor + net_revenue theo chuyen.

Visual:
- Scatter plot load_factor vs revenue_per_trip.
- Top/Bottom trips table.

Drill-down:
- trip -> seat_class mix -> ticket mix -> payment mix.

## 5.4 Bao cao huy/hoan/no-show
Muc tieu:
- Giam that thoat doanh thu va cai thien chat luong van hanh.

KPI:
- cancel_rate, refund_rate, no_show_rate.
- ly do huy/hoan pho bien.
- khung gio co ti le huy cao.

Visual:
- Stacked trend.
- Pie or bar reason breakdown.
- Bang chi tiet route/day.

Drill-down:
- route -> trip -> booking/ticket -> reason.

## 5.5 Bao cao funnel booking -> payment -> confirmed
Muc tieu:
- Phat hien diem roi conversion.

KPI:
- booking_created.
- payment_initiated.
- payment_success.
- booking_confirmed.
- step conversion.

Visual:
- Funnel chart.
- Drop-off chart theo payment_method/channel.

Drill-down:
- route -> payment gateway -> error bucket.

## 6. Alert Center van hanh (tach rieng)
Muc tieu:
- Gom tat ca bat thuong vao 1 man hinh xu ly su co.

Nhom canh bao:
- Revenue anomaly.
- Load factor anomaly.
- Trip efficiency anomaly.
- Refund/Cancel/No-show anomaly.
- Funnel conversion anomaly.
- Ops SLA anomaly (tre chuyen, over-limit duty).

Schema canh bao de xuat:
- alert_id.
- metric_code.
- severity (critical/high/medium/low).
- route_id, bus_type_id, trip_id (nullable).
- observed_value.
- threshold_value.
- detection_time.
- owner_user_id.
- status (new/ack/in_progress/resolved/ignored).
- resolution_note.
- resolved_at.

SLA de xuat:
- critical: 30 phut.
- high: 2 gio.
- medium: trong ngay.
- low: trong 48 gio.

Rule nguong mac dinh:
- net_revenue giam > 20% so voi moving average 7 ngay.
- load_factor < 40% trong 3 ngay lien tiep tren cung route.
- drop payment_success > 15% so voi baseline 7 ngay.
- cancel_rate tang > 10 diem % theo route/day.
- avg_ticket_price giam > 15% theo seat_class so voi baseline 14 ngay.
- profit_per_trip < 0 tren >= 5 trip lien tiep cung route.

## 7. Data layer de xuat
Bang/view tong hop:
- report_daily_revenue.
- report_daily_load_factor.
- report_trip_efficiency.
- report_daily_cancel_refund_noshow.
- report_daily_funnel.
- report_alert_events.

Refresh strategy:
- Incremental refresh 5-10 phut cho ngay hien tai.
- Batch backfill ban dem cho du lieu cu.
- Alert evaluate 5 phut/lần.

Index toi thieu:
- (report_date, route_id, bus_type_id).
- (trip_id).
- (status, detection_time) cho alert.

## 8. API contract de xuat
Bao cao:
- GET /api/reports/revenue
- GET /api/reports/load-factor
- GET /api/reports/trip-efficiency
- GET /api/reports/cancel-refund-noshow
- GET /api/reports/funnel

Alert Center:
- GET /api/reports/alerts
- PATCH /api/reports/alerts/{id}/ack
- PATCH /api/reports/alerts/{id}/resolve
- PATCH /api/reports/alerts/{id}/ignore

Query params chung:
- fromDate, toDate, routeId, busTypeId, seatClass, granularity, page, size, sort.

Response shape chung:
- summary.
- series.
- breakdown.
- pagination.
- filters_applied.

## 9. UI/UX plan
Trang Reports:
- Tab 1: Revenue.
- Tab 2: Load factor.
- Tab 3: Trip efficiency.
- Tab 4: Cancel/Refund/No-show.
- Tab 5: Funnel.

Trang Alert Center (tach rieng):
- Danh sach canh bao theo severity.
- Bo loc theo status/owner/route.
- Side panel chi tiet + action ACK/Resolve.
- Link drill-back ve report lien quan.

Dong bo bo loc:
- Date range global.
- Route/Bus type shared filter.

## 10. Bao mat va phan quyen
- Chi role quan tri/van hanh duoc xem reports.
- Alert action (ack/resolve) can role staff tro len.
- Audit log cho moi action ack/resolve.

## 11. Ke hoach trien khai theo sprint
Sprint 1 (1-1.5 tuan):
- Chot metric contract v1.
- Implement 2 report uu tien: revenue, load-factor.
- Tao API + UI co drill-down cap route/day.
- Nhung badge canh bao tren 2 report.

Sprint 2 (1-1.5 tuan):
- Implement 3 report con lai.
- Xay Alert Center tach rieng.
- Action ACK/Resolve + owner + SLA.
- Export CSV/XLSX.

Sprint 3 (1 tuan):
- Toi uu query/cache/index.
- Rule tuning nguong canh bao.
- UAT voi van hanh/tai chinh.
- Hardening + rollout production.

## 12. Test plan
### 12.1 Data correctness
- 20 bo du lieu mau doi soat tay.
- So sanh tong doanh thu voi SQL raw.
- So sanh load factor voi seat count thuc te.

### 12.2 API
- Unit test metric calculator.
- Integration test endpoint theo bo loc.
- Contract test response schema.

### 12.3 UI
- E2E filter + drill-down.
- Snapshot test chart card.
- Export test.

### 12.4 Alert
- Simulate anomaly data.
- Verify alert generated + SLA timer.
- Verify ack/resolve flow va audit log.

## 13. Acceptance criteria
- 5 report loi hoat dong day du KPI.
- Alert Center tach rieng hoat dong voi SLA.
- Sai so KPI tong <= 0.5% tren tap doi soat.
- API p95 < 800ms bo loc pho bien.
- Dashboard first load < 2s cho view mac dinh.
- Full role-based access + audit log action.

## 14. Rui ro va giam thieu
Rui ro:
- Lech metric giua team.
- Query cham tren du lieu lon.
- Alert qua nhieu gay nhieu.

Giam thieu:
- Metric contract ky duyet ngay dau.
- Materialized view + index + cache.
- Rule severity + suppression window + owner.

## 15. Nhiem vu can chot ngay
- Chot danh sach status tinh doanh thu.
- Chot dinh nghia sold_seats va no_show.
- Chot baseline nguong alert (version v1).
- Chot role duoc resolve alert.
