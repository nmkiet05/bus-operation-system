import { ApiResponse } from "@/features/auth/types";
import axiosClient from "@/services/http/axios";

// ==================== Types ====================

export interface TripChangeRequest {
    id: number;
    tripId: number;
    routeName?: string;
    licensePlate?: string;

    changeType: string; // REPLACE_DRIVER, REPLACE_BUS, REPLACE_BOTH
    
    oldDriverId?: number;
    oldDriverName?: string;
    newDriverId?: number;
    newDriverName?: string;
    
    oldBusId?: number;
    newBusId?: number;

    requestReason?: string;
    status: string; // PENDING, APPROVED, REJECTED, CANCELLED, AUTO_APPROVED, ROLLBACK
    isEmergency?: boolean;

    urgencyZone: string; // STANDARD, URGENT, CRITICAL, DEPARTED, MID_ROUTE
    incidentType?: string;
    incidentGps?: string;

    createdBy?: number;
    approvedBy?: number;
    rejectedReason?: string;

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
    approve: async (id: number): Promise<void> => {
        await axiosClient.post<ApiResponse<void>>(
            `/operation/trip-changes/${id}/approve`
        );
    },

    /**
     * Từ chối yêu cầu
     */
    reject: async (id: number, reason: string): Promise<void> => {
        await axiosClient.post<ApiResponse<void>>(
            `/operation/trip-changes/${id}/reject`,
            null,
            { params: { reason } }
        );
    },

    /**
     * Rollback yêu cầu đã duyệt
     */
    rollback: async (id: number): Promise<void> => {
        await axiosClient.post<ApiResponse<void>>(
            `/operation/trip-changes/${id}/rollback`
        );
    },
};
