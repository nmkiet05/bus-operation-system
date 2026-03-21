# Overview Plan Reports + Alert Center

## 1. Muc tieu
- Trien khai 5 bao cao loi + 1 Alert Center tach rieng.
- Dong bo metric contract giua DB, Backend, Frontend.
- Uu tien tinh dung so lieu truoc tinh dep UI.

## 2. Deliverables
- Bao cao 1: Revenue tong hop.
- Bao cao 2: Load factor theo route/bus type/trip.
- Bao cao 3: Trip efficiency.
- Bao cao 4: Cancel/Refund/No-show.
- Bao cao 5: Funnel booking -> payment -> confirmed.
- Module 6: Alert Center van hanh (tach rieng, co SLA).

## 3. Tai lieu da tach
- DB/Data layer: docs/backlog-reports-db-2026-03-17.md
- Backend/API: docs/backlog-reports-be-2026-03-17.md
- Frontend/Alert: docs/backlog-reports-fe-alert-2026-03-17.md

## 4. Thu tu uu tien
- Phase 1: Revenue + Load factor + filter chung.
- Phase 2: 3 bao cao con lai.
- Phase 3: Alert Center tach rieng + SLA action.
- Phase 4: Tuning hieu nang + UAT + go-live.

## 5. Metric contract (tom tat)
- gross_revenue, refund_amount, net_revenue.
- sold_seats, available_seats, load_factor.
- revenue_per_trip, revenue_per_available_seat, revenue_per_sold_seat.
- cancel_rate, refund_rate, no_show_rate.
- funnel conversion theo tung buoc.

## 6. Acceptance gate
- Sai so KPI tong <= 0.5% voi bo doi soat mau.
- API p95 < 800ms voi bo loc pho bien.
- Dashboard first load < 2s view mac dinh.
- Alert co owner + SLA + audit log action.
