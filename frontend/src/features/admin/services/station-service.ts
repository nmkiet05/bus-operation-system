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

export interface StationResponse {
    id: number;
    govCode: string;
    name: string;
    address: string;
    provinceId: number;
    provinceName: string;
    status: "ACTIVE" | "INACTIVE" | "CLOSED";
}

export interface StationRequest {
    govCode: string;
    name: string;
    address: string;
    provinceId: number;
    status?: "ACTIVE" | "INACTIVE" | "CLOSED";
}

export const stationService = {
    getAll: async (): Promise<StationResponse[]> => {
        const { data } = await axiosClient.get<ApiListResponse<StationResponse>>("/catalog/stations");
        return data.result;
    },

    create: async (request: StationRequest): Promise<StationResponse> => {
        const { data } = await axiosClient.post<ApiSingleResponse<StationResponse>>("/catalog/stations", request);
        return data.result;
    },

    deactivate: async (id: number): Promise<void> => {
        await axiosClient.delete(`/catalog/stations/${id}`);
    },
};
