package com.bus.system.modules.operation.specification;

import com.bus.system.modules.operation.domain.Trip;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class TripSpecification {

    public static final String FIELD_TRIP_SCHEDULE = "tripSchedule";
    public static final String FIELD_ROUTE = "route";
    public static final String FIELD_ID = "id";
    public static final String FIELD_DEPARTURE_STATION = "departureStation";
    public static final String FIELD_ARRIVAL_STATION = "arrivalStation";
    public static final String FIELD_PROVINCE = "province";
    public static final String FIELD_DEPARTURE_DATE = "departureDate";
    public static final String FIELD_DELETED_AT = "deletedAt";

    public static final String FIELD_ACTUAL_DEPARTURE_TIME = "actualDepartureTime";

    /**
     * Filter Trips based on search criteria.
     */
    public static Specification<Trip> filterTrips(Long routeId, Long fromProvinceId, Long toProvinceId,
            LocalDate fromDate, LocalDate toDate) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Join Tables to access Route and Province
            // Trip -> TripSchedule -> Route -> DepartureStation/ArrivalStation -> Province
            // Note: Since we need to filter by these nested fields, simple get() chains
            // work in Criteria API
            // but might generate inner joins. Left joins are safer if fields are nullable,
            // but here Route and Stations are usually mandatory.

            // 1. Route ID
            if (routeId != null) {
                predicates.add(cb.equal(root.get(FIELD_TRIP_SCHEDULE).get(FIELD_ROUTE).get(FIELD_ID), routeId));
            }

            // 2. From Province
            if (fromProvinceId != null) {
                predicates.add(cb.equal(root.get(FIELD_TRIP_SCHEDULE).get(FIELD_ROUTE)
                        .get(FIELD_DEPARTURE_STATION).get(FIELD_PROVINCE).get(FIELD_ID), fromProvinceId));
            }

            // 3. To Province
            if (toProvinceId != null) {
                predicates.add(cb.equal(root.get(FIELD_TRIP_SCHEDULE).get(FIELD_ROUTE)
                        .get(FIELD_ARRIVAL_STATION).get(FIELD_PROVINCE).get(FIELD_ID), toProvinceId));
            }

            // 4. From Date
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get(FIELD_DEPARTURE_DATE), fromDate));
            }

            // 5. To Date
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get(FIELD_DEPARTURE_DATE), toDate));
            }

            // 6. Not Deleted
            predicates.add(cb.isNull(root.get(FIELD_DELETED_AT)));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
