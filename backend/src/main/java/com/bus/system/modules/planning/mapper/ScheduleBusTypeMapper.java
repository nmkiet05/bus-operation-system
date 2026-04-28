package com.bus.system.modules.planning.mapper;

import com.bus.system.modules.planning.domain.ScheduleBusType;
import com.bus.system.modules.planning.dto.response.ScheduleBusTypeResponse;
import org.springframework.stereotype.Component;

@Component
public class ScheduleBusTypeMapper {

    public ScheduleBusTypeResponse toResponse(ScheduleBusType sbt) {
        if (sbt == null)
            return null;

        ScheduleBusTypeResponse res = new ScheduleBusTypeResponse();
        res.setId(sbt.getId());
        res.setTripScheduleId(sbt.getTripSchedule().getId());
        res.setBusTypeId(sbt.getBusType().getId());
        res.setBusTypeName(sbt.getBusType().getName());
        res.setEffectiveFrom(sbt.getEffectiveFrom());
        res.setEffectiveTo(sbt.getEffectiveTo());
        res.setStatus(sbt.getStatus().name());
        res.setReason(sbt.getReason());
        res.setCreatedAt(sbt.getCreatedAt());
        return res;
    }
}
