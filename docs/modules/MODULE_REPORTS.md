# Module Báo cáo (Reports)

## Overview
Module Reports cung cấp các báo cáo doanh thu và hệ số lấp đầy (Load Factor) để phục vụ việc ra quyết định kinh doanh.

## Architecture
Module tách biệt khỏi luồng ORM (JPA/Hibernate) để đảm bảo không gây thắt cổ chai hiệu năng cho hệ thống bán vé chính.

## Key Entities / Components
- `ReportAnalyticsController`: Expose các REST API báo cáo.
- `ReportAnalyticsServiceImpl`: Validate tham số ngày tháng, gọi Repository.
- `ReportAnalyticsRepository`: Thực thi Native SQL.

## Business Rules
- Báo cáo chỉ tính các vé đã thanh toán (`CONFIRMED`) và các vé đã sử dụng.
- Tiền hoàn trả (Refund) được tự động khấu trừ để tính ra Doanh thu ròng (Net Revenue).

## Technical Notes
- Xem tài liệu `docs/engineering/REPORTS_DATA_FLOW.md` để biết chi tiết về cấu trúc câu query CTE siêu tốc và kỹ thuật bóc tách JSONB LATERAL.
