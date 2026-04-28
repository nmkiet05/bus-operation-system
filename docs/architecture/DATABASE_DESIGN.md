# Database Design (PostgreSQL)

## 1. Overview
The system uses **PostgreSQL 15** as the primary relational database. The schema is version-controlled via Flyway (`V1__init_schema.sql`). The architecture follows a **Modular Monolith** design with lightweight **Event Sourcing** capabilities (via trigger-based `audit_logs`).

## 2. Table Architecture by Domain

### 2.1. Identity & Auth
- `users`: Core table for accounts, passwords, and `employee_code`. Includes `version` column for Optimistic Locking.
- `user_roles`: Multi-role support.
- **Sub-types:** `admin_detail`, `staff_detail` (contains `station_id`), `driver_detail` (license expiration).
- `refresh_tokens` & `user_devices`: For JWT refresh and Firebase Cloud Messaging (FCM).

### 2.2. Master Data & Catalog
- `province`, `bus_station` (with `gov_code`).
- `ticket_office`: Ticket offices belonging to stations or external agencies.
- `departments`: Hierarchical organization tree via `parent_id`.
- `depot`: Parking depots (Logically separated from stations).

### 2.3. Fleet & Planning
- `bus_type`: Defines vehicle types. **Seat maps are stored dynamically as `JSONB` arrays.**
- `bus`: Physical vehicles (ODO, license plates, inspection expiry).
- `route`: Fixed transit routes.
- `pickup_point`: Waypoints along a route (ordered by `sequence_order`).
- `trip_schedule`: Master schedules. Uses `operation_days_bitmap` (SmallInt) to efficiently encode days of the week.

### 2.4. Core Operation & Dispatch
- `bus_assignment`: **Vehicle Duty** — Tracks the lifecycle of a bus from `start_depot_id` to `end_depot_id`, monitoring Fuel & ODO.
- `trip`: **Actual Trips** — Generated from `trip_schedule`. Linked to `bus` and `bus_assignment`.
- `driver_assignment`: Assigns drivers to trips (includes `role` and assigned `seat_number`).
- `vehicle_handover`: Handover protocol between drivers (RECEIVE / RETURN).
- `trip_change_request`: Handles driver/vehicle change requests (Pre-approval workflow with `urgency_zone`).

### 2.5. Sales & Pricing
- `booking`: Reservation orders (Holds seats for 15 minutes, PENDING/CONFIRMED status).
- `ticket`: Individual tickets. 1-to-1 relationship with a seat on a trip.
- `fare_config`: Static pricing configuration (By Route + BusType + Date).
- `fare_policies`: Dynamic pricing (Refunds/Discounts). **Conditions and Actions are stored as `JSONB`**.
- `refund_transactions`: Refund history logging.

## 3. Database Patterns & Advanced Features

### Dynamic Data via JSONB
The system leverages PostgreSQL `JSONB` to avoid complex EAV (Entity-Attribute-Value) anti-patterns:
- `bus_type.seat_map`: JSON array defining physical seat layouts.
- `fare_policies.conditions` / `action`: JSON-based pricing logic.

### Centralized Audit Logging (Trigger-based)
Instead of using heavy ORM auditing tools like Hibernate Envers, the system uses a custom PL/pgSQL function `log_audit_trail()`:
- Automatically captures `INSERT`, `UPDATE`, `DELETE`, `SOFT_DELETE`, and `RESTORE` events.
- Compares `OLD` and `NEW` records.
- Extracts only the `changed_fields` and their values into a `JSONB` object in the `audit_logs` table.

### Complex Constraints & Overlap Prevention
The database ensures strict data integrity through rigorous PL/pgSQL Triggers:
- `trg_check_seat_availability`: Prevents Overselling at the lowest database level.
- `trg_check_trip_overlap`: Prevents a single bus from running concurrent overlapping trips.
- `trg_check_handover_overlap`: Prevents conflicting vehicle handover reports.
- `trg_trip_assignment_bound_check`: Ensures trips fall perfectly within their parent `bus_assignment` duty timeframe.
- **Partial Unique Indexes** (e.g., `WHERE deleted_at IS NULL AND status = 'ACTIVE'`) are heavily used to enforce uniqueness constraints alongside Soft-Delete architecture.
