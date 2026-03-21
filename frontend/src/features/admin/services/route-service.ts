import axiosClient from "@/services/http/axios";
import { Route, RouteRequest } from "../types";

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

export const routeService = {
    getAll: async (): Promise<Route[]> => {
        const { data } = await axiosClient.get<ApiListResponse<Route>>("/planning/routes");
        return data.result;
    },

    getById: async (id: number): Promise<Route> => {
        const { data } = await axiosClient.get<ApiSingleResponse<Route>>(`/planning/routes/${id}`);
        return data.result;
    },

    create: async (request: RouteRequest): Promise<Route> => {
        const { data } = await axiosClient.post<ApiSingleResponse<Route>>("/planning/routes", request);
        return data.result;
    },

    update: async (id: number, request: RouteRequest): Promise<Route> => {
        const { data } = await axiosClient.put<ApiSingleResponse<Route>>(`/planning/routes/${id}`, request);
        return data.result;
    },

    delete: async (id: number): Promise<void> => {
        await axiosClient.delete(`/planning/routes/${id}`);
    },

    getTrash: async (): Promise<Route[]> => {
        const { data } = await axiosClient.get<ApiListResponse<Route>>("/planning/routes/trash");
        return data.result;
    },

    restore: async (id: number): Promise<void> => {
        await axiosClient.post(`/planning/routes/${id}/restore`);
    },
};
