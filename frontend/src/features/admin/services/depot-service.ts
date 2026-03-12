import axiosClient from "@/services/http/axios";

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

export interface DepotResponse {
    id: number;
    name: string;
    address: string;
    capacity: number | null;
    latitude: number | null;
    longitude: number | null;
    status: "ACTIVE" | "INACTIVE";
}

export interface DepotRequest {
    name: string;
    address?: string;
    capacity?: number;
    latitude?: number;
    longitude?: number;
    status?: "ACTIVE" | "INACTIVE";
}

export const depotService = {
    getAll: async (): Promise<DepotResponse[]> => {
        const { data } = await axiosClient.get<ApiListResponse<DepotResponse>>("/depots");
        return data.result;
    },

    create: async (request: DepotRequest): Promise<DepotResponse> => {
        const { data } = await axiosClient.post<ApiSingleResponse<DepotResponse>>("/depots", request);
        return data.result;
    },

    update: async (id: number, request: DepotRequest): Promise<DepotResponse> => {
        const { data } = await axiosClient.put<ApiSingleResponse<DepotResponse>>(`/depots/${id}`, request);
        return data.result;
    },

    delete: async (id: number): Promise<void> => {
        await axiosClient.delete(`/depots/${id}`);
    },
};
