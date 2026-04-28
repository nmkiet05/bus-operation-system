package com.bus.system.modules.operation.domain.service;

import lombok.Getter;

/**
 * Kết quả kiểm tra luật lao động (NĐ 10/2020).
 * Luật lao động LUÔN BLOCK nếu vi phạm.
 * Frontend dùng API riêng để lấy danh sách chuyến available/disabled.
 */
@Getter
public class LaborLawResult {

    private final boolean compliant;
    private final long excessMinutes;
    private final String violationType;

    private LaborLawResult(boolean compliant, long excessMinutes, String violationType) {
        this.compliant = compliant;
        this.excessMinutes = excessMinutes;
        this.violationType = violationType;
    }

    /** Tuân thủ hoàn toàn. */
    public static LaborLawResult ok() {
        return new LaborLawResult(true, 0, null);
    }

    /** Vi phạm weekly (48h/tuần). */
    public static LaborLawResult weeklyViolation(long excessMinutes) {
        return new LaborLawResult(false, excessMinutes, "WEEKLY_LIMIT_EXCEEDED");
    }
}
