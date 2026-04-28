# Transaction Proxy Bug & Self-Invocation Fix

## 1. The Bug: @Transactional Ignored
During the development of the `TripChangeEscalationJob`, we encountered a classic Spring Framework pitfall: **Self-Invocation bypassing Spring AOP Proxies**.

### Scenario
We had a background job that scanned for expired trip changes and escalated their urgency.
```java
@Service
public class TripChangeEscalationJob {

    @Scheduled(cron = "0 * * * * *")
    public void scanAndEscalate() {
        List<TripChangeRequest> requests = repository.findPending();
        for (TripChangeRequest req : requests) {
            // Self-invocation here!
            escalateRequest(req); 
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void escalateRequest(TripChangeRequest req) {
        req.setUrgencyZone(UrgencyZone.CRITICAL);
        repository.save(req);
    }
}
```

### Why it failed
In Spring, `@Transactional` works via AOP (Aspect-Oriented Programming) Proxies. When a method is called from *outside* the class, the call goes through the proxy, which opens the transaction. However, when `scanAndEscalate` called `escalateRequest` from *inside* the same class, it bypassed the proxy completely. 
Because the proxy was bypassed, the `REQUIRES_NEW` transaction was never created. If one request threw an exception, the entire batch of escalations would fail and rollback.

## 2. The Solution: @Lazy Self-Injection
To fix this, we need to force the internal method call to go through the Spring Proxy.

We achieved this by self-injecting the bean using `@Lazy` (to prevent Circular Dependency exceptions during Spring Boot startup).

```java
@Service
public class TripChangeEscalationJob {

    @Autowired
    @Lazy
    private TripChangeEscalationJob self; // The proxy of this class

    @Scheduled(cron = "0 * * * * *")
    public void scanAndEscalate() {
        List<TripChangeRequest> requests = repository.findPending();
        for (TripChangeRequest req : requests) {
            try {
                // Calling via the proxy! Transaction works perfectly.
                self.escalateRequest(req);
            } catch (Exception e) {
                log.error("Failed to escalate request {}", req.getId());
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void escalateRequest(TripChangeRequest req) {
        req.setUrgencyZone(UrgencyZone.CRITICAL);
        repository.save(req);
    }
}
```

By calling `self.escalateRequest(req)`, the call is intercepted by the Spring AOP Proxy, ensuring that a brand new, isolated transaction (`REQUIRES_NEW`) is opened for every single iteration of the loop. If one escalation fails, the others succeed gracefully.
