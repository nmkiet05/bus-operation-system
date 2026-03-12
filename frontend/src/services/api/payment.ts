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
    simulatePayment: async (data: PaymentRequest): Promise<PaymentResponse> => {
        const response = await axiosInstance.post<PaymentResponse>("/payments/simulate", data);
        return response.data;
    },
};
