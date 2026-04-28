# Module: Operation

## Purpose
The heart of the system. Manages the day-to-day execution of transit services, assignment of resources, and emergency incident handling.

## Core Entities
- **Trip**: A specific run of a route on a specific date and time.
- **BusAssignment (Vehicle Duty)**: The operational block of time a bus is active.
- **DriverAssignment**: Links a driver to a specific trip.
- **VehicleHandover**: Odometer and fuel condition reports logged during driver swaps.
- **TripChangeRequest**: Incident management ticket.

## Key Technical Features
- **5-Zone Emergency Dispatch**: A time-sensitive escalation workflow that classifies incidents (Z1 to Z5) based on departure proximity, using the Strategy Pattern to enforce different business rules.
- **Conflict Prevention Engine**: PL/pgSQL triggers that mathematically prevent overlapping schedules for the same driver or bus.
- **Self-Invocation AOP Fix**: Background cron jobs use `@Lazy` self-injection to ensure Spring Transaction Proxies are not bypassed during batch escalations.
