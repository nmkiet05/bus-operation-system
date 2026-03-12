import { ApiResponse } from "@/features/auth/types";
import axiosClient from "@/services/http/axios";
import { CrewMember, CrewRole } from "../types";

// ==================== Request DTOs ====================

/** Khớp backend DriverAssignmentController.CrewAssignRequest */
export interface CrewAssignRequest {
    driverId: number;
    role: CrewRole; // MAIN_DRIVER | CO_DRIVER | ATTENDANT
}

// ==================== Service ====================

export const crewService = {
    /**
     * Lấy crew (tất cả PENDING + ACTIVE + COMPLETED) của 1 chuyến
     * Backend: GET /api/driver-assignments/trip/{tripId}/crew
     * Response: CrewMemberResponse[] { assignmentId, userId, fullName, phone, role, status }
     */
    getTripCrew: async (tripId: number): Promise<CrewMember[]> => {
        const { data } = await axiosClient.get<ApiResponse<CrewMember[]>>(
            `/driver-assignments/trip/${tripId}/crew`
        );
        return data.result || [];
    },

    /**
     * Gán nhân sự vào chuyến với role
     * Backend: POST /api/driver-assignments/trip/{tripId}/crew
     * Body: { driverId, role }
     * Response: CrewMemberResponse
     */
    assignCrewMember: async (tripId: number, request: CrewAssignRequest): Promise<CrewMember> => {
        const { data } = await axiosClient.post<ApiResponse<CrewMember>>(
            `/driver-assignments/trip/${tripId}/crew`,
            request
        );
        return data.result;
    },

    /**
     * Gán BATCH nhân sự vào chuyến (giống bán vé — gom list rồi submit)
     * Backend: POST /api/driver-assignments/trip/{tripId}/crew/batch
     * Body: { assignments: [{ driverId, role }, ...] }
     * Response: CrewMemberResponse[]
     */
    assignCrewBatch: async (tripId: number, assignments: CrewAssignRequest[]): Promise<CrewMember[]> => {
        const { data } = await axiosClient.post<ApiResponse<CrewMember[]>>(
            `/driver-assignments/trip/${tripId}/crew/batch`,
            { assignments }
        );
        return data.result || [];
    },

    /**
     * Hủy phân công tài xế
     * Backend: PATCH /api/driver-assignments/{id}/cancel
     */
    cancelAssignment: async (assignmentId: number): Promise<void> => {
        await axiosClient.patch(`/driver-assignments/${assignmentId}/cancel`);
    },

    /**
     * Swap tài xế (emergency)
     * Backend: PATCH /api/driver-assignments/{id}/replace?newDriverId=xxx
     */
    replaceDriver: async (assignmentId: number, newDriverId: number): Promise<void> => {
        await axiosClient.patch(`/driver-assignments/${assignmentId}/replace`, null, {
            params: { newDriverId }
        });
    },
};
