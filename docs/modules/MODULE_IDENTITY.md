# Module: Identity & HR

## Purpose
Handles user authentication, authorization, and detailed employee records.

## Core Entities
- **User**: The base account with credentials.
- **UserRole**: Maps users to RBAC permissions.
- **DriverDetail**: Extended profile for drivers, tracking license class (e.g., Class E) and expiration dates.
- **StaffDetail**: Extended profile for station staff and dispatchers.

## Key Technical Features
- **JWT Stateless Security**: Uses signed tokens instead of server sessions.
- **Multi-Role Accounts**: A single user account can possess multiple roles, allowing flexible administrative assignments.
- **Audit Logging**: All changes to HR records are intercepted by the `audit_logs` triggers to maintain a strict trail of who modified a driver's credentials.
