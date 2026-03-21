# Checklist Seed Runner + KPI Doi Soat

## A. Preflight du lieu cu (bat buoc)
- [ ] Chay preflight inspect de lay baseline counts (users/trips/bookings).
- [ ] Chon 1 trong 2 strategy truoc khi seed:
  - [ ] REPAIR_IN_PLACE
  - [ ] BACKUP_AND_REPLACE
- [ ] Neu BACKUP_AND_REPLACE: tao backup dump/snapshot truoc khi thay the.
- [ ] Log strategy + owner + timestamp vao release note.

## B. Seed valid-pack (qua service layer)
- [ ] Bat seed.runner.enabled=true, dry-run=true de xem ke hoach.
- [ ] Kiem tra target volume: customer=~2000, driver=50-70, dispatcher=10-15.
- [ ] Chuyen dry-run=false va chay seed valid-pack.
- [ ] Dam bao trip co doi ngu + ca xe ro rang.
- [ ] Dam bao booking customer + guest.
- [ ] Dam bao 1 ghe = 1 ve (khong duplicate seat).
- [ ] Co trang thai paid/unpaid/cancelled/partial-cancel.

## C. Seed negative-pack (co chu dich)
- [ ] Tao case vi pham luat lao dong.
- [ ] Tao case overlap trip/assignment.
- [ ] Tao case 1 tai xe 2 chuyen cung thoi diem.
- [ ] Tao case seat/ticket conflict de test alert/hardening.
- [ ] Tach ro negative-pack khoi valid-pack.

## D. KPI doi soat sau seed
- [ ] Chay bo KPI reports tren valid-pack baseline.
- [ ] Sai so KPI tong <= 0.5%.
- [ ] Doi soat gross_revenue/refund/net_revenue.
- [ ] Doi soat sold_seats/available_seats/load_factor.
- [ ] Doi soat cancel/refund/no_show rates.
- [ ] Doi soat funnel step conversion.

## E. Alert Center UAT
- [ ] Alert tao owner + severity + SLA.
- [ ] Test lifecycle new -> ack -> resolve -> ignore.
- [ ] Co audit log userId/action/alertId/timestamp.
- [ ] Deep-link report <-> alert hoat dong dung.
