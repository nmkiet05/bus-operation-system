# Backlog Backend/API - Reports

## 1. Endpoint can phat hanh
- [ ] GET /api/reports/revenue
- [ ] GET /api/reports/load-factor
- [ ] GET /api/reports/trip-efficiency
- [ ] GET /api/reports/cancel-refund-noshow
- [ ] GET /api/reports/funnel
- [ ] GET /api/reports/alerts
- [ ] PATCH /api/reports/alerts/{id}/ack
- [ ] PATCH /api/reports/alerts/{id}/resolve
- [ ] PATCH /api/reports/alerts/{id}/ignore

## 2. Query params chung
- [ ] fromDate
- [ ] toDate
- [ ] routeId (optional)
- [ ] busTypeId (optional)
- [ ] seatTypeId / seatTypeCode (optional)
- [ ] granularity (day/week/month)
- [ ] page, size, sort

## 3. Response contract chung
- [ ] summary
- [ ] series
- [ ] breakdown
- [ ] breakdownBySeatType (BUSINESS/SLEEPER/ECONOMY)
- [ ] pagination
- [ ] filtersApplied
- [ ] glossaryVersion + metricDefinitionVersion

## 4. Security + RBAC
- [ ] Role admin/manager/staff van hanh duoc xem reports.
- [ ] Action alert ack/resolve/ignore can role staff tro len.
- [ ] Ghi audit log voi userId, action, alertId, timestamp.

## 5. Service layer
- [ ] ReportRevenueService
- [ ] ReportLoadFactorService
- [ ] ReportTripEfficiencyService
- [ ] ReportQualityService (cancel/refund/no-show)
- [ ] ReportFunnelService
- [ ] AlertCenterService

## 6. Cache
- [ ] Cache key = hash(filters + endpoint + granularity).
- [ ] TTL 3-10 phut.
- [ ] Bust cache khi co su kien du lieu quan trong (booking_confirmed/refund_success).

## 7. Validation va hardening
- [ ] Validate date range max 366 ngay cho query ad-hoc.
- [ ] Validate sort fields hop le.
- [ ] Han che payload qua lon (pagination cap).
- [ ] Validate seatType filter hop le theo bang loai ghe.
- [ ] Week granularity theo ISO-8601 (Mon-Sun), ghi ro trong API docs.
- [ ] Funnel attribution window v1 = 24h theo booking_id.
- [ ] No-show chi tinh tu ticket_status NO_SHOW theo rule cut-off.

## 8. Test backend
- [ ] Unit test cho metric calculator.
- [ ] Integration test endpoint theo bo loc.
- [ ] Contract test schema response.
- [ ] Permission test 401/403.
- [ ] Performance smoke p95 < 800ms.
- [ ] Test so lieu khong gop chung giua BUSINESS/SLEEPER/ECONOMY.
- [ ] Test completed_trips la mau so cho revenue_per_trip/profit_per_trip.
- [ ] Test naming metric: revenue_per_capacity_seat (khong dung ten mo ho revenue_per_available_seat).

## 9. Error handling
- [ ] Ma loi chuan hoa cho report API.
- [ ] Fallback thong bao khi data source chua refresh.
- [ ] Khong lo internal SQL detail.

## 10. Seed pipeline qua backend (khong bypass)
- [ ] Co seed runner/service goi service layer de tao du lieu valid.
- [ ] Seed customer ~2000, driver 50-70, dispatcher/staff 10-15.
- [ ] Seed trip -> bus assignment -> crew assignment theo dung workflow backend.
- [ ] Seed booking customer/guest, co huong hieu trang thai paid/unpaid/cancelled/partial-cancel.

## 11. Validation gate truoc khi ghi du lieu
- [ ] Bat buoc check labor law cho driver assignment.
- [ ] Bat buoc check overlap trip/assignment.
- [ ] Bat buoc check seat uniqueness (1 ghe 1 ve) cho tap valid.
- [ ] Ghi log reject reason cho ban ghi khong hop le.

## 12. Test case cho doi khan cap
- [ ] Co 10-15 tai khoan dieu phoi de test approve/review/escalate.
- [ ] Test flow doi khan cap voi data dung + data loi.
- [ ] Audit log day du userId/action/timestamp/targetId.

## 13. Alert rule pack v1 (bat buoc)
- [ ] Rule revenue anomaly: net_revenue giam >20% vs MA7.
- [ ] Rule load anomaly: load_factor <40% trong 3 ngay lien tiep cung route.
- [ ] Rule funnel anomaly: payment_success drop >15% vs baseline 7 ngay.
- [ ] Rule quality anomaly: cancel_rate tang >10 diem % theo route/day.
- [ ] Rule seat-type anomaly: avg_ticket_price giam >15% theo seat_type vs baseline 14 ngay.
- [ ] Rule profitability anomaly: profit_per_trip <0 tren >=5 trip lien tiep.
