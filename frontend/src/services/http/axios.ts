import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

/**
 * Axios HTTP Client Configuration
 * Tích hợp JWT authentication và error handling
 */

// Custom config interface để hỗ trợ skipAuth flag (type-safe, không dùng any)
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    skipAuth?: boolean;
}

// Base URL từ environment variable
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// Tạo Axios instance
const axiosInstance: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000, // 10 seconds
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Request Interceptor
 * Tự động thêm JWT token vào header
 */
axiosInstance.interceptors.request.use(
    (config: CustomAxiosRequestConfig) => {
        // Lấy token từ Cookie (js-cookie)
        const token = Cookies.get("token");

        // Chỉ đính kèm Token nếu không có flag skipAuth
        // (Dùng cho các API công khai như booking)
        if (token && config.headers && !config.skipAuth) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

/**
 * Response Interceptor
 * Xử lý lỗi tập trung
 */
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        // Xử lý 401 Unauthorized - Token hết hạn hoặc không hợp lệ
        if (error.response?.status === 401) {
            // Xóa token và redirect đến trang đăng nhập tương ứng
            if (typeof window !== "undefined") {
                const isAdminRoute = window.location.pathname.startsWith('/admin');
                Cookies.remove("token", { path: '/' });
                localStorage.removeItem("user");
                window.location.href = isAdminRoute ? "/admin" : "/login";
            }
        }

        // Xử lý các lỗi khác
        return Promise.reject(error);
    }
);

// Export interface để dùng ở các service khác
export type { CustomAxiosRequestConfig };
export default axiosInstance;
