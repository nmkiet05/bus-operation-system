package com.bus.system.common.web.interceptor;

import com.bus.system.common.web.filter.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RequestLoggingInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingInterceptor.class);
    private static final String START_TIME_ATTR = "requestStartTime";
    private static final long SLOW_REQUEST_THRESHOLD_MS = 1000L;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        request.setAttribute(START_TIME_ATTR, System.currentTimeMillis());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request,
                                HttpServletResponse response,
                                Object handler,
                                Exception ex) {
        Object startTimeObj = request.getAttribute(START_TIME_ATTR);
        if (!(startTimeObj instanceof Long startTime)) {
            return;
        }

        long durationMs = System.currentTimeMillis() - startTime;
        String method = request.getMethod();
        String path = request.getRequestURI();
        int status = response.getStatus();
        String requestId = (String) request.getAttribute(CorrelationIdFilter.MDC_KEY);

        if (ex != null) {
            log.error("requestId={} {} {} -> {} in {}ms, ex={}", requestId, method, path, status, durationMs,
                    ex.getClass().getSimpleName());
            return;
        }

        if (durationMs >= SLOW_REQUEST_THRESHOLD_MS) {
            log.warn("requestId={} {} {} -> {} in {}ms (slow)", requestId, method, path, status, durationMs);
        } else {
            log.info("requestId={} {} {} -> {} in {}ms", requestId, method, path, status, durationMs);
        }
    }
}
