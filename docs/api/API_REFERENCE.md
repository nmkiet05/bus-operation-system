# API Reference Guide

## 1. Overview
BOS exposes a RESTful API built with Spring Boot. The API follows standard REST conventions (GET, POST, PUT, DELETE) and uses standard HTTP status codes.

## 2. Swagger UI (OpenAPI 3.0)
The complete, interactive API documentation is auto-generated using `springdoc-openapi` and is available at:
`http://localhost:8080/swagger-ui/index.html`

## 3. Core Modules & Endpoints

### 3.1. Identity Module
- `POST /api/auth/login` - Authenticate and get JWT
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Invalidate refresh token
- `GET /api/me` - Get current user profile

### 3.2. Fleet Module
- `GET /api/fleet/buses` - List all vehicles
- `POST /api/fleet/buses` - Register new vehicle
- `GET /api/fleet/bus-types` - List bus models (with JSONB seat maps)

### 3.3. Planning Module
- `GET /api/planning/routes` - Get transit routes
- `POST /api/planning/trip-schedules` - Create a master schedule (using Bitwise operations)

### 3.4. Operation Module
- `POST /api/operation/trips/generate` - Trigger automated trip generation for the next N days
- `GET /api/operation/trips` - View daily trips
- `POST /api/operation/trip-changes` - Submit an emergency trip change request

### 3.5. Sales Module
- `POST /api/sales/bookings` - Create a reservation (Hold seats for 15 mins)
- `POST /api/sales/bookings/{id}/confirm` - Confirm a booking (After successful payment)
- `GET /api/sales/tickets` - Retrieve issued tickets

### 3.6. Reports Module
- `GET /api/reports/revenue` - Fetch dynamic revenue aggregation (Powered by CTE)
- `GET /api/reports/load-factor` - Fetch vehicle occupancy rate analytics
