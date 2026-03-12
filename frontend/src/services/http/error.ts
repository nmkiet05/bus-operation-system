import { AxiosError } from "axios";

/**
 * API Error Handler
 * Xử lý và format lỗi từ API
 */

export interface ApiError {
    message: string;
    status?: number;
    code?: string;
    errors?: Record<string, string[]>;
}

/**
 * Parse lỗi từ Axios Error
 */
export function parseApiError(error: unknown): ApiError {
    if (error instanceof AxiosError) {
        const response = error.response;

        if (response) {
            // Lỗi từ Backend
            return {
                message: response.data?.message || "Đã xảy ra lỗi từ server",
                status: response.status,
                code: response.data?.code,
                errors: response.data?.errors,
            };
        }

        // Lỗi network
        if (error.request) {
            return {
                message: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.",
                code: "NETWORK_ERROR",
            };
        }
    }

    // Lỗi không xác định
    return {
        message: error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định",
        code: "UNKNOWN_ERROR",
    };
}

/**
 * Toast notification helper (sẽ tích hợp với toast library sau)
 */
export function showErrorToast(error: ApiError) {
    // TODO: Tích hợp với react-hot-toast hoặc sonner
    console.error("API Error:", error);
}
