# Security & Authentication Architecture

## 1. Overview
The BOS system uses a stateless security architecture based on **JSON Web Tokens (JWT)** combined with **Spring Security 6 (Lambda DSL)**.

## 2. Authentication Flow
1. **Login:** User submits credentials (username/password) to `/api/auth/login`.
2. **Verification:** System verifies credentials against the PostgreSQL database.
3. **Token Generation:** System issues a short-lived `AccessToken` (15 mins) and a long-lived `RefreshToken` (7 days).
4. **Subsequent Requests:** Client attaches the `AccessToken` in the `Authorization: Bearer <token>` header.
5. **Token Refresh:** When `AccessToken` expires, the client calls `/api/auth/refresh` using the `RefreshToken` to get a new pair.

## 3. Role-Based Access Control (RBAC)
We utilize Spring Security's `@PreAuthorize` annotations at the controller level to enforce strict access boundaries:
- `ADMIN`: Full access to the system, master data, and analytics.
- `STAFF`: Access to day-to-day operational features (booking, dispatching, route planning).
- `DRIVER`: Limited access to the Driver Portal (view trips, submit vehicle handover reports).
- `CUSTOMER`: Access to public booking, booking history, and profile updates.

## 4. Web Security Configurations
- **CORS:** Configured to strictly allow only verified frontend origins (e.g., `https://yourdomain.com`).
- **CSRF:** Disabled because the architecture uses Stateless JWTs instead of Session Cookies.
- **Security Headers:** Enforced via `StaticHeadersWriter` (e.g., Content-Security-Policy, X-Frame-Options).
