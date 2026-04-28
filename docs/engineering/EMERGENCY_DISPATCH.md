# Emergency Dispatch System (5-Zone Workflow)

## 1. Operational Challenge
In bus fleet management, a bus breakdown or driver sickness is not a simple CRUD update. Replacing a vehicle or driver affects the trip's schedule and requires different levels of urgency depending on how soon the bus is scheduled to depart. 

## 2. The 5-Zone Urgency Architecture
To automate and standardize emergency trip changes, BOS implements a **5-Zone Emergency Dispatch Workflow**. When a `TripChangeRequest` is submitted, the system calculates the time difference ($T$) between the current time and the scheduled departure time, classifying the emergency into one of 5 zones:

| Zone | Time Window ($T$) | Urgency Level | Workflow Action |
|:--|:--|:--|:--|
| **Z1** | $T > 60$ minutes | `STANDARD` | Placed in the standard pending queue. Approved by general dispatchers. |
| **Z2** | $15 \leq T \leq 60$ minutes | `URGENT` | Highlighted in yellow. Requires immediate supervisor attention. Notification pushed to dispatch dashboard. |
| **Z3** | $T < 15$ minutes | `CRITICAL` | Flashing red alert. Bypasses standard approval queues. The system may attempt an auto-suggest fallback assignment. |
| **Z4** | Departed (but not yet arrived) | `DEPARTED` | The bus has left the station. Requires mid-route coordination. |
| **Z5** | Mid-route breakdown | `MID_ROUTE` | Emergency Rescue Protocol. Triggers the dispatch of an empty replacement vehicle to the exact GPS coordinates. |

## 3. Implementation via Strategy Pattern
The backend handles this complexity using the **Strategy Design Pattern**.

```java
public interface TripChangeResolver {
    boolean supports(UrgencyZone zone);
    void resolve(TripChangeRequest request);
}
```
We have separate concrete implementations:
- `StandardZoneResolver` (For Z1)
- `UrgentZoneResolver` (For Z2)
- `CriticalZoneResolver` (For Z3, triggering WebSocket alerts)

A `TripChangeEscalationJob` runs in the background (using Spring `@Scheduled`) to automatically upgrade a request from Z1 to Z2 or Z3 as time runs out, ensuring no request is ignored.
