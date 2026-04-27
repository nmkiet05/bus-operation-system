import axiosInstance, { CustomAxiosRequestConfig } from '@/services/http/axios';
import { ApiResponse } from '@/features/auth/types';
import { BookingResponse, CreateBookingRequest, SeatMapResponse } from '../types';

class BookingService {
    // Không cần prefix /api vì axios baseURL đã có sẵn
    private readonly BASE_URL_BOOKINGS = '/bookings';
    private readonly BASE_URL_OPERATION = '/operation';

    /**
     * Lấy sơ đồ ghế của chuyến
     * @param tripId ID chuyến xe
     */
    async getSeatMap(tripId: number): Promise<SeatMapResponse> {
        const response = await axiosInstance.get<ApiResponse<SeatMapResponse>>(
            `${this.BASE_URL_OPERATION}/trips/${tripId}/seat-map`,
            { skipAuth: true } as CustomAxiosRequestConfig
        );
        return response.data.result;
    }

    /**
     * Tạo booking mới
     * @param request Thông tin đặt vé
     */
    async createBooking(request: CreateBookingRequest): Promise<BookingResponse> {
        const response = await axiosInstance.post<ApiResponse<BookingResponse>>(
            this.BASE_URL_BOOKINGS,
            request,
            { skipAuth: true } as CustomAxiosRequestConfig
        );
        return response.data.result;
    }

    /**
     * Lấy thông tin booking theo mã
     * @param code Mã booking (PNR)
     */
    async getBookingByCode(code: string): Promise<BookingResponse> {
        const response = await axiosInstance.get<ApiResponse<BookingResponse>>(
            `${this.BASE_URL_BOOKINGS}/${code}`,
            { skipAuth: true } as CustomAxiosRequestConfig
        );
        return response.data.result;
    }

    /**
     * Hủy booking
     * @param bookingId ID booking
     */
    async cancelBooking(bookingId: number): Promise<BookingResponse> {
        const response = await axiosInstance.post<ApiResponse<BookingResponse>>(
            `${this.BASE_URL_BOOKINGS}/${bookingId}/cancel`
        );
        return response.data.result;
    }

    /**
     * Hủy booking public bằng mã + SĐT (guest flow)
     */
    async cancelBookingPublic(code: string, phone: string): Promise<BookingResponse> {
        const response = await axiosInstance.post<ApiResponse<BookingResponse>>(
            `${this.BASE_URL_BOOKINGS}/public/${code}/cancel`,
            null,
            {
                params: { phone },
                skipAuth: true,
            } as CustomAxiosRequestConfig
        );
        return response.data.result;
    }
    /**
     * Lấy danh sách booking của user hiện tại
     */
    async getMyBookings(): Promise<BookingResponse[]> {
        const response = await axiosInstance.get<ApiResponse<BookingResponse[]>>(
            '/me/bookings'
        );
        return response.data.result;
    }

    /**
     * Lấy chi tiết 1 booking của user hiện tại theo mã
     */
    async getMyBookingByCode(code: string): Promise<BookingResponse> {
        const response = await axiosInstance.get<ApiResponse<BookingResponse>>(
            `/me/bookings/${code}`
        );
        return response.data.result;
    }

    /**
     * User hiện tại hủy booking của chính mình
     */
    async cancelMyBooking(code: string): Promise<BookingResponse> {
        const response = await axiosInstance.post<ApiResponse<BookingResponse>>(
            `/me/bookings/${code}/cancel`
        );
        return response.data.result;
    }

    /**
     * User hiện tại hủy 1 vé trong booking của chính mình
     */
    async cancelMyTicket(code: string, ticketId: number): Promise<BookingResponse> {
        const response = await axiosInstance.post<ApiResponse<BookingResponse>>(
            `/me/bookings/${code}/tickets/${ticketId}/cancel`
        );
        return response.data.result;
    }

    /**
     * Tra cứu vé public (mã PNR + SĐT)
     */
    async searchBooking(code: string, phone: string): Promise<BookingResponse> {
        const response = await axiosInstance.get<ApiResponse<BookingResponse>>(
            `${this.BASE_URL_BOOKINGS}/search`,
            {
                params: { code, phone },
                skipAuth: true
            } as CustomAxiosRequestConfig
        );
        return response.data.result;
    }

    /**
     * Xác nhận thanh toán booking
     */
    async confirmBooking(code: string, paymentMethod: string = 'CASH'): Promise<BookingResponse> {
        const response = await axiosInstance.post<ApiResponse<BookingResponse>>(
            `${this.BASE_URL_BOOKINGS}/${code}/confirm`,
            null,
            { params: { paymentMethod } }
        );
        return response.data.result;
    }

    /**
     * Admin: Lấy tất cả bookings
     */
    async getAllBookings(): Promise<BookingResponse[]> {
        const response = await axiosInstance.get<ApiResponse<BookingResponse[]>>(
            this.BASE_URL_BOOKINGS
        );
        return response.data.result;
    }

    /**
     * Hủy 1 vé đơn lẻ
     * @param ticketId ID vé cần hủy
     */
    async cancelTicket(ticketId: number): Promise<BookingResponse> {
        const response = await axiosInstance.post<ApiResponse<BookingResponse>>(
            `${this.BASE_URL_BOOKINGS}/tickets/${ticketId}/cancel`
        );
        return response.data.result;
    }

    /**
     * Hủy vé public bằng mã + SĐT (guest flow)
     */
    async cancelTicketPublic(code: string, phone: string, ticketId: number): Promise<BookingResponse> {
        const response = await axiosInstance.post<ApiResponse<BookingResponse>>(
            `${this.BASE_URL_BOOKINGS}/public/${code}/tickets/${ticketId}/cancel`,
            null,
            {
                params: { phone },
                skipAuth: true,
            } as CustomAxiosRequestConfig
        );
        return response.data.result;
    }

    /**
     * Hủy nhiều vé chọn lọc
     * @param bookingId ID booking
     * @param ticketIds Danh sách ID vé cần hủy
     */
    async cancelTickets(bookingId: number, ticketIds: number[]): Promise<BookingResponse> {
        const response = await axiosInstance.post<ApiResponse<BookingResponse>>(
            `${this.BASE_URL_BOOKINGS}/${bookingId}/cancel-tickets`,
            ticketIds
        );
        return response.data.result;
    }
}

export const bookingService = new BookingService();
