import axiosClient from "@/services/http/axios";
import { TripSchedule, TripScheduleRequest } from "../types";

interface ApiListResponse<T> {
    code: number;
    message: string;
    result: T[];
}

interface ApiSingleResponse<T> {
    code: number;
    message: string;
    result: T;
}

export const scheduleService = {
    getByRoute: async (routeId: number): Promise<TripSchedule[]> => {
        const { data } = await axiosClient.get<ApiListResponse<TripSchedule>>("/planning/schedules", {
            params: { routeId }
        });
        return data.result;
    },

    create: async (request: TripScheduleRequest): Promise<TripSchedule> => {
        const { data } = await axiosClient.post<ApiSingleResponse<TripSchedule>>("/planning/schedules", request);
        return data.result;
    },

    update: async (id: number, request: TripScheduleRequest): Promise<TripSchedule> => {
        const { data } = await axiosClient.put<ApiSingleResponse<TripSchedule>>(`/planning/schedules/${id}`, request);
        return data.result;
    },

    delete: async (id: number): Promise<void> => {
        await axiosClient.delete(`/planning/schedules/${id}`);
    },

    getTrashByRoute: async (routeId: number): Promise<TripSchedule[]> => {
        const { data } = await axiosClient.get<ApiListResponse<TripSchedule>>("/planning/schedules/trash", {
            params: { routeId }
        });
        return data.result;
    },

    restore: async (id: number): Promise<void> => {
        await axiosClient.post(`/planning/schedules/${id}/restore`);
    }
};
