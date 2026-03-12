import axiosClient from "@/services/http/axios";
import { PickupPoint, PickupPointRequest } from "../types";
import { ApiResponse } from "@/features/auth/types";

export const pickupPointService = {
    // Lấy danh sách điểm đón/trả của một tuyến
    getByRoute: async (routeId: number): Promise<PickupPoint[]> => {
        const { data } = await axiosClient.get<ApiResponse<PickupPoint[]>>(`/planning/routes/${routeId}/pickup-points`);
        return data.result || [];
    },

    // Thêm điểm đón/trả mới
    create: async (routeId: number, payload: PickupPointRequest): Promise<PickupPoint> => {
        const { data } = await axiosClient.post<ApiResponse<PickupPoint>>(`/planning/routes/${routeId}/pickup-points`, payload);
        return data.result;
    },

    // Cập nhật điểm đón/trả
    update: async (routeId: number, id: number, payload: PickupPointRequest): Promise<PickupPoint> => {
        const { data } = await axiosClient.put<ApiResponse<PickupPoint>>(`/planning/routes/${routeId}/pickup-points/${id}`, payload);
        return data.result;
    },

    // Xóa điểm đón/trả
    delete: async (routeId: number, id: number): Promise<void> => {
        await axiosClient.delete(`/planning/routes/${routeId}/pickup-points/${id}`);
    }
};
