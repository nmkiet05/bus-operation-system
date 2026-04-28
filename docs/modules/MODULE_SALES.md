# Module: Sales & Booking

## Purpose
Handles the e-commerce lifecycle of a seat, from temporary reservation to confirmed ticket issuance and refunds.

## Core Entities
- **Booking**: The shopping cart/order container.
- **Ticket**: Represents the actual right to occupy a specific seat on a specific trip.
- **PaymentHistory**: Tracks transactions.

## Key Technical Features
- **Double-Booking Prevention**: Uses Redisson Distributed Locks to guarantee atomic seat reservations under heavy concurrent traffic.
- **Optimistic Locking**: The `ticket` table uses a `@Version` column to catch any race conditions that somehow bypass the Redis lock.
- **Partial Unique Indexes**: Employs `CREATE UNIQUE INDEX ... WHERE status NOT IN ('CANCELLED')` so that a cancelled seat can be seamlessly booked by another customer without violating database constraints.
- **10-Minute Checkout Timer**: Bookings are created in a `PENDING` state. A background job (or TTL mechanism) automatically releases the reserved seats back into the pool if payment is not confirmed within the countdown window.
