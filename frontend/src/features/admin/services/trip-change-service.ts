import { ApiResponse } from "@/features/auth/types";
import axiosClient from "@/services/http/axios";

// ==================== Types ====================

export interface TripChangeRequest {
    id: number;
    tripId: number;
    changeType: string; // REPLACE_DRIVER, REPLACE_BUS, REPLACE_BOTH
    urgencyZone: string; // PLANNING, PRE_DEPARTURE, NEAR_DEPARTURE, POST_DEPARTURE, MID_ROUTE
    reason: string;
    status: string; // PENDING, APPROVED, REJECTED, CANCELLED, AUTO_APPROVED, ROLLBACK
    oldDriverId?: number;
    oldDriverName?: string;
    newDriverId?: number;
    newDriverName?: string;
    oldBusId?: number;
    oldBusPlate?: string;
    newBusId?: number;
    newBusPlate?: string;
    requestedById: number;
    requestedByName: string;
    approvedById?: number;
    approvedByName?: string;
    rejectReason?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTripChangeRequest {
    tripId: number;
    changeType: string;
    reason: string;
    newDriverId?: number;
    newBusId?: number;
}

// ==================== Service ====================

export const tripChangeService = {
    /**
     * Lấy danh sách tất cả yêu cầu thay đổi
     */
    getAll: async (): Promise<TripChangeRequest[]> => {
        const { data } = await axiosClient.get<ApiResponse<TripChangeRequest[]>>(
            "/operation/trip-changes"
        );
        return data.result || [];
    },

    /**
     * Tạo yêu cầu phân công lại
     */
    create: async (request: CreateTripChangeRequest): Promise<TripChangeRequest> => {
        const { data } = await axiosClient.post<ApiResponse<TripChangeRequest>>(
            "/operation/trip-changes",
            request
        );
        return data.result;
    },

    /**
     * Duyệt yêu cầu
     */
    approve: async (id: number): Promise<TripChangeRequest> => {
        const { data } = await axiosClient.post<ApiResponse<TripChangeRequest>>(
            `/operation/trip-changes/${id}/approve`
        );
        return data.result;
    },

    /**
     * Từ chối yêu cầu
     */
    reject: async (id: number, reason: string): Promise<TripChangeRequest> => {
        const { data } = await axiosClient.post<ApiResponse<TripChangeRequest>>(
            `/operation/trip-changes/${id}/reject`,
            null,
            { params: { reason } }
        );
        return data.result;
    },

    /**
     * Rollback yêu cầu đã duyệt
     */
    rollback: async (id: number): Promise<TripChangeRequest> => {
        const { data } = await axiosClient.post<ApiResponse<TripChangeRequest>>(
            `/operation/trip-changes/${id}/rollback`
        );
        return data.result;
    },
};
