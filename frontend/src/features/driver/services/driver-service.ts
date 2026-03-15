import axiosClient from "@/services/http/axios";

export interface DriverTrip {
    id: number;
    routeName: string;
    routeCode?: string;
    departureDate: string;         // "YYYY-MM-DD"
    departureTime: string;         // "HH:MM"
    arrivalTime: string;           // "HH:MM"
    status: string;
    busLicensePlate?: string;
    busType?: string;
    driverName?: string;
    originProvinceName?: string;
    destinationProvinceName?: string;
}

interface ApiWrapper<T> {
    success: boolean;
    result: T;
    message: string;
}

export const driverService = {
    /**
     * Lấy lịch chuyến của tài xế đang đăng nhập.
     * @param fromDate "YYYY-MM-DD"
     * @param toDate   "YYYY-MM-DD"
     */
    getMySchedule: async (fromDate: string, toDate: string): Promise<DriverTrip[]> => {
        const res = await axiosClient.get<ApiWrapper<DriverTrip[]>>(
            "/driver/trips/my-schedule",
            { params: { fromDate, toDate } }
        );
        return res.data.result ?? [];
    },
};
