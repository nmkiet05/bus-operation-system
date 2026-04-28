# Module: Fleet

## Purpose
Manages the physical assets of the bus company, including vehicle types, physical buses, and dynamic seat layouts.

## Core Entities
- **BusType**: Defines the model, capacity, and physical layout of the seats.
- **Bus**: Represents an actual vehicle with a license plate, ODO reading, and insurance expiration date.

## Key Technical Features
- **Dynamic Seat Maps (JSONB)**: Because a limousine and a sleeper bus have radically different floor plans, the system stores the `seat_map` as a JSONB array in PostgreSQL. This allows the frontend to dynamically render multi-deck buses without rigid relational tables.
- **Insurance Tracking**: Automated status checks for expiring vehicle insurance.
