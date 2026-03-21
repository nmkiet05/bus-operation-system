# Backlog Frontend + Alert Center

## 1. IA (Information Architecture)
- [ ] Trang Reports (5 tabs).
- [ ] Trang Alert Center tach rieng.
- [ ] Deep link tu alert -> tab report lien quan.

## 2. Reports UI
### 2.1 Revenue tab
- [ ] KPI cards: gross, refund, net, aov.
- [ ] Trend chart.
- [ ] Breakdown by route/bus type.
- [ ] Breakdown by seat type (BUSINESS/SLEEPER/ECONOMY).
- [ ] Drill-down table.

### 2.2 Load factor tab
- [ ] KPI cards: avg load, low-load trips, high-load trips.
- [ ] Heatmap route x hour.
- [ ] Stacked/clustered chart by seat type.
- [ ] Trip table.

### 2.3 Trip efficiency tab
- [ ] KPI cards: revenue/trip, revenue/seat.
- [ ] Scatter chart load vs revenue/trip.
- [ ] Toggle theo tung seat type.
- [ ] Top/bottom trips.

### 2.4 Cancel/Refund/No-show tab
- [ ] KPI cards + stacked trend.
- [ ] Reason breakdown.
- [ ] Rate split by seat type.
- [ ] Detail table.

### 2.5 Funnel tab
- [ ] Funnel chart.
- [ ] Step conversion cards.
- [ ] Drop-off by method/channel.
- [ ] Drop-off by seat type.

## 3. Alert Center UI
- [ ] Alert list (severity, metric, route, value, threshold, age).
- [ ] Filters: status, severity, owner, route.
- [ ] Action buttons: ACK, Resolve, Ignore.
- [ ] Detail panel + timeline + resolution note.
- [ ] SLA countdown indicator.

## 4. Filter UX dung chung
- [ ] Global date range.
- [ ] Route, bus type, granularity.
- [ ] Seat type filter (Business / Sleeper / Economy).
- [ ] Saved filter preset.
- [ ] Clear all filter.

## 5. Export va chia se
- [ ] Export CSV/XLSX cho moi tab.
- [ ] Export danh sach alert theo filter.

## 6. FE quality
- [ ] Skeleton/loading state.
- [ ] Empty state co huong dan.
- [ ] Error state retry.
- [ ] Responsive desktop/tablet.

## 7. FE testing
- [ ] Unit test transform data chart.
- [ ] E2E flow: filter -> drill -> export.
- [ ] E2E alert lifecycle: new -> ack -> resolved.

## 8. UAT checklist
- [ ] So lieu KPI khop bo doi soat.
- [ ] Drill-down dung record.
- [ ] Alert action cap nhat dung trang thai.
- [ ] SLA color/chuoi dem dung.
