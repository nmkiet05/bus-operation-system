import axiosInstance from "../http/axios";

export interface PaymentRequest {
    bookingCode: string;
    method: string;
}

export interface PaymentResponse {
    bookingCode: string;
    transactionId: string;
    amount: number;
    status: string;
    message: string;
    paymentTime: string;
}

export const paymentService = {
    processPayment: async (data: PaymentRequest): Promise<PaymentResponse> => {
        const response = await axiosInstance.post<{ result: PaymentResponse; status: number; message: string }>("/payments/process", data);
        // Backend trả ApiResponse wrapper: { status, message, result }
        return response.data.result ?? (response.data as unknown as PaymentResponse);
    },

    // Backward compatibility
    simulatePayment: async (data: PaymentRequest): Promise<PaymentResponse> => {
        return paymentService.processPayment(data);
    },
};
