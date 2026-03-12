import axiosClient from "@/services/http/axios";
import { FareConfig, FareConfigRequest } from "../types";

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

export const fareConfigService = {
    /** Lấy tất cả giá vé đang active */
    getAll: async (): Promise<FareConfig[]> => {
        const { data } = await axiosClient.get<ApiListResponse<FareConfig>>("/pricing/fares");
        return data.result;
    },

    /** Lấy giá vé active theo tuyến + loại xe */
    getActiveFare: async (routeId: number, busTypeId: number, date?: string): Promise<FareConfig> => {
        const params: Record<string, string | number> = { routeId, busTypeId };
        if (date) params.date = date;
        const { data } = await axiosClient.get<ApiSingleResponse<FareConfig>>("/pricing/fares/active", { params });
        return data.result;
    },

    /** Tạo mới hoặc cập nhật giá (SCD Type 2) */
    upsert: async (request: FareConfigRequest): Promise<FareConfig> => {
        const { data } = await axiosClient.post<ApiSingleResponse<FareConfig>>("/pricing/fares/upsert", request);
        return data.result;
    },
};
