package com.bus.system.modules.sales.domain.enums;

public enum RefundCategory {
    CUSTOMER_VOLUNTARY, // Khách tự hủy vé
    OPERATOR_CANCEL, // Nhà xe hủy chuyến
    FORCE_MAJEURE // Bất khả kháng (thiên tai, dịch bệnh)
}
