import axiosClient from "@/services/http/axios";
import Cookies from "js-cookie";
import { AuthResponse, LoginRequest, SignupRequest } from "../types";

const AUTH_URL = "/auth";

// Backend ApiResponse wrapper
interface ApiResponse<T> {
    success: boolean;
    result: T;
    message: string;
}

export const authService = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await axiosClient.post<ApiResponse<AuthResponse>>(`${AUTH_URL}/login`, data);
        return response.data.result; // Unwrap ApiResponse
    },

    register: async (data: SignupRequest) => {
        const response = await axiosClient.post<ApiResponse<unknown>>(`${AUTH_URL}/register`, data);
        return response.data.result;
    },

    logout: () => {
        Cookies.remove("token");
        localStorage.removeItem("user");
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem("user");
        if (userStr) return JSON.parse(userStr);
        return null;
    },

    // Lấy profile đầy đủ từ API (bao gồm phone, fullName mới nhất)
    getProfile: async (): Promise<AuthResponse> => {
        const response = await axiosClient.get<{ result: AuthResponse }>("/auth/me");
        return response.data.result;
    },
};
