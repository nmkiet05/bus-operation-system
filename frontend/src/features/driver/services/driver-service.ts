import axiosClient from "@/services/http/axios";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DriverTrip {
    id: number;
    routeName: string;
    routeCode?: string;
    departureDate: string;       // "YYYY-MM-DD"
    departureTime: string;       // "HH:MM"
    arrivalTime: string;
    status: string;
    busLicensePlate?: string;
    busType?: string;
    busTypeName?: string;
    driverName?: string;
    departureStationName?: string;
    arrivalStationName?: string;
    totalSeats?: number;
    availableSeats?: number;
    crew?: CrewMember[];
}

export interface CrewMember {
    assignmentId: number;
    userId: number;
    employeeCode: string | null; // Mã nhân viên công khai (VD: DRV-0007)
    fullName: string;
    phone: string | null;
    role: "MAIN_DRIVER" | "CO_DRIVER" | "ATTENDANT";
    status: string;
}

export interface PassengerInfo {
    ticketId: number;
    ticketCode: string;
    seatNumber: string;
    passengerName: string | null;
    passengerPhone: string | null;
    pickupPoint: string | null;
    dropoffPoint: string | null;
    isCheckedIn: boolean;
    status: string;
}

interface ApiWrapper<T> {
    success: boolean;
    result: T;
    message: string;
}

// ─── Service ────────────────────────────────────────────────────────────────

export const driverService = {
    /** Lấy lịch chuyến của tài xế (theo tháng) */
    getMySchedule: async (fromDate: string, toDate: string): Promise<DriverTrip[]> => {
        const res = await axiosClient.get<ApiWrapper<DriverTrip[]>>(
            "/driver/trips/my-schedule",
            { params: { fromDate, toDate } }
        );
        return res.data.result ?? [];
    },

    /** Lấy danh sách crew (đội ngũ) của một chuyến */
    getTripCrew: async (tripId: number): Promise<CrewMember[]> => {
        const res = await axiosClient.get<ApiWrapper<CrewMember[]>>(
            `/driver/trips/${tripId}/crew`
        );
        return res.data.result ?? [];
    },

    /** Lấy danh sách hành khách của một chuyến */
    getTripPassengers: async (tripId: number): Promise<PassengerInfo[]> => {
        const res = await axiosClient.get<ApiWrapper<PassengerInfo[]>>(
            `/driver/trips/${tripId}/passengers`
        );
        return res.data.result ?? [];
    },
};
