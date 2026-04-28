package com.bus.system.modules.operation.predicate;

import com.bus.system.modules.operation.domain.enums.TripStatus;
import com.bus.system.modules.operation.domain.enums.TripType;
import com.bus.system.modules.pricing.contract.FareConfigStatus;
import com.bus.system.modules.fleet.domain.QBus;
import com.bus.system.modules.operation.domain.QTrip;
import com.bus.system.modules.operation.dto.request.TripSearchRequest;
import com.bus.system.modules.pricing.domain.QFareConfig;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.JPAExpressions;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class TripPredicateBuilder {

    private static final QTrip qTrip = QTrip.trip;

    /**
     * Build predicate for Customer Trip Search (Advanced).
     * Rules:
     * 1. Status MUST be APPROVED (Xe đã gán, Sơ đồ ghế chuẩn).
     * 2. DeletedAt IS NULL.
     * 3. Filter by Date, Route (Province), Time.
     * 4. Filter by BusType (via Subquery on Bus).
     * 5. Filter by Price (via Subquery on FareConfig linked to BusType).
     */
    public static BooleanBuilder buildTripSearchPredicate(TripSearchRequest request) {
        BooleanBuilder builder = new BooleanBuilder();

        // 1. GLOBAL & STATUS FILTER
        builder.and(qTrip.deletedAt.isNull());
        builder.and(qTrip.status.eq(TripStatus.APPROVED));

        // 2. DATE FILTER
        if (request.getDepartureDate() != null) {
            // Priority: Exact Date Match (Ticket Booking)
            builder.and(qTrip.departureDate.eq(request.getDepartureDate()));
        } else {
            // Range Match (Admin Dashboard)
            if (request.getFromDate() != null) {
                builder.and(qTrip.departureDate.goe(request.getFromDate()));
            } else {
                // Default if no specific date requested: Future trips
                builder.and(qTrip.departureDate.goe(LocalDate.now()));
            }

            if (request.getToDate() != null) {
                builder.and(qTrip.departureDate.loe(request.getToDate()));
            }
        }

        // 3. ROUTE / PROVINCE FILTER
        if (request.getRouteId() != null) {
            builder.and(qTrip.tripSchedule.route.id.eq(request.getRouteId()));
        } else {
            if (request.getFromProvinceId() != null) {
                builder.and(qTrip.tripSchedule.route.departureStation.province.id.eq(request.getFromProvinceId()));
            }
            if (request.getToProvinceId() != null) {
                builder.and(qTrip.tripSchedule.route.arrivalStation.province.id.eq(request.getToProvinceId()));
            }
        }

        // 4. TIME FILTER
        if (request.getMinTime() != null) {
            builder.and(qTrip.actualDepartureTime.goe(request.getMinTime()));
        }
        if (request.getMaxTime() != null) {
            builder.and(qTrip.actualDepartureTime.loe(request.getMaxTime()));
        }

        // 5. BUS TYPE FILTER
        // Subquery: EXISTS (SELECT 1 FROM Bus b WHERE b.id = trip.busId AND
        // b.busType.id = :typeId)
        if (request.getBusTypeId() != null) {
            builder.and(qTrip.busId.isNotNull());
            builder.and(JPAExpressions.selectOne()
                    .from(QBus.bus)
                    .where(QBus.bus.id.eq(qTrip.busId)
                            .and(QBus.bus.busType.id.eq(request.getBusTypeId())))
                    .exists());
        }

        // 6. PRICE FILTER
        // Trip -> Bus -> BusType. Link FareConfig(Route, BusType) -> Price.
        if (request.getMinPrice() != null || request.getMaxPrice() != null) {
            QFareConfig qFare = QFareConfig.fareConfig;

            // Subquery: Tìm Price của cấu hình vé khớp với Trip này
            builder.and(JPAExpressions.selectOne()
                    .from(qFare)
                    .where(qFare.route.id.eq(qTrip.tripSchedule.route.id)
                            .and(qFare.busType.id.eq(
                                    JPAExpressions.select(QBus.bus.busType.id)
                                            .from(QBus.bus)
                                            .where(QBus.bus.id.eq(qTrip.busId))))
                            .and(qFare.status.eq(FareConfigStatus.ACTIVE))
                            .and(request.getMinPrice() != null
                                    ? qFare.price.goe(BigDecimal.valueOf(request.getMinPrice()))
                                    : null)
                            .and(request.getMaxPrice() != null
                                    ? qFare.price.loe(BigDecimal.valueOf(request.getMaxPrice()))
                                    : null))
                    .exists());
        }

        return builder;
    }

    /**
     * Build predicate cho Admin / Dispatch — không hardcode status.
     * Cho phép lọc theo status tùy chọn (SCHEDULED, APPROVED, RUNNING, COMPLETED,
     * CANCELLED).
     */
    public static BooleanBuilder buildAdminTripPredicate(Long routeId, Long fromProvinceId, Long toProvinceId,
            LocalDate fromDate, LocalDate toDate, TripStatus status, TripType tripType) {
        BooleanBuilder builder = new BooleanBuilder();
        builder.and(qTrip.deletedAt.isNull());

        // STATUS — lọc theo param, không hardcode
        if (status != null) {
            builder.and(qTrip.status.eq(status));
        }

        // TRIP TYPE — lọc theo loại chuyến (MAIN, REINFORCEMENT)
        if (tripType != null) {
            builder.and(qTrip.tripType.eq(tripType));
        }

        // DATE
        if (fromDate != null) {
            builder.and(qTrip.departureDate.goe(fromDate));
        }
        if (toDate != null) {
            builder.and(qTrip.departureDate.loe(toDate));
        }

        // ROUTE / PROVINCE
        if (routeId != null) {
            builder.and(qTrip.tripSchedule.route.id.eq(routeId));
        } else {
            if (fromProvinceId != null) {
                builder.and(qTrip.tripSchedule.route.departureStation.province.id.eq(fromProvinceId));
            }
            if (toProvinceId != null) {
                builder.and(qTrip.tripSchedule.route.arrivalStation.province.id.eq(toProvinceId));
            }
        }

        return builder;
    }
}
