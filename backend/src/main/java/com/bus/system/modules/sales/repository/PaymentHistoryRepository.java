package com.bus.system.modules.sales.repository;

import com.bus.system.modules.sales.domain.PaymentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentHistoryRepository extends JpaRepository<PaymentHistory, Long> {
}
