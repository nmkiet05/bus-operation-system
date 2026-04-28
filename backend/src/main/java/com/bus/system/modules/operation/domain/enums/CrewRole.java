package com.bus.system.modules.operation.domain.enums;

/**
 * Vai trò của nhân sự trong ca xe (BusAssignment).
 * Một BusAssignment có N DriverAssignment, mỗi DriverAssignment có 1 role.
 */
public enum CrewRole {
    MAIN_DRIVER, // Tài xế chính (bắt buộc)
    CO_DRIVER, // Phụ lái (tuyến dài > 300km)
    ATTENDANT // Phụ xe / tiếp viên
}
