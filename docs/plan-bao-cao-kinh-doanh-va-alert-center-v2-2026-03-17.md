# Plan Báo Cáo Kinh Doanh và Alert Center - V2

## 1. Mục tiêu V2
- Nâng chuẩn vận hành sau khi V1 đã chạy ổn định.
- Tăng độ tin cậy dữ liệu và khả năng giám sát hệ thống báo cáo.
- Bổ sung các cơ chế enterprise còn thiếu trong V1.

## 2. Phạm vi V2
- Data freshness đầy đủ cho toàn bộ report API.
- Reconciliation tự động giữa report layer và raw SQL.
- Retry/failure handling cho refresh job (ETL/materialized view/job tổng hợp).
- Rule alert nâng cao theo seat class và profitability.

## 3. Hạng mục chi tiết

### 3.1 Data Freshness
- Bổ sung metadata trong response:
  - last_updated_at
  - data_latency_seconds
  - freshness_status (fresh/stale/delayed)
- Định nghĩa ngưỡng:
  - warning: latency > 15 phút
  - critical: latency > 30 phút
- Hiển thị nhãn "Dữ liệu cập nhật X phút trước" trên dashboard.

### 3.2 Reconciliation Process
- Tạo daily reconciliation job:
  - so sánh KPI từ report views với raw SQL baseline
  - lưu sai lệch theo metric
- Bảng log đối soát đề xuất:
  - reconciliation_id, report_name, metric_code, expected_value, actual_value, diff_percent, detected_at, status
- Quy tắc fail:
  - diff_percent > 0.5% => failed + tạo cảnh báo cho owner

### 3.3 Retry và Failure Handling
- Retry policy:
  - exponential backoff (1m, 3m, 5m)
  - max retries = 3
- Khi vượt retry:
  - ghi dead-letter record
  - tạo alert severity high
- Có cơ chế replay:
  - re-run theo report/date range/partition

### 3.4 Metric nâng cao cho V2
- Profitability mở rộng:
  - profit_per_trip theo route/seat_class
  - rolling 7-day, 14-day baseline
- Alert rule nâng cao:
  - avg_ticket_price giảm > 15% theo seat_class
  - profit_per_trip < 0 trong 5 chuyến liên tiếp

## 4. API/Contract bổ sung V2
- reports response:
  - freshness metadata
  - reconciliation_status (optional)
- alert response:
  - source_job_id
  - retry_count
  - dead_letter_ref (nếu có)

## 4.1 Schema V2 - Bảng cần thêm

### A. report_refresh_status
Mục đích:
- Theo dõi độ mới dữ liệu cho từng report dataset.

Cột chính đề xuất:
- id (bigserial, pk)
- report_code (varchar, not null)           -- revenue/load_factor/funnel/...
- grain (varchar, not null)                 -- day/week/month
- partition_key (varchar, null)             -- ví dụ: 2026-03-17 hoặc route-specific
- last_updated_at (timestamp, not null)
- data_latency_seconds (bigint, not null)
- freshness_status (varchar, not null)      -- fresh/stale/delayed
- source_job_run_id (bigint, null)
- created_at, updated_at

Index:
- idx_refresh_status_code_grain (report_code, grain)
- idx_refresh_status_freshness (freshness_status, last_updated_at)

### B. report_reconciliation_log
Mục đích:
- Lưu kết quả đối soát KPI giữa report layer và raw SQL.

Cột chính đề xuất:
- reconciliation_id (bigserial, pk)
- report_code (varchar, not null)
- metric_code (varchar, not null)
- dimension_key (jsonb, null)               -- route/bus_type/seat_class/time bucket
- expected_value (numeric(20,6), not null)  -- từ raw SQL baseline
- actual_value (numeric(20,6), not null)    -- từ report view/api
- diff_abs (numeric(20,6), not null)
- diff_percent (numeric(10,4), not null)
- threshold_percent (numeric(10,4), not null default 0.5)
- status (varchar, not null)                -- PASS/FAIL
- detected_at (timestamp, not null)
- job_run_id (bigint, null)
- note (text, null)

Index:
- idx_recon_detected (detected_at desc)
- idx_recon_report_metric (report_code, metric_code, status)

### C. report_job_run
Mục đích:
- Theo dõi vòng đời chạy job refresh/reconciliation/evaluation.

Cột chính đề xuất:
- job_run_id (bigserial, pk)
- job_type (varchar, not null)              -- refresh/reconciliation/alert_eval
- report_code (varchar, null)
- started_at (timestamp, not null)
- finished_at (timestamp, null)
- duration_ms (bigint, null)
- status (varchar, not null)                -- RUNNING/SUCCESS/FAILED/RETRYING
- retry_count (int, not null default 0)
- max_retry (int, not null default 3)
- error_code (varchar, null)
- error_message (text, null)
- triggered_by (varchar, null)              -- scheduler/manual/replay

Index:
- idx_job_run_type_time (job_type, started_at desc)
- idx_job_run_status (status, started_at desc)

### D. report_job_dead_letter
Mục đích:
- Lưu payload/job thất bại quá số lần retry để replay sau.

Cột chính đề xuất:
- dead_letter_id (bigserial, pk)
- job_run_id (bigint, fk -> report_job_run.job_run_id)
- report_code (varchar, null)
- payload (jsonb, not null)
- failed_at (timestamp, not null)
- retry_count (int, not null)
- error_code (varchar, null)
- error_message (text, null)
- replay_status (varchar, not null default 'PENDING')   -- PENDING/REPLAYED/IGNORED
- replayed_at (timestamp, null)
- replay_note (text, null)

Index:
- idx_dead_letter_status_time (replay_status, failed_at desc)
- idx_dead_letter_report (report_code, replay_status)

### E. report_alert_rule_config (tuỳ chọn nhưng nên có)
Mục đích:
- Cấu hình ngưỡng alert động theo route/seat_class.

Cột chính đề xuất:
- rule_id (bigserial, pk)
- metric_code (varchar, not null)
- scope_type (varchar, not null)            -- GLOBAL/ROUTE/SEAT_CLASS/ROUTE_SEAT_CLASS
- scope_key (varchar, null)
- threshold_operator (varchar, not null)    -- LT/GT/DELTA_PCT
- threshold_value (numeric(20,6), not null)
- baseline_window_days (int, null)
- consecutive_breach_count (int, null)
- severity (varchar, not null)
- is_active (boolean, not null default true)
- updated_by (bigint, null)
- updated_at (timestamp, not null)

Index:
- idx_alert_rule_metric_scope (metric_code, scope_type, is_active)

## 4.2 Quan hệ và luồng chính
- report_job_run 1-N report_reconciliation_log (qua job_run_id)
- report_job_run 1-N report_refresh_status (qua source_job_run_id)
- report_job_run 1-N report_job_dead_letter
- report_alert_rule_config dùng bởi alert evaluator để sinh record vào report_alert_events (V1)

## 4.3 Gợi ý migration
- V2_001__create_report_refresh_status.sql
- V2_002__create_report_reconciliation_log.sql
- V2_003__create_report_job_run.sql
- V2_004__create_report_job_dead_letter.sql
- V2_005__create_report_alert_rule_config.sql

## 5. Điều kiện vào V2
- V1 đã đạt:
  - KPI sai số <= 0.5%
  - API p95 < 800ms
  - Dashboard first load < 2s
- Alert Center V1 đã vận hành ổn định với lifecycle ack/resolve.

## 6. Thứ tự triển khai V2
1. Data freshness metadata + UI badge
2. Reconciliation job + mismatch log
3. Retry/dead-letter/replay cho refresh jobs
4. Rule alert nâng cao + tuning

## 7. Ghi chú quản trị phạm vi
- Từ thời điểm này, các hạng mục nâng cao của phần báo cáo được ghi nhận vào V2.
- Không bổ sung thêm vào tài liệu V1 để tránh phình phạm vi và khó kiểm soát rollback.
