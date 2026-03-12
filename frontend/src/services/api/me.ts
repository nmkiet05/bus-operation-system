import axiosInstance from "../http/axios";

/**
 * Me API Service
 * API liên quan đến user hiện tại
 */

interface ApiResponse<T> {
    code: number;
    message: string;
    result: T;
}

export interface MyBooking {
    id: number;
    code: string;
    tripId: number;
    routeName: string; // "Cần Thơ - Sài Gòn"
    departureTime: string; // "14:00 20/10/2023"
    status: string; // PENDING, CONFIRMED, CANCELLED
    totalAmount: number;
    seatCodes: string; // "A1, A2"
    paymentStatus: string;
    createdAt: string;
}

export const meService = {
    getMyBookings: async (): Promise<MyBooking[]> => {
        const response = await axiosInstance.get<ApiResponse<MyBooking[]>>("/me/bookings");
        return response.data.result;
    },
};
