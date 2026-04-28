package com.bus.system.modules.payment.service.strategy;

import com.bus.system.modules.payment.domain.enums.PaymentMethod;
import com.bus.system.common.exception.BadRequestException;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class PaymentStrategyFactory {

    private final Map<PaymentMethod, PaymentProcessor> processorMap = new EnumMap<>(PaymentMethod.class);

    // Spring sẽ tự động inject tất cả các beans implement PaymentProcessor vào List
    // này
    public PaymentStrategyFactory(List<PaymentProcessor> processors) {
        for (PaymentProcessor processor : processors) {
            for (PaymentMethod method : processor.getSupportedPaymentMethods()) {
                processorMap.put(method, processor);
            }
        }
    }

    public PaymentProcessor getProcessor(String methodStr) {
        PaymentMethod method;
        try {
            method = PaymentMethod.fromString(methodStr);
        } catch (Exception e) {
            throw new BadRequestException("Phương thức thanh toán không hợp lệ: " + methodStr);
        }

        PaymentProcessor processor = processorMap.get(method);
        if (processor == null) {
            throw new BadRequestException("Chưa hỗ trợ phương thức thanh toán: " + method);
        }
        return processor;
    }
}
