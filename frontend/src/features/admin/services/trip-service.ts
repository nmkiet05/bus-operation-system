import { ApiResponse } from "@/features/auth/types";
import axiosClient from "@/services/http/axios";
import { Trip, DriverAvailable, Bus } from "../types";

// Request params cho tìm kiếm chuyến (Admin)
export interface TripSearchParams {
    routeId?: number;
    fromProvinceId?: number;
    toProvinceId?: number;
    fromDate?: string; // yyyy-MM-dd
    toDate?: string; // yyyy-MM-dd
    status?: string;
    [key: string]: unknown;
}

// Payload cho điều độ
export interface AssignmentRequest {
    driverId?: number;
    busId?: number;
}

export const tripService = {
    // ==================== QUERY ====================

    // Lấy danh sách chuyến (Admin)
    getTrips: async (params: TripSearchParams): Promise<Trip[]> => {
        const { data } = await axiosClient.get<ApiResponse<Trip[]>>("/operation/trips", {
            params,
        });
        return data.result || [];
    },

    // Lấy chi tiết chuyến
    getTripById: async (id: number): Promise<Trip> => {
        const { data } = await axiosClient.get<ApiResponse<Trip>>(`/operation/trips/${id}`);
        return data.result;
    },

    // ==================== RESOURCES (Thông minh — theo tripId) ====================

    // DS tài xế khả dụng cho chuyến cụ thể (có scoring + route registration filter)
    getAvailableDriversForTrip: async (tripId: number): Promise<DriverAvailable[]> => {
        const { data } = await axiosClient.get<ApiResponse<DriverAvailable[]>>(
            `/operation/trips/${tripId}/resources/drivers/available`
        );
        return data.result || [];
    },

    // DS xe khả dụng cho chuyến cụ thể (có scoring + route registration filter)
    getAvailableBusesForTrip: async (tripId: number): Promise<Bus[]> => {
        const { data } = await axiosClient.get<ApiResponse<Bus[]>>(
            `/operation/trips/${tripId}/resources/buses/available`
        );
        return data.result || [];
    },

    // ==================== DISPATCH (Điều độ) ====================

    // Gán xe/tài xế
    assignResources: async (id: number, payload: AssignmentRequest): Promise<Trip> => {
        const { data } = await axiosClient.patch<ApiResponse<Trip>>(
            `/operation/trips/${id}/assignment`,
            payload
        );
        return data.result;
    },

    // Duyệt lệnh xuất bến (SCHEDULED → APPROVED)
    approveTrip: async (id: number): Promise<void> => {
        await axiosClient.post(`/operation/trips/${id}/approve`);
    },

    // ==================== LIFECYCLE (Vòng đời) ====================

    // Bắt đầu chuyến (APPROVED → RUNNING)
    startTrip: async (id: number): Promise<Trip> => {
        const { data } = await axiosClient.post<ApiResponse<Trip>>(`/operation/trips/${id}/start`);
        return data.result;
    },

    // Kết thúc chuyến (RUNNING → COMPLETED)
    completeTrip: async (id: number): Promise<Trip> => {
        const { data } = await axiosClient.post<ApiResponse<Trip>>(`/operation/trips/${id}/complete`);
        return data.result;
    },

    // Hủy chuyến (SCHEDULED|APPROVED → CANCELLED)
    cancelTrip: async (id: number): Promise<void> => {
        await axiosClient.post(`/operation/trips/${id}/cancel`);
    },

    // ==================== LEGACY (backward compat) ====================

    // DS tài xế khả dụng (by time range — fallback)
    getAvailableDrivers: async (startTime: string, endTime: string): Promise<DriverAvailable[]> => {
        const { data } = await axiosClient.get<ApiResponse<DriverAvailable[]>>("/operation/trips/resources/drivers/available", {
            params: { startTime, endTime }
        });
        return data.result || [];
    },

    // DS xe khả dụng (by time range — fallback)
    getAvailableBuses: async (startTime: string, endTime: string): Promise<Bus[]> => {
        const { data } = await axiosClient.get<ApiResponse<Bus[]>>("/operation/trips/resources/buses/available", {
            params: { startTime, endTime }
        });
        return data.result || [];
    },

    // ==================== GENERATION (Sinh chuyến) ====================

    // Sinh chuyến tự động từ lịch trình (Schedules)
    generateTrips: async (payload: {
        routeId: number;
        fromDate: string;
        toDate: string;
        forceRegenerate?: boolean;
    }): Promise<TripGenerationResponse> => {
        const { data } = await axiosClient.post<ApiResponse<TripGenerationResponse>>(
            "/operation/trips/generate",
            payload
        );
        return data.result;
    },

    // Tạo chuyến thủ công (MAIN hoặc REINFORCEMENT)
    createTrip: async (payload: {
        tripScheduleId: number;
        departureDate: string;
        departureTime?: string;
        tripType?: string;
        busId?: number;
        note?: string;
    }): Promise<Trip> => {
        const { data } = await axiosClient.post<ApiResponse<Trip>>(
            "/operation/trips",
            payload
        );
        return data.result;
    },
};

// Response type cho sinh chuyến tự động
export interface TripGenerationResponse {
    success: boolean;
    totalTripsCreated: number;
    totalSkipped: number;
    message: string;
}
