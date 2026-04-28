package com.bus.system.modules.pricing.specification;

import com.bus.system.modules.pricing.contract.FareConfigStatus;
import com.bus.system.modules.pricing.domain.FareConfig;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class FareConfigSpecification {

    // Constants to avoid Magic Strings
    public static final String FIELD_ROUTE = "route";
    public static final String FIELD_BUS_TYPE = "busType";
    public static final String FIELD_ID = "id";
    public static final String FIELD_STATUS = "status";
    public static final String FIELD_DELETED_AT = "deletedAt";
    public static final String FIELD_EFFECTIVE_FROM = "effectiveFrom";
    public static final String FIELD_EFFECTIVE_TO = "effectiveTo";

    /**
     * Tìm giá vé đang có hiệu lực (Active) cho một Tuyến và Loại xe cụ thể.
     */
    public static Specification<FareConfig> findActiveFare(Long routeId, Long busTypeId, LocalDate queryDate,
            FareConfigStatus status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Đúng Route ID
            if (routeId != null) {
                predicates.add(cb.equal(root.get(FIELD_ROUTE).get(FIELD_ID), routeId));
            }
            // 2. Đúng BusType ID
            if (busTypeId != null) {
                predicates.add(cb.equal(root.get(FIELD_BUS_TYPE).get(FIELD_ID), busTypeId));
            }
            // 3. Status là ACTIVE
            if (status != null) {
                predicates.add(cb.equal(root.get(FIELD_STATUS), status));
            }
            // 4. Chưa bị xóa
            predicates.add(cb.isNull(root.get(FIELD_DELETED_AT)));

            // 5. Ngày hiệu lực check
            if (queryDate != null) {
                // effectiveFrom <= queryDate
                predicates.add(cb.lessThanOrEqualTo(root.get(FIELD_EFFECTIVE_FROM), queryDate));

                // (effectiveTo IS NULL OR effectiveTo >= queryDate)
                Predicate effectiveToNull = cb.isNull(root.get(FIELD_EFFECTIVE_TO));
                Predicate effectiveToValid = cb.greaterThanOrEqualTo(root.get(FIELD_EFFECTIVE_TO), queryDate);
                predicates.add(cb.or(effectiveToNull, effectiveToValid));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Kiểm tra xem có cấu hình giá nào chồng chéo khoảng thời gian không.
     */
    public static Specification<FareConfig> checkOverlap(Long routeId, Long busTypeId, LocalDate newEffectiveFrom,
            LocalDate newEffectiveTo, Long excludeId, FareConfigStatus status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get(FIELD_ROUTE).get(FIELD_ID), routeId));
            predicates.add(cb.equal(root.get(FIELD_BUS_TYPE).get(FIELD_ID), busTypeId));

            if (status != null) {
                predicates.add(cb.equal(root.get(FIELD_STATUS), status));
            }

            predicates.add(cb.isNull(root.get(FIELD_DELETED_AT)));

            if (excludeId != null) {
                predicates.add(cb.notEqual(root.get(FIELD_ID), excludeId));
            }

            // Logic Overlap:
            // (existing.effectiveTo IS NULL OR existing.effectiveTo >= new.effectiveFrom)
            // AND
            // (new.effectiveTo IS NULL OR existing.effectiveFrom <= new.effectiveTo)

            // Condition 1: existing.EffectiveTo check
            List<Predicate> cond1 = new ArrayList<>();
            cond1.add(cb.isNull(root.get(FIELD_EFFECTIVE_TO)));
            if (newEffectiveFrom != null) {
                cond1.add(cb.greaterThanOrEqualTo(root.get(FIELD_EFFECTIVE_TO), newEffectiveFrom));
            }
            predicates.add(cb.or(cond1.toArray(new Predicate[0])));

            // Condition 2: new.EffectiveTo check
            if (newEffectiveTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get(FIELD_EFFECTIVE_FROM), newEffectiveTo));
            }
            // If newEffectiveTo is null (infinite), then existing.effectiveFrom <= infinity
            // is always true, so we don't add condition.

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
