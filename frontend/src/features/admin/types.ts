/**
 * Định nghĩa kiểu dữ liệu cho module Admin
 */

// =====================================================================
// RBAC - Role-Based Access Control
// =====================================================================

/** Các role được phép truy cập Admin Panel */
export type AdminRole = "ROLE_ADMIN" | "ROLE_STAFF" | "ROLE_MANAGER";

/** Kiểu cho một menu item trong Sidebar */
export interface SidebarMenuItem {
    title: string;
    href: string;
    icon: string; // Tên icon từ Lucide (dùng dynamic import)
    allowedRoles: AdminRole[];
    badge?: string; // Badge đếm (ví dụ: "5" cho thông báo mới)
}

/** Định nghĩa một nhóm menu trong Sidebar */
export interface SidebarMenuGroup {
    label: string;
    items: SidebarMenuItem[];
}

// =====================================================================
// Trip Management
// =====================================================================

/** Trạng thái chuyến xe */
export type TripStatus =
    | "SCHEDULED"
    | "APPROVED"
    | "RUNNING"
    | "COMPLETED"
    | "CANCELLED";

/** Thông tin chi tiết một chuyến xe (Response từ Backend) */
export interface Trip {
    id: number;
    code: string;
    departureTime: string; // HH:mm:ss
    arrivalTime: string; // HH:mm:ss
    routeName: string;
    routeCode: string;
    busTypeName: string;
    busType?: string; // Alias of busTypeName (backend trả cả 2)
    busLicensePlate: string | null;
    driverName: string | null;
    driverId: number | null;
    busId: number | null;
    status: TripStatus;
    availableSeats: number;
    totalSeats: number;
    price: number;
    departureDate: string; // yyyy-MM-dd
    dispatchNote?: string; // Ghi chú điều độ (lý do gán xe)
    routeId?: number;
    // Bến xuất phát và bến đến (từ backend route.departureStation / arrivalStation)
    departureStationName?: string;
    arrivalStationName?: string;
}

/** Bộ lọc cho danh sách chuyến */
export interface TripFilters {
    date: string; // ISO date string (yyyy-MM-dd)
    routeId?: number;
    status?: TripStatus;
}

// =====================================================================
// Resource Availability
// =====================================================================

/** Nested DriverDetail từ backend entity (User.driverDetail) */
export interface DriverDetail {
    userId: number;
    departmentId: number;
    licenseNumber: string;
    licenseClass: string;
    licenseExpiryDate: string;
    issueDate: string;
    licenseValid: boolean;
}

/** Nested BusType từ backend entity (Bus.busType) */
export interface BusTypeNested {
    id: number;
    code: string;
    name: string;
    totalSeats: number;
}

/**
 * Driver = User entity từ backend API `/resources/drivers/available`
 * Backend trả raw User entity, licenseNumber nằm trong driverDetail (nested)
 */
export interface Driver {
    id: number;
    employeeCode: string | null; // Mã nhân viên công khai (VD: DRV-0007)
    fullName: string;
    phone: string;
    status: "ACTIVE" | "INACTIVE" | "BUSY";
    driverDetail: DriverDetail | null;
    // Computed helpers (không có trong API, dùng getter)
    totalHoursThisWeek?: number; // Cho warning 48h (nếu backend bổ sung)
}

/**
 * Bus entity từ backend API `/resources/buses/available`
 * Backend trả raw Bus entity, busTypeName nằm trong busType.name (nested)
 */
export interface Bus {
    id: number;
    licensePlate: string;
    busType: BusTypeNested;           // Nested object (không phải flat busTypeName)
    totalSeats?: number;
    status: "ACTIVE" | "MAINTENANCE" | "BUSY" | "RETIRED";

    // Additional fields from Bus entity
    transportBadgeNumber?: string;
    badgeExpiryDate?: string;
    gpsDeviceId?: string;
    vinNumber?: string;
    engineNumber?: string;
    manufacturingYear?: number;
    insuranceExpiryDate?: string;
    registrationExpiryDate?: string;
    currentOdometer?: number;
}

export type DriverAvailable = Driver;
export type BusAvailable = Bus;

/**
 * BusFleetResponse = DTO từ fleet API `/fleet/buses`
 * Backend trả BusResponse DTO (flat busTypeName), khác format raw entity
 */
export interface BusFleetResponse {
    id: number;
    licensePlate: string;
    busTypeName: string;    // Flat field (từ BusResponse DTO)
    totalSeats: number;
    status: string;
    transportBadgeNumber?: string;
    gpsDeviceId?: string;
    vinNumber?: string;
    engineNumber?: string;
    manufacturingYear?: number;
    insuranceExpiryDate?: string;
    registrationExpiryDate?: string;
    updatedAt?: string;
}

// =====================================================================
// Fleet Management (Đội xe)
// =====================================================================

// Basic Seat Structure (JSON)
export interface SeatMapItem {
    row: number;
    col: string | number;
    type: string; // e.g., "VIP", "NORMAL"
    floor?: number; // 1 or 2
    status?: "AVAILABLE" | "LOCKED" | "BOOKED"; // Optional status in map definition
}

export interface BusType {
    id: number;
    code: string;
    name: string;
    totalSeats: number;
    seatMap: SeatMapItem[]; // JSON structure
}

export interface BusRequest {
    licensePlate: string;
    busTypeId: number;
    transportBadgeNumber?: string; // Phù hiệu
    badgeExpiryDate?: string; // yyyy-MM-dd
    gpsDeviceId?: string;
    vinNumber: string; // Số khung
    engineNumber: string; // Số máy
    manufacturingYear?: number;
    insuranceExpiryDate: string;
    registrationExpiryDate: string;
    status?: "ACTIVE" | "MAINTENANCE" | "RETIRED" | "BUSY";
}

// =====================================================================
// Planning Management (Kế hoạch)
// =====================================================================

export interface Route {
    id: number;
    code: string;
    name: string;
    departureStationId: number;
    arrivalStationId: number;
    distance: number;
    durationHours: number;
    itineraryDetail?: string; // Lộ trình chi tiết
    hotline?: string;
    defaultRefundPolicyId?: number;
    status: "ACTIVE" | "INACTIVE";
}

export interface RouteRequest {
    name: string;
    departureStationId: number;
    arrivalStationId: number;
    distance: number;
    durationHours: number;
    itineraryDetail?: string;
    hotline?: string;
    status: "ACTIVE" | "INACTIVE";
}

export interface PickupPoint {
    id: number;
    code: string;
    routeId: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    sequenceOrder: number;
    estimatedMinutesFromDeparture: number;
    status: "ACTIVE" | "INACTIVE";
}

export interface PickupPointRequest {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    sequenceOrder: number;
    estimatedMinutesFromDeparture: number;
    status: "ACTIVE" | "INACTIVE";
}

export interface TripSchedule {
    id: number;
    code: string;
    routeId: number;
    routeName: string;
    departureTime: string; // HH:mm
    daysOfWeek: number[]; // [2, 3, 4, 5, 6, 7, 8]
    effectiveFrom: string; // yyyy-MM-dd
    effectiveTo: string; // yyyy-MM-dd
    status: "ACTIVE" | "INACTIVE";
}

export interface TripScheduleRequest {
    routeId: number;
    departureTime: string; // HH:mm
    daysOfWeek: number[];
    effectiveFrom: string;
    effectiveTo: string;
    status: "ACTIVE" | "INACTIVE";
}

// =====================================================================
// Pricing Management (Quản lý giá vé)
// =====================================================================

export interface FareConfig {
    id: number;
    routeId: number;
    routeName: string;
    busTypeId: number;
    busTypeName: string;
    price: number;
    effectiveFrom: string; // yyyy-MM-dd
    effectiveTo: string | null;
    isHolidaySurcharge: boolean | null;
    approvedBy: number | null;
    status: string;
}

export interface FareConfigRequest {
    routeId: number;
    busTypeId: number;
    price: number;
    effectiveFrom: string; // yyyy-MM-dd
    effectiveTo?: string | null;
    isHolidaySurcharge?: boolean;
}

// =====================================================================
// Bus Assignment (Ca xe)
// =====================================================================

export interface BusAssignmentTripSummary {
    id: number;
    code: string;
    routeName: string;
    routeCode: string;
    departureTime: string;
    arrivalTime: string;
    status: string;
    driverName: string | null;
    departureStationName?: string;
    arrivalStationName?: string;
}

export interface BusAssignment {
    id: number;
    busId: number;
    busLicensePlate: string;
    busTypeName: string;
    startDepotId: number | null;
    startDepotName: string | null;
    endDepotId: number | null;
    endDepotName: string | null;
    scheduledStart: string;
    scheduledEnd: string;
    checkInTime: string | null;
    checkInOdometer: number | null;
    checkInFuel: number | null;
    checkInNotes: string | null;
    checkInByName: string | null;
    checkOutTime: string | null;
    checkOutOdometer: number | null;
    checkOutFuel: number | null;
    checkOutNotes: string | null;
    checkOutByName: string | null;
    status: string;
    notes: string | null;
    trips: BusAssignmentTripSummary[];
    createdAt: string;
}

// =====================================================================
// Trip Change (Thay đổi tài xế/xe)
// =====================================================================

export type ChangeRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "ESCALATED" | "CANCELLED";
export type ChangeUrgencyZone = "STANDARD" | "URGENT" | "CRITICAL" | "DEPARTED" | "MID_ROUTE";
export type TripChangeType = "REPLACE_DRIVER" | "REPLACE_CO_DRIVER" | "REPLACE_ATTENDANT" | "REPLACE_BUS" | "INCIDENT_SWAP";

export interface TripChangeResponse {
    id: number;
    tripId: number;
    tripCode: string;
    routeName: string;
    changeType: TripChangeType;
    oldDriverName: string | null;
    newDriverName: string | null;
    oldBusPlate: string | null;
    newBusPlate: string | null;
    requestReason: string;
    status: ChangeRequestStatus;
    isEmergency: boolean;
    urgencyZone: ChangeUrgencyZone;
    incidentType: string | null;
    incidentGps: string | null;
    createdByName: string | null;
    approvedByName: string | null;
    rejectedReason: string | null;
    createdAt: string;
}

// =====================================================================
// Crew Management (Đội ngũ)
// =====================================================================

export type CrewRole = "MAIN_DRIVER" | "CO_DRIVER" | "ATTENDANT";
export type DriverAssignmentStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "ENDED_EARLY";

/** Khớp backend CrewMemberResponse DTO */
export interface CrewMember {
    assignmentId: number;       // DriverAssignment.id — dùng cho cancel/replace
    userId: number;             // User.id (tài xế)
    employeeCode: string | null;// User.employeeCode — mã nhân viên công khai (VD: DRV-0007)
    fullName: string;           // User.fullName
    phone: string | null;       // User.phone
    role: CrewRole;             // MAIN_DRIVER | CO_DRIVER | ATTENDANT
    status: DriverAssignmentStatus;
}
