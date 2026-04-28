package com.bus.system.modules.operation.scheduler;

import com.bus.system.modules.operation.config.OperationProperties;
import com.bus.system.modules.operation.domain.TripChange;
import com.bus.system.modules.operation.repository.TripChangeRepository;
import com.bus.system.modules.operation.service.impl.TripChangeExecutor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled Job: Auto-escalate các TripChangeRequest URGENT quá timeout.
 *
 * Tách từ TripChangeServiceImpl — tuân thủ SRP:
 * Service chỉ xử lý business logic, Scheduler xử lý cron/periodic tasks.
 *
 * Mỗi item tự tạo transaction riêng — 1 fail không ảnh hưởng các item khác.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class TripChangeEscalationJob {

    private final TripChangeRepository requestRepository;
    private final TripChangeExecutor executor;
    private final OperationProperties operationProperties;

    private TripChangeEscalationJob self;

    @Autowired
    public void setSelf(@Lazy TripChangeEscalationJob self) {
        this.self = self;
    }

    /**
     * Mỗi phút quét request URGENT quá timeout → auto-escalate (execute).
     * KHÔNG dùng @Transactional ở cấp độ phương thức chính để tránh UnexpectedRollbackException
     * khi một item bị lỗi BusinessException (khiến transaction bị mark rollback-only).
     */
    @Scheduled(fixedRate = 60_000)
    public void escalatePendingRequests() {
        int timeout = operationProperties.getTripChange().getEscalationTimeoutMinutes();
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(timeout);

        List<TripChange> expired = requestRepository.findExpiredUrgentRequests(cutoff);

        for (TripChange request : expired) {
            try {
                // Tự gọi qua 'self' để Spring aspect @Transactional(REQUIRES_NEW) có tác dụng
                self.escalateSingleRequest(request, timeout);
            } catch (Exception e) {
                log.error("ESCALATION FAILED: #{} — {}", request.getId(), e.getMessage());
            }
        }
    }

    /**
     * Xử lý từng request trong một transaction RIÊNG BIỆT.
     * REQUIRES_NEW đảm bảo lỗi của request này không ảnh hưởng đến request khác.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void escalateSingleRequest(TripChange request, int timeout) {
        request.escalate();
        executor.executeCrewOrBusChange(request);
        requestRepository.save(request);
        log.warn("ESCALATED: #{} auto-execute sau {}' timeout", request.getId(), timeout);
    }
}
