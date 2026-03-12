import axiosClient from "@/services/http/axios";
import { BusFleetResponse, BusRequest } from "../types";

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

export const busService = {
    getAll: async (): Promise<BusFleetResponse[]> => {
        const { data } = await axiosClient.get<ApiListResponse<BusFleetResponse>>("/fleet/buses");
        return data.result;
    },

    create: async (request: BusRequest): Promise<BusFleetResponse> => {
        const { data } = await axiosClient.post<ApiSingleResponse<BusFleetResponse>>("/fleet/buses", request);
        return data.result;
    },

    update: async (id: number, request: BusRequest): Promise<BusFleetResponse> => {
        const { data } = await axiosClient.put<ApiSingleResponse<BusFleetResponse>>(`/fleet/buses/${id}`, request);
        return data.result;
    },

    delete: async (id: number): Promise<void> => {
        await axiosClient.delete(`/fleet/buses/${id}`);
    }
};
