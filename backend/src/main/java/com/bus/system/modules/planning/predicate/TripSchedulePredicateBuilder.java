package com.bus.system.modules.planning.predicate;

import com.bus.system.modules.planning.contract.ScheduleStatus;
import com.bus.system.modules.planning.domain.QTripSchedule;
import com.querydsl.core.BooleanBuilder;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Builder class for constructing QueryDSL predicates for TripSchedule queries.
 * Centralizes complex query logic to keep service layer clean.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class TripSchedulePredicateBuilder {

    private static final QTripSchedule qTs = QTripSchedule.tripSchedule;

    /**
     * Build predicate for checking schedule overlap.
     * Checks if there's any active schedule on the same route within ±30 minutes
     * and with overlapping effective date ranges.
     *
     * @param routeId       Route ID to check
     * @param departureTime Target departure time
     * @param effectiveFrom Start of effective date range
     * @param effectiveTo   End of effective date range (nullable)
     * @param excludeId     Schedule ID to exclude from check (for updates)
     * @return BooleanBuilder with overlap conditions
     */
    public static BooleanBuilder buildScheduleOverlapPredicate(
            Long routeId,
            LocalTime departureTime,
            LocalDate effectiveFrom,
            LocalDate effectiveTo,
            Long excludeId) {

        // Calculate ±30 minutes window
        LocalTime minTime = departureTime.minusMinutes(30);
        LocalTime maxTime = departureTime.plusMinutes(30);

        BooleanBuilder builder = new BooleanBuilder();

        // Basic filters
        builder.and(qTs.route.id.eq(routeId));
        builder.and(qTs.status.eq(ScheduleStatus.ACTIVE));
        builder.and(qTs.deletedAt.isNull());
        builder.and(qTs.id.ne(excludeId));

        // Time overlap: departure time within ±30 minutes
        BooleanBuilder timeOverlap = new BooleanBuilder();
        timeOverlap.and(qTs.departureTime.goe(minTime));
        timeOverlap.and(qTs.departureTime.loe(maxTime));
        builder.and(timeOverlap);

        // Date range overlap
        BooleanBuilder dateOverlap = new BooleanBuilder();

        // Condition 1: ts.effectiveTo >= eFrom OR ts.effectiveTo IS NULL
        dateOverlap.and(qTs.effectiveTo.isNull().or(qTs.effectiveTo.goe(effectiveFrom)));

        // Condition 2: ts.effectiveFrom <= eTo OR eTo IS NULL
        if (effectiveTo != null) {
            dateOverlap.and(qTs.effectiveFrom.loe(effectiveTo));
        }

        builder.and(dateOverlap);

        return builder;
    }
}
