package com.bus.system.modules.pricing.predicate;

import com.bus.system.modules.pricing.contract.FareConfigStatus;
import com.bus.system.modules.pricing.domain.QFareConfig;
import com.querydsl.core.BooleanBuilder;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Builder class for constructing QueryDSL predicates for FareConfig queries.
 * Centralizes query logic to keep service layer clean.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class FareConfigPredicateBuilder {

    private static final QFareConfig qFare = QFareConfig.fareConfig;

    /**
     * Build predicate for finding active fare configuration.
     *
     * @param routeId    Route ID
     * @param busTypeId  Bus type ID
     * @param targetDate Date to check if fare is effective
     * @return BooleanBuilder with active fare conditions
     */
    public static BooleanBuilder buildActiveFarePredicate(
            Long routeId,
            Long busTypeId,
            LocalDate targetDate) {

        BooleanBuilder builder = new BooleanBuilder();

        builder.and(qFare.route.id.eq(routeId));
        builder.and(qFare.busType.id.eq(busTypeId));
        builder.and(qFare.status.eq(FareConfigStatus.ACTIVE));
        builder.and(qFare.deletedAt.isNull());
        builder.and(qFare.effectiveFrom.loe(targetDate));
        builder.and(qFare.effectiveTo.isNull().or(qFare.effectiveTo.goe(targetDate)));

        return builder;
    }

    /**
     * Build predicate for checking fare overlap during upsert.
     * Checks if there's any active fare for the same route/busType
     * with overlapping effective date ranges.
     *
     * @param routeId       Route ID
     * @param busTypeId     Bus type ID
     * @param effectiveFrom Start of new fare's effective period
     * @return BooleanBuilder with overlap conditions
     */
    public static BooleanBuilder buildFareOverlapPredicate(
            Long routeId,
            Long busTypeId,
            LocalDate effectiveFrom) {

        BooleanBuilder builder = new BooleanBuilder();

        builder.and(qFare.route.id.eq(routeId));
        builder.and(qFare.busType.id.eq(busTypeId));
        builder.and(qFare.status.eq(FareConfigStatus.ACTIVE));
        builder.and(qFare.deletedAt.isNull());
        builder.and(qFare.effectiveFrom.loe(effectiveFrom));
        builder.and(qFare.effectiveTo.isNull().or(qFare.effectiveTo.goe(effectiveFrom)));

        return builder;
    }

    /**
     * Build predicate for fetching ALL active fares (no route/busType filter).
     * Used for admin dashboard display.
     *
     * @param targetDate Date to check if fare is effective
     * @return BooleanBuilder with active fare conditions (no route/busType filter)
     */
    public static BooleanBuilder buildAllActiveFaresPredicate(LocalDate targetDate) {
        BooleanBuilder builder = new BooleanBuilder();

        builder.and(qFare.status.eq(FareConfigStatus.ACTIVE));
        builder.and(qFare.deletedAt.isNull());
        builder.and(qFare.effectiveFrom.loe(targetDate));
        builder.and(qFare.effectiveTo.isNull().or(qFare.effectiveTo.goe(targetDate)));

        return builder;
    }
}
