import { ApiResponse } from "@/features/auth/types";
import axiosClient from "@/services/http/axios";

export interface DashboardStats {
    date: string;
    tripsToday: number;
    ticketsSoldToday: number;
    activeDriversToday: number;
    revenueToday: number;
}

export const dashboardService = {
    getTodayStats: async (): Promise<DashboardStats> => {
        const { data } = await axiosClient.get<ApiResponse<DashboardStats>>(
            "/operation/dashboard/stats"
        );
        return data.result;
    },
};
