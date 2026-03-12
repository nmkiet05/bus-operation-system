import axiosClient from "@/services/http/axios";
import { BusType, SeatMapItem } from "../types";

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

export interface BusTypeRequest {
    name: string;
    totalSeats: number;
    seatMap: SeatMapItem[];
}

export const busTypeService = {
    getAll: async (): Promise<BusType[]> => {
        const { data } = await axiosClient.get<ApiListResponse<BusType>>("/fleet/bus-types");
        return data.result;
    },

    getById: async (id: number): Promise<BusType> => {
        const { data } = await axiosClient.get<ApiSingleResponse<BusType>>(`/fleet/bus-types/${id}`);
        return data.result;
    },

    create: async (request: BusTypeRequest): Promise<BusType> => {
        const { data } = await axiosClient.post<ApiSingleResponse<BusType>>("/fleet/bus-types", request);
        return data.result;
    },

    update: async (id: number, request: BusTypeRequest): Promise<BusType> => {
        const { data } = await axiosClient.put<ApiSingleResponse<BusType>>(`/fleet/bus-types/${id}`, request);
        return data.result;
    },

    delete: async (id: number): Promise<void> => {
        await axiosClient.delete(`/fleet/bus-types/${id}`);
    }
};
