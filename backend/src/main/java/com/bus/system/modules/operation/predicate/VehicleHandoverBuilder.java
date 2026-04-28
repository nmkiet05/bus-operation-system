package com.bus.system.modules.operation.predicate;

import com.bus.system.modules.operation.domain.QVehicleHandover;
import com.querydsl.core.BooleanBuilder;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Builder class for constructing QueryDSL predicates for VehicleHandover
 * queries.
 * Centralizes query logic to keep service layer clean.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class VehicleHandoverBuilder {

    private static final QVehicleHandover qHandover = QVehicleHandover.vehicleHandover;

    /**
     * Build predicate for filtering handover history.
     *
     * @param driverId Filter by driver ID
     * @param busId    Filter by bus ID
     * @param fromDate Filter handovers from this datetime (inclusive)
     * @param toDate   Filter handovers to this datetime (inclusive)
     * @return BooleanBuilder with all applicable conditions
     */
    public static BooleanBuilder buildHandoverHistoryPredicate(
            Long driverId,
            Long busId,
            LocalDateTime fromDate,
            LocalDateTime toDate) {

        BooleanBuilder builder = new BooleanBuilder();

        if (driverId != null) {
            builder.and(qHandover.driver.id.eq(driverId));
        }
        if (busId != null) {
            builder.and(qHandover.bus.id.eq(busId));
        }
        if (fromDate != null) {
            builder.and(qHandover.handoverTime.goe(fromDate));
        }
        if (toDate != null) {
            builder.and(qHandover.handoverTime.loe(toDate));
        }

        return builder;
    }
}
