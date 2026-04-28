package com.bus.system.modules.operation.specification;

import com.bus.system.modules.operation.domain.VehicleHandover;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class VehicleHandoverSpecification {

    // Tránh Magic String bằng cách definine constant
    public static final String FIELD_DRIVER = "driver";
    public static final String FIELD_BUS = "bus";
    public static final String FIELD_ID = "id";
    public static final String FIELD_HANDOVER_TIME = "handoverTime";

    /**
     * Tạo Specification cho tìm kiếm lịch sử bàn giao.
     * Chỉ tập trung vào việc Filter (Lọc dữ liệu).
     * Việc Sorting (Sắp xếp) sẽ do Service quyết định thông qua Sort object.
     */
    public static Specification<VehicleHandover> filter(Long driverId, Long busId, LocalDateTime fromDate,
            LocalDateTime toDate) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (driverId != null) {
                predicates.add(cb.equal(root.get(FIELD_DRIVER).get(FIELD_ID), driverId));
            }

            if (busId != null) {
                predicates.add(cb.equal(root.get(FIELD_BUS).get(FIELD_ID), busId));
            }

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get(FIELD_HANDOVER_TIME), fromDate));
            }

            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get(FIELD_HANDOVER_TIME), toDate));
            }

            // Trả về mệnh đề WHERE
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
