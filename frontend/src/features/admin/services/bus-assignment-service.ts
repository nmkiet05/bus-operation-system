import { ApiResponse } from "@/features/auth/types";
import axiosClient from "@/services/http/axios";
import { BusAssignment } from "../types";

// ==================== Request Types ====================

export interface CreateBusAssignmentRequest {
    busId: number;
    startDepotId?: number;
    scheduledStart: string; // ISO datetime
    scheduledEnd: string;   // ISO datetime
    notes?: string;
    tripIds?: number[];     // Gán trips ngay khi tạo ca
}

export interface UpdateBusAssignmentRequest {
    scheduledStart?: string; // ISO datetime
    scheduledEnd?: string;   // ISO datetime
    notes?: string;
}

// ==================== Service ====================

export const busAssignmentService = {
    /**
     * Tạo Ca xe mới
     */
    create: async (request: CreateBusAssignmentRequest): Promise<BusAssignment> => {
        const { data } = await axiosClient.post<ApiResponse<BusAssignment>>(
            "/bus-assignments",
            request
        );
        return data.result;
    },

    /**
     * Cập nhật Ca xe (thời gian, ghi chú)
     */
    update: async (id: number, request: UpdateBusAssignmentRequest): Promise<BusAssignment> => {
        const { data } = await axiosClient.put<ApiResponse<BusAssignment>>(
            `/bus-assignments/${id}`,
            request
        );
        return data.result;
    },

    /**
     * Lấy danh sách Ca xe theo ngày (và bus nếu có)
     */
    list: async (date: string, busId?: number): Promise<BusAssignment[]> => {
        const params: Record<string, unknown> = { date };
        if (busId) params.busId = busId;
        const { data } = await axiosClient.get<ApiResponse<BusAssignment[]>>(
            "/bus-assignments",
            { params }
        );
        return data.result || [];
    },

    /**
     * Gán trip vào ca xe
     */
    assignTrip: async (assignmentId: number, tripId: number): Promise<BusAssignment> => {
        const { data } = await axiosClient.post<ApiResponse<BusAssignment>>(
            `/bus-assignments/${assignmentId}/trips/${tripId}`
        );
        return data.result;
    },

    /**
     * Check-in xe tại bãi
     */
    checkIn: async (id: number, odometer: number, fuelLevel: number, byUserId: number, notes?: string, depotId?: number): Promise<void> => {
        await axiosClient.patch(`/bus-assignments/${id}/check-in`, null, {
            params: { odometer, fuelLevel, byUserId, notes, depotId }
        });
    },

    /**
     * Check-out xe tại bãi
     */
    checkOut: async (id: number, odometer: number, fuelLevel: number, byUserId: number, notes?: string, depotId?: number): Promise<void> => {
        await axiosClient.patch(`/bus-assignments/${id}/check-out`, null, {
            params: { odometer, fuelLevel, byUserId, notes, depotId }
        });
    },

    /**
     * Kết thúc ca xe sớm (emergency)
     */
    endEarly: async (id: number): Promise<void> => {
        await axiosClient.patch(`/bus-assignments/${id}/end-early`);
    },

    /**
     * Gỡ trip khỏi ca xe
     */
    unassignTrip: async (assignmentId: number, tripId: number): Promise<BusAssignment> => {
        const { data } = await axiosClient.delete<ApiResponse<BusAssignment>>(
            `/bus-assignments/${assignmentId}/trips/${tripId}`
        );
        return data.result;
    },
};
