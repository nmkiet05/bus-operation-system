# Module: Planning

## Purpose
Manages the long-term blueprint of the transportation network.

## Core Entities
- **Route**: A conceptual path from an origin station to a destination station.
- **PickupPoint**: Ordered waypoints along a Route.
- **TripSchedule**: The master template that dictates when a trip should run.

## Key Technical Features
- **Bitwise Day-of-Week Encoding**: Instead of having 7 boolean columns for days of the week, the `TripSchedule` uses a `SmallInt` (e.g., `127` for every day, `65` for Weekends). This enables extremely fast Bitwise AND queries (`schedule.operation_days_bitmap & :dayOfWeek > 0`) when the `Operation` module runs its daily trip generation batch job.
