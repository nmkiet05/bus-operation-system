# Module: Pricing

## Purpose
Manages both static base fares and dynamic pricing policies (discounts, holiday surcharges, cancellation fees).

## Core Entities
- **FareConfig**: Base price defined by Route + BusType + active dates.
- **FarePolicy**: Dynamic rules engine.

## Key Technical Features
- **Rules Engine via JSONB**: Instead of hardcoding complex holiday or VIP rules, the `FarePolicy` table stores logical conditions (e.g., `{"days_before_departure": 3}`) and actions (`{"discount_percent": 10}`) as JSONB.
- **Historical Consistency**: Once a ticket is sold, its price is frozen. The system uses valid date ranges (`effective_from`, `effective_to`) to ensure past reports remain accurate even if base fares change.
