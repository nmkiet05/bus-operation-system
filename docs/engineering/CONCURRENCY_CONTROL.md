# Concurrency Control (Race Condition Prevention)

## 1. The Double-Booking Problem
In a high-traffic bus ticketing system, especially during holiday seasons (e.g., Tet holiday), multiple users may attempt to select and book the exact same seat simultaneously. 

If this is handled using standard database transactions without locks:
1. User A checks if Seat 1 is available -> DB says YES.
2. User B checks if Seat 1 is available -> DB says YES.
3. User A books Seat 1.
4. User B books Seat 1.
**Result:** Double-booking (Overselling).

## 2. Our Solution Architecture

To completely eliminate double-booking, BOS implements a **two-tier lock strategy**:
1. **Tier 1 (Proactive Guard):** Redis Distributed Locks (via Redisson)
2. **Tier 2 (Reactive Guard):** Optimistic Locking (via JPA `@Version`)

### 2.1. Redis Distributed Lock (Redisson)
When a user attempts to book a seat, the system requests a Distributed Lock from Redis.
The lock key is structured dynamically: `lock:trip:{tripId}:seat:{seatNumber}`.

- **Why Redis?** Redis is in-memory and extremely fast. It blocks concurrent requests at the API layer before they even hit the PostgreSQL database, dramatically reducing DB load during traffic spikes.
- **Why Redisson?** Redisson provides a robust implementation of the `RLock` interface and handles lock expiration and thread wait times automatically.

```java
// Simplified logic
String lockKey = "lock:trip:100:seat:A01";
RLock lock = redissonClient.getLock(lockKey);

try {
    // Wait up to 3 seconds to acquire the lock, lease it for 10 seconds
    if (lock.tryLock(3, 10, TimeUnit.SECONDS)) {
        // Seat is locked. Proceed with booking transaction.
        bookingService.createBooking(request);
    } else {
        throw new SeatTakenException("Seat is currently being booked by someone else.");
    }
} finally {
    if (lock.isHeldByCurrentThread()) {
        lock.unlock();
    }
}
```

### 2.2. JPA Optimistic Locking (@Version)
If, for some extremely rare edge case (e.g., Redis cluster failover), the distributed lock is bypassed, PostgreSQL serves as the final barrier.

In our `Ticket` entity, we have a `@Version` annotation:
```java
@Version
private Long version;
```
If two concurrent transactions somehow read the same Ticket at `version=1` and both attempt to update its status to `BOOKED`, the first transaction will succeed and increment the version to `2`. The second transaction will fail with an `ObjectOptimisticLockingFailureException`, preventing the double-booking.

## 3. Deadlock Prevention Strategy
To prevent deadlocks when a user books multiple seats at once (e.g., Seat A01 and A02), the system **sorts the lock keys** lexicographically before acquiring them.

By ensuring that all threads acquire locks in the exact same order (e.g., A01 then A02), cyclical wait conditions (Deadlocks) are mathematically impossible.
