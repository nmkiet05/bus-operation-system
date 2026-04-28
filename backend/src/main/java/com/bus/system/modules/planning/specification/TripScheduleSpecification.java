package com.bus.system.modules.planning.specification;

import com.bus.system.modules.planning.contract.ScheduleStatus;
import com.bus.system.modules.planning.domain.TripSchedule;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class TripScheduleSpecification {

    public static final String FIELD_ROUTE = "route";
    public static final String FIELD_ID = "id";
    public static final String FIELD_STATUS = "status";
    public static final String FIELD_DELETED_AT = "deletedAt";
    public static final String FIELD_EFFECTIVE_FROM = "effectiveFrom";
    public static final String FIELD_EFFECTIVE_TO = "effectiveTo";
    public static final String FIELD_DEPARTURE_TIME = "departureTime";
    public static final String FIELD_OPERATION_DAYS = "operationDaysBitmap";

    /**
     * Kiểm tra Overlap cho TripSchedule (Trùng giờ chạy).
     * Logic:
     * 1. Cùng Route.
     * 2. Status Active, chưa xóa.
     * 3. Khác ID (nếu update).
     * 4. Giao nhau về ngày hiệu lực (Effective Date).
     * 5. Giao nhau về khung giờ (Departure Time vs Min/Max Time).
     */
    public static Specification<TripSchedule> checkOverlap(Long routeId,
            LocalDate effectiveFrom,
            LocalDate effectiveTo,
            LocalTime minTime,
            LocalTime maxTime,
            Long excludeId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Cùng Route
            if (routeId != null) {
                predicates.add(cb.equal(root.get(FIELD_ROUTE).get(FIELD_ID), routeId));
            }

            // 2. Status Active and Not Deleted
            predicates.add(cb.equal(root.get(FIELD_STATUS), ScheduleStatus.ACTIVE));
            predicates.add(cb.isNull(root.get(FIELD_DELETED_AT)));

            // 3. Exclude ID
            if (excludeId != null) {
                predicates.add(cb.notEqual(root.get(FIELD_ID), excludeId));
            }

            // 4. Effective Date Overlap
            // (existing.effectiveTo IS NULL OR existing.effectiveTo >= new.effectiveFrom)
            // AND
            // (new.effectiveTo IS NULL OR existing.effectiveFrom <= new.effectiveTo)

            // Condition 4.1: existing.effectiveTo check
            List<Predicate> dateCond1 = new ArrayList<>();
            dateCond1.add(cb.isNull(root.get(FIELD_EFFECTIVE_TO)));
            if (effectiveFrom != null) {
                dateCond1.add(cb.greaterThanOrEqualTo(root.get(FIELD_EFFECTIVE_TO), effectiveFrom));
            }
            predicates.add(cb.or(dateCond1.toArray(new Predicate[0])));

            // Condition 4.2: existing.effectiveFrom check (only if new.effectiveTo is
            // valid)
            if (effectiveTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get(FIELD_EFFECTIVE_FROM), effectiveTo));
            }

            // 5. Time Range Check (Departure Time)
            // Case A: minTime <= maxTime (Normal range, e.g., 08:00 - 08:30)
            // -> departureTime >= minTime AND departureTime <= maxTime
            // Case B: minTime > maxTime (Midnight cross, e.g., 23:50 - 00:20)
            // -> departureTime >= minTime OR departureTime <= maxTime
            if (minTime != null && maxTime != null) {
                if (!minTime.isAfter(maxTime)) {
                    // Case A
                    predicates.add(cb.between(root.get(FIELD_DEPARTURE_TIME), minTime, maxTime));
                } else {
                    // Case B
                    Predicate afterMin = cb.greaterThanOrEqualTo(root.get(FIELD_DEPARTURE_TIME), minTime);
                    Predicate beforeMax = cb.lessThanOrEqualTo(root.get(FIELD_DEPARTURE_TIME), maxTime);
                    predicates.add(cb.or(afterMin, beforeMax));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
