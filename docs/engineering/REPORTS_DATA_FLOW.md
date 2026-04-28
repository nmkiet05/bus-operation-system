# Reports Data Flow (OLAP Architecture)

## 1. The Reporting Challenge (OLTP vs OLAP)

### The Problem with JPA/Hibernate
In a standard CRUD (OLTP) application, generating aggregated reports using JPA/Hibernate leads to catastrophic N+1 query problems. For example, to calculate total revenue, Hibernate would typically fetch every single Booking, then lazily load its Tickets, then its Trip, then its Route. Over 6 months of data, this translates to hundreds of thousands of queries, crashing the server.

### The Solution: Native SQL & CTEs
For the `Reports` module, we strictly bypass Spring Data JPA entity fetching. Instead, we use **Native PostgreSQL Queries** combined with **Common Table Expressions (CTE)**. This shifts the heavy lifting of data aggregation to the PostgreSQL engine, which is highly optimized for this task.

## 2. Revenue Report Architecture

### Data Flow
1. **Controller**: Receives date range filters (e.g., `startDate`, `endDate`, `granularity`).
2. **Service**: Validates dates and passes parameters to a custom Native Query Repository.
3. **Repository**: Executes a complex Native SQL query using `NamedParameterJdbcTemplate` or a direct `@Query(nativeQuery = true)`.
4. **Database (CTE)**: PostgreSQL groups the bookings by `DATE_TRUNC`, joins necessary tables, and aggregates `SUM(total_amount)`.
5. **Mapping**: The flat result set is mapped to lightweight DTOs (Data Transfer Objects) instead of managed Entities.

### Example CTE Implementation
```sql
WITH date_series AS (
    -- Generate continuous date series to ensure no missing days in charts
    SELECT generate_series(:startDate\\:\\:date, :endDate\\:\\:date, '1 day'\\:\\:interval) AS date
),
revenue_data AS (
    -- Aggregate actual data
    SELECT 
        DATE_TRUNC('day', b.booking_date) AS date,
        SUM(b.total_amount) AS revenue,
        COUNT(b.id) AS booking_count
    FROM bookings b
    WHERE b.status = 'CONFIRMED'
    GROUP BY 1
)
SELECT 
    d.date, 
    COALESCE(r.revenue, 0) AS revenue,
    COALESCE(r.booking_count, 0) AS booking_count
FROM date_series d
LEFT JOIN revenue_data r ON d.date = r.date
ORDER BY d.date ASC;
```

## 3. Load Factor (Occupancy Rate) Analytics

The Load Factor indicates how full the buses are. This is a critical KPI for operations.

**Calculation:** `Load Factor = (Total Tickets Sold / Total Capacity) * 100`

### Implementation Detail
To calculate this efficiently, we leverage the `bus_type` table's capacity field and the `ticket` table's active reservations. We use PostgreSQL's `JSONB` parsing functions if needed to dynamically calculate total valid seats from the `seat_map`, though a redundant `capacity` integer is often maintained for performance.

## 4. Why This Architecture Excels
1. **Network Efficiency**: Reduces data transferred between the DB and Backend from megabytes of row data to kilobytes of pre-aggregated JSON.
2. **Memory Efficiency**: Eliminates JVM memory overhead since no heavy Hibernate Proxy objects are instantiated.
3. **Speed**: Query execution time drops from seconds to ~10-25 milliseconds.
