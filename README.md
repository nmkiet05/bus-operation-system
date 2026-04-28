# 🚌 Bus Operation System (BOS)

> **Enterprise-grade intercity bus management platform** — digitizing fleet operations, real-time dispatching, ticket sales, and revenue analytics for bus transportation companies.

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring_Boot-3.4.1-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-Distributed_Lock-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Backend Modules](#-backend-modules)
- [Frontend — 3-Portal Architecture](#-frontend--3-portal-architecture)
- [Key Engineering Highlights](#-key-engineering-highlights)
- [Database Design](#-database-design)
- [Getting Started (Local)](#-getting-started-local)
- [Production Deployment](#-production-deployment)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)

---

## 🎯 Overview

BOS is a full-stack, production-ready system that covers the **complete lifecycle** of a bus transportation business:

1. **Fleet Management** — Vehicle registration, insurance tracking, seat map configuration (JSONB)
2. **Route Planning** — Route definition, schedule templates with bitwise day-of-week encoding
3. **Trip Operations** — Automated daily trip generation, driver/bus assignment with conflict detection
4. **Emergency Dispatching** — 5-zone urgency classification for real-time trip change management
5. **Ticket Sales** — E-commerce checkout flow with seat reservation, QR payment, and refund processing
6. **Revenue Analytics** — BI dashboards with dynamic seat-class revenue breakdown and load-factor KPIs

---

## 🏗 System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                         │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Admin   │  │   Driver     │  │   Public Booking   │  │
│  │  Portal  │  │   Portal     │  │   Portal           │  │
│  │ (Desktop)│  │  (Mobile)    │  │   (Responsive)     │  │
│  └────┬─────┘  └──────┬───────┘  └─────────┬──────────┘  │
│       │               │                    │             │
│       └───────────────┼────────────────────┘             │
│                       │ Next.js 15 (SSR + CSR)           │
└───────────────────────┼──────────────────────────────────┘
                        │ REST API (JWT Auth)
┌───────────────────────┼──────────────────────────────────┐
│                 BACKEND LAYER                            │
│          Spring Boot 3.4 — Modular Monolith              │
│  ┌─────────┬──────────┬──────────┬──────────┬─────────┐  │
│  │Identity │  Fleet   │Planning  │Operation │  Sales  │  │
│  │  (Auth) │(Vehicles)│ (Routes) │(Dispatch)│(Tickets)│  │
│  ├─────────┼──────────┼──────────┼──────────┼─────────┤  │
│  │ Pricing │  Reports │ Catalog  │   HR     │ Payment │  │
│  └─────────┴──────────┴──────────┴──────────┴─────────┘  │
└──────────┬────────────────────────────┬──────────────────┘
           │                            │
    ┌──────┴──────┐              ┌──────┴──────┐
    │ PostgreSQL  │              │    Redis    │
    │   15        │              │  (Redisson) │
    │ + Flyway    │              │  Dist. Lock │
    └─────────────┘              └─────────────┘
```

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|:--|:--|
| **Java 21** | Core language with modern features |
| **Spring Boot 3.4** | REST API framework |
| **Spring Security + JWT** | Stateless authentication & RBAC |
| **Spring Data JPA** | ORM with Hibernate 6 |
| **QueryDSL 5** | Type-safe dynamic query builder |
| **Flyway** | Database version control & migrations |
| **Redisson** | Distributed locking for concurrent seat booking |
| **Springdoc OpenAPI** | Auto-generated Swagger UI |
| **Hypersistence Utils** | Advanced Hibernate types (JSONB mapping) |

### Frontend
| Technology | Purpose |
|:--|:--|
| **Next.js 15** | React framework with SSR/SSG |
| **TypeScript** | Type-safe development |
| **Tailwind CSS 3** | Utility-first styling |
| **Radix UI + shadcn/ui** | Accessible component library |
| **TanStack React Query** | Server state management & caching |
| **Recharts** | Revenue & load-factor chart visualization |
| **Framer Motion** | Smooth UI animations |
| **React Hook Form + Zod** | Form handling with schema validation |

### Infrastructure
| Technology | Purpose |
|:--|:--|
| **Docker Compose** | Multi-service orchestration (5 containers) |
| **PostgreSQL 15** | Primary database with JSONB, CTE, Partial Indexes |
| **Redis** | Distributed lock & session cache |
| **PgAdmin 4** | Database management UI |

---

## 📦 Backend Modules

The backend follows a **Modular Monolith** architecture — 11 domain modules with clear boundaries:

```
com.bus.system.modules
├── identity/      → JWT auth, RBAC (ADMIN/STAFF/DRIVER/CUSTOMER)
├── catalog/       → Provinces, bus stations, ticket offices, depots
├── fleet/         → Bus types, vehicles, seat map (JSONB), insurance tracking
├── hr/            → Driver profiles, license validation, driving-hour compliance
├── planning/      → Routes, trip schedules, bitwise day-of-week config
├── pricing/       → Fare config, holiday surcharge policies (JSONB conditions)
├── operation/     → Trip generation, driver/bus assignment, 5-zone emergency dispatch
├── sales/         → Seat reservation, booking lifecycle, ticket issuance, refunds
├── payment/       → Payment gateway integration (VNPAY/MoMo QR)
├── reports/       → Revenue analytics, load-factor KPIs (CTE + Native SQL)
└── system/        → System configs, audit logging
```

---

## 🖥 Frontend — 3-Portal Architecture

The frontend is split into **3 independent portals**, each optimized for its target audience:

### 1. 🏢 Management Portal `/(admin)`
- **Users:** Admin & Staff (desktop-optimized)
- **Features:** Fleet management, route planning, trip scheduling, 5-zone emergency dispatch center, fare configuration, revenue dashboards with Recharts

### 2. 🚗 Driver Portal `/(driver)`
- **Users:** Drivers only (mobile-first design)
- **Features:** Today's trip view, vehicle handover forms (odometer + fuel), mid-route incident reporting

### 3. 🎫 Booking Portal `/(public)`
- **Users:** All visitors (responsive e-commerce UX)
- **Features:** Trip search with autocomplete, interactive 2-deck seat map, shopping cart, QR payment with 10-min countdown timer, booking history

---

## ⚡ Key Engineering Highlights

### Concurrency Control — Seat Booking Race Condition
```
Problem: Two users selecting the same seat simultaneously
Solution: Redis Distributed Lock (Redisson) + Optimistic Locking (@Version)
```
- **Redis lock** prevents concurrent writes to the same seat
- **@Version column** on `ticket` table catches any remaining race conditions
- `ObjectOptimisticLockingFailureException` → user-friendly "Seat already taken" message

### 5-Zone Emergency Trip Change System
Real-time trip change dispatching based on time-to-departure:
| Zone | Time Window | Urgency | Action |
|:--|:--|:--|:--|
| Z1 | T > 60 min | STANDARD | Normal reassignment |
| Z2 | 15 ≤ T ≤ 60 min | URGENT | Priority queue |
| Z3 | T < 15 min | CRITICAL | Immediate escalation |
| Z4 | Departed | DEPARTED | Mid-transit coordination |
| Z5 | En route | MID_ROUTE | Emergency rescue dispatch |

Implemented with **Strategy Pattern** (`TripChangeResolver`) for clean zone-specific logic.

### High-Performance Reporting with CTE
```sql
-- Revenue aggregation bypasses JPA N+1 problem
WITH revenue_cte AS (
  SELECT DATE_TRUNC(:granularity, b.booking_date) as date, ...
  FROM bookings b JOIN trips t ON b.trip_id = t.id
  GROUP BY date, bus_type, seat_class
)
SELECT * FROM revenue_cte ORDER BY date DESC;
```
- Database-side aggregation reduces network calls from dozens to **1 query**
- Query time: **~5-15ms** for 6-month date ranges

### Partial Unique Indexes for Soft-Delete
```sql
CREATE UNIQUE INDEX ticket_active_seat_idx 
  ON ticket(trip_id, seat_number) 
  WHERE status NOT IN ('CANCELLED', 'EXPIRED');
```
Enables seat reuse after cancellation without violating uniqueness constraints.

---

## 🗄 Database Design

**30+ tables** organized in 5 clusters with enterprise patterns:

| Cluster | Tables | Key Features |
|:--|:--|:--|
| **Identity & HR** | `users`, `user_roles`, `driver_detail`, `staff_detail` | Multi-role RBAC, license tracking |
| **Catalog** | `province`, `bus_station`, `depot`, `ticket_office` | Master data with soft-delete |
| **Fleet & Planning** | `bus_type`, `bus`, `route`, `trip_schedule`, `fare_config` | JSONB seat maps, bitwise scheduling |
| **Operations** | `trip`, `driver_assignment`, `bus_assignment`, `trip_change_request` | 5-zone dispatch, vehicle handover |
| **Sales & Payments** | `booking`, `ticket`, `payment_history`, `refund_transactions` | Optimistic locking, partial indexes |

**Advanced PostgreSQL Features Used:**
- `JSONB` columns for flexible seat maps and policy conditions
- Partial Unique Indexes for soft-delete compatibility
- `Optimistic Locking` via `@Version` on critical tables
- Auto-audit triggers (`log_audit_trail()`)
- `CTE` (Common Table Expressions) for complex reporting queries

---

## 🚀 Getting Started (Local)

### Prerequisites
- Docker & Docker Compose
- Git
- Node.js 20+ (for local frontend dev)
- Java 21+ (for local backend dev)

### Quick Start (Docker)

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/bus-operation-system.git
cd bus-operation-system

# 2. Start the system (One-Click)
# For Windows: Just double-click the system-manager.bat file and select option 1.
# Or run it from the terminal:
.\system-manager.bat

# For Mac/Linux:
docker-compose up --build -d
```

### Access Points

| Service | URL |
|:--|:--|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8080/api |
| **Swagger UI** | http://localhost:8080/swagger-ui/index.html |
| **PgAdmin** | http://localhost:5050 |

### Default Credentials

| Role | Username | Password |
|:--|:--|:--|
| Admin | `admin` | `root@123456` |
| PgAdmin | `admin@bos.com` | `Admin@123456` |

### Testing Mobile QR Payments (LAN)

If you want to test the Ticket Booking flow and scan the payment QR code using your real smartphone, the system must be accessible over your local Wi-Fi network (LAN) instead of `localhost`. 

We provide utility scripts to make this seamless:
1. Run `firewall-manager.bat` (as Administrator) and select **Option 2** to open Windows Firewall ports for `3000` and `8080`.
2. Run `update-ip.bat`. It will automatically detect your local IPv4 address (e.g., `192.168.1.x`) and inject it into the `docker-compose.yml` environment variables so your phone can reach the backend.
3. Choose `Y` when prompted to rebuild the Docker containers with the new IP.
4. Connect your phone to the same Wi-Fi network, open your mobile browser, and access `http://<your-ip>:3000` to book tickets and scan the QR code!

> **Security Note:** When you are done testing, remember to run `firewall-manager.bat` and select **Option 3** (Block LAN Access) to secure your PC.

---

## 🌍 Production Deployment

To deploy the system to a production environment (VPS/Cloud like AWS, DigitalOcean), you must set up an Nginx Reverse Proxy with HTTPS.

### 1. Configure Environment Variables
You MUST override the default credentials and secrets before starting the container in production.

**Backend (`backend/src/main/resources/application-prod.yml` or `.env`):**
```yaml
spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/bos_db
    username: admin
    password: <YOUR_SECURE_DB_PASSWORD>
app:
  jwtSecret: <YOUR_NEW_SECURE_JWT_SECRET_32_CHARS_MIN>
cors:
  allowed:
    origins: "https://yourdomain.com"
```

**Frontend (`frontend/.env.production`):**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NODE_ENV=production
```

### 2. Nginx Reverse Proxy & SSL
Install Nginx and Certbot, then create `/etc/nginx/sites-available/bos`:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend Next.js
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable SSL:
```bash
sudo ln -s /etc/nginx/sites-available/bos /etc/nginx/sites-enabled/
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
sudo systemctl restart nginx
```

### 3. Deploy
```bash
docker-compose -f docker-compose.yml up --build -d
```

---

## 📚 API Documentation

Interactive API documentation is available via **Swagger UI** at:
```
http://localhost:8080/swagger-ui/index.html
```

### Core API Endpoints

| Module | Endpoint | Description |
|:--|:--|:--|
| Auth | `POST /api/auth/login` | JWT authentication |
| Fleet | `GET /api/fleet/buses` | Vehicle inventory |
| Planning | `GET /api/planning/routes` | Route management |
| Operation | `POST /api/operation/trips/generate` | Automated trip generation |
| Sales | `POST /api/sales/bookings` | Create booking with seat reservation |
| Reports | `GET /api/reports/revenue` | Revenue analytics with filters |
| Reports | `GET /api/reports/load-factor` | Occupancy rate KPIs |

---

## 📁 Project Structure

```
bus-operation-system/
├── backend/
│   ├── src/main/java/com/bus/system/
│   │   ├── config/          # Security, CORS, Redis, QueryDSL config
│   │   ├── common/          # Shared DTOs, exceptions, utilities
│   │   └── modules/         # 11 domain modules (see above)
│   ├── src/main/resources/
│   │   ├── db/migration/    # Flyway SQL migrations
│   │   ├── db/seed/         # Demo data seeding
│   │   └── application.yml  # App configuration
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (admin)/     # Management Portal
│   │   │   ├── (driver)/    # Driver Portal
│   │   │   ├── (public)/    # Booking Portal
│   │   │   └── (auth)/      # Login/Register
│   │   ├── features/        # Feature-based modules
│   │   ├── services/        # API clients & HTTP config
│   │   └── middleware.ts     # Route-level RBAC guard
│   ├── Dockerfile
│   └── package.json
├── docs/                    # Technical documentation
└── docker-compose.yml       # Full-stack orchestration
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

*Originally developed as a thesis project at **Can Tho University** — Faculty of Information Technology.*

---

<p align="center">
  <sub>Built with ☕ Java, ⚛️ React, and 🐘 PostgreSQL</sub>
</p>
