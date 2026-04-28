# Module: Reports

## Purpose
Generates high-performance Business Intelligence (BI) data for the Management Portal dashboard.

## Core Metrics
- **Revenue Aggregation**: Grouped by date, route, and seat class.
- **Load Factor (Occupancy)**: Percentage of seats sold vs capacity.

## Key Technical Features
- **Bypassing ORM for OLAP**: Standard Spring Data JPA is designed for OLTP (Transaction Processing) and suffers from severe N+1 query problems when aggregating millions of rows.
- **PostgreSQL CTEs**: The Reports module uses raw `NamedParameterJdbcTemplate` to execute Common Table Expressions. The aggregation happens entirely on the Database engine side, reducing execution time from seconds to ~15ms and preventing memory overflow on the JVM.
