import { ApiResponse } from "@/features/auth/types";
import axiosClient from "@/services/http/axios";

// ==================== Types ====================

export type TripChangeType =
    | "REPLACE_DRIVER"
    | "REPLACE_CO_DRIVER"
    | "REPLACE_ATTENDANT"
    | "REPLACE_BUS"
    | "INCIDENT_SWAP";

export type TripChangeStatus =
    | "PENDING"
    | "ESCALATED"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED";

export type ChangeUrgencyZone =
    | "STANDARD"
    | "URGENT"
    | "CRITICAL"
    | "DEPARTED"
    | "MID_ROUTE";

export type IncidentType =
    | "FATIGUE_SWAP"
    | "DRIVER_HEALTH"
    | "VEHICLE_BREAKDOWN"
    | "TRAFFIC_ACCIDENT";

export interface TripChangeRequest {
    id: number;
    tripId: number;
    routeName?: string;
    licensePlate?: string;

    changeType: TripChangeType;
    
    oldDriverId?: number;
    oldDriverName?: string;
    newDriverId?: number;
    newDriverName?: string;
    
    oldBusId?: number;
    newBusId?: number;

    requestReason?: string;
    status: TripChangeStatus;
    isEmergency?: boolean;

    urgencyZone: ChangeUrgencyZone;
    incidentType?: IncidentType;
    incidentGps?: string;

    createdBy?: number;
    approvedBy?: number;
    rejectedReason?: string;

    createdAt: string;
    updatedAt: string;
}

export interface CreateTripChangeRequest {
    tripId: number;
    changeType: TripChangeType;
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

    /**
     * Hậu kiểm yêu cầu khẩn cấp (vùng auto-execute)
     */
    review: async (id: number, approved: boolean, notes?: string): Promise<void> => {
        await axiosClient.post<ApiResponse<void>>(
            `/operation/trip-changes/${id}/review`,
            null,
            { params: { approved, notes } }
        );
    },

    /**
     * Báo sự cố dọc đường (MID_ROUTE)
     */
    incident: async (
        request: CreateTripChangeRequest,
        incidentType: IncidentType,
        incidentGps?: string
    ): Promise<TripChangeRequest> => {
        const { data } = await axiosClient.post<ApiResponse<TripChangeRequest>>(
            "/operation/trip-changes/incident",
            request,
            { params: { incidentType, incidentGps } }
        );
        return data.result;
    },
};
