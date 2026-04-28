# System Overview

## 1. Project Context
Bus Operation System (BOS) is an enterprise-grade transit management platform designed to solve operational challenges for intercity bus companies. It replaces manual spreadsheet tracking and legacy monolithic systems with a modern, high-performance architecture.

## 2. Core Modules
The system is built as a **Modular Monolith** to keep deployment simple while enforcing strict domain boundaries:

1. **Identity & HR**: Manages users, roles (RBAC), and driver profiles (licenses, compliance).
2. **Catalog**: Master data management for provinces, bus stations, depots, and ticket offices.
3. **Fleet & Planning**: Manages vehicles, dynamic seat maps (JSONB), and route planning using bitwise schedule encoding.
4. **Operations (Core)**: Handles daily trip generation, driver/bus assignments, and a real-time **5-Zone Emergency Dispatch System**.
5. **Sales & Pricing**: E-commerce ticket booking flow, dynamic fare policies, and **Redis Distributed Locking** to prevent double-booking.
6. **Reports**: High-performance OLAP analytics for revenue and load-factor KPIs using PostgreSQL CTEs.

## 3. Technology Highlights
- **Backend**: Java 21 + Spring Boot 3.4.1 (Modular Monolith)
- **Frontend**: Next.js 15 (React 19) + Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL 15 (JSONB, Partial Indexes, CTEs)
- **Cache & Concurrency**: Redis (Redisson)
- **Security**: Stateless JWT Authentication with Role-Based Access Control

## 4. Key Architectural Decisions
- **Why Modular Monolith instead of Microservices?**
  To avoid network latency and distributed transaction complexities while the system is still growing. The code is strictly partitioned by domain so it can be extracted into microservices later if needed.
- **Why Redis Distributed Lock?**
  To handle high-concurrency ticket sales during holidays without locking the entire database table.
- **Why Native SQL & CTE for Reports?**
  JPA/Hibernate is excellent for OLTP but terrible for OLAP. We bypass the ORM and use native PostgreSQL CTEs to reduce report generation time from seconds to ~15ms.
