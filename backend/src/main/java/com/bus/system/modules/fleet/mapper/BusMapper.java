package com.bus.system.modules.fleet.mapper;

import com.bus.system.modules.fleet.domain.Bus;
import com.bus.system.modules.fleet.domain.BusType;
import com.bus.system.modules.fleet.dto.request.BusRequest;
import com.bus.system.modules.fleet.dto.response.BusResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class BusMapper {

    public BusResponse toResponse(Bus bus) {
        if (bus == null)
            return null;

        BusResponse response = new BusResponse();
        response.setId(bus.getId());
        response.setLicensePlate(bus.getLicensePlate());

        // --- LOGIC MỚI: Lấy thông tin từ BusType ---
        if (bus.getBusType() != null) {
            response.setBusTypeName(bus.getBusType().getName());
            response.setTotalSeats(bus.getBusType().getTotalSeats());
        }
        // -------------------------------------------

        response.setTransportBadgeNumber(bus.getTransportBadgeNumber());
        response.setGpsDeviceId(bus.getGpsDeviceId());
        response.setVinNumber(bus.getVinNumber());
        response.setEngineNumber(bus.getEngineNumber());
        response.setManufacturingYear(bus.getManufacturingYear());
        response.setInsuranceExpiryDate(bus.getInsuranceExpiryDate());
        response.setRegistrationExpiryDate(bus.getRegistrationExpiryDate());
        // Convert BusStatus enum -> String cho Response
        if (bus.getStatus() != null) {
            response.setStatus(bus.getStatus().name());
        }
        response.setLastAssignedAt(bus.getLastAssignedAt());
        response.setNextMaintenanceDueAt(bus.getNextMaintenanceDueAt());
        response.setUpdatedAt(bus.getUpdatedAt());

        return response;
    }

    public List<BusResponse> toResponseListWithMap(List<Bus> buses,
            Map<Long, BusType> busTypeMap) {
        return buses.stream().map(bus -> {
            BusResponse response = toResponse(bus);
            // Override with eager fetched data from Map to avoid Proxy initialization or if
            // mapped manually
            if (bus.getBusType() != null && busTypeMap.containsKey(bus.getBusType().getId())) {
                BusType type = busTypeMap.get(bus.getBusType().getId());
                response.setBusTypeName(type.getName());
                response.setTotalSeats(type.getTotalSeats());
            }
            return response;
        }).collect(Collectors.toList());
    }

    // Chuyển Request -> Entity (Chỉ map các field đơn giản)
    // Lưu ý: Việc set BusType sẽ do Service làm (vì cần tra cứu DB)
    public Bus toEntity(BusRequest request) {
        if (request == null)
            return null;

        Bus bus = new Bus();
        bus.setLicensePlate(request.getLicensePlate());
        bus.setTransportBadgeNumber(request.getTransportBadgeNumber());
        bus.setBadgeExpiryDate(request.getBadgeExpiryDate());
        bus.setGpsDeviceId(request.getGpsDeviceId());
        bus.setVinNumber(request.getVinNumber());
        bus.setEngineNumber(request.getEngineNumber());
        bus.setManufacturingYear(request.getManufacturingYear());
        bus.setInsuranceExpiryDate(request.getInsuranceExpiryDate());
        bus.setRegistrationExpiryDate(request.getRegistrationExpiryDate());
        bus.setNextMaintenanceDueAt(request.getNextMaintenanceDueAt());
        // Status và BusType xử lý ở Service
        return bus;
    }

    public void updateBusFromRequest(Bus bus, BusRequest request) {
        if (request == null)
            return;

        // Không cho sửa biển số (licensePlate) vì nó là định danh
        bus.setTransportBadgeNumber(request.getTransportBadgeNumber());
        bus.setBadgeExpiryDate(request.getBadgeExpiryDate());
        bus.setGpsDeviceId(request.getGpsDeviceId());
        bus.setVinNumber(request.getVinNumber());
        bus.setEngineNumber(request.getEngineNumber());
        bus.setManufacturingYear(request.getManufacturingYear());
        bus.setInsuranceExpiryDate(request.getInsuranceExpiryDate());
        bus.setRegistrationExpiryDate(request.getRegistrationExpiryDate());
        bus.setNextMaintenanceDueAt(request.getNextMaintenanceDueAt());
        // Status và BusType xử lý ở Service
    }
}