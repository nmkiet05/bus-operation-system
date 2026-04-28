package com.bus.system.common.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Slf4j
public class ServiceExecutionAspect {

    private static final long SLOW_SERVICE_THRESHOLD_MS = 300L;

    @Around("execution(* com.bus.system.modules..service..*(..))")
    public Object traceServiceExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        long startNs = System.nanoTime();
        String requestId = MDC.get("requestId");
        String signature = joinPoint.getSignature().toShortString();

        try {
            Object result = joinPoint.proceed();
            long durationMs = (System.nanoTime() - startNs) / 1_000_000;

            if (durationMs >= SLOW_SERVICE_THRESHOLD_MS) {
                log.warn("requestId={} service={} duration={}ms (slow)", requestId, signature, durationMs);
            } else {
                log.debug("requestId={} service={} duration={}ms", requestId, signature, durationMs);
            }

            return result;
        } catch (Throwable ex) {
            long durationMs = (System.nanoTime() - startNs) / 1_000_000;
            log.error("requestId={} service={} failed in {}ms, ex={}", requestId, signature, durationMs,
                    ex.getClass().getSimpleName());
            throw ex;
        }
    }
}
