export enum BookingStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
    REFUNDED = 'REFUNDED',
}

export enum TicketStatus {
    AVAILABLE = 'AVAILABLE', // Frontend logic only
    ACTIVE = 'ACTIVE', // Mới tạo (mặc định)
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CHECKED_IN = 'CHECKED_IN', // Đã lên xe
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED', // Hoàn tiền
    NO_SHOW = 'NO_SHOW', // Vắng mặt
    EXPIRED = 'EXPIRED',
}

export interface TicketRequest {
    tripId: number;
    seatNumber: string;
    price: number;
    fareConfigId?: number; // Vé trẻ em, người già...
    pickupPointId?: number;
    dropoffPointId?: number;
    passengerName?: string;
    passengerPhone?: string;
}

export interface CreateBookingRequest {
    userId?: number; // Optional nếu khách vãng lai
    guestName: string;
    guestPhone: string;
    guestEmail?: string;
    paymentMethod: string; // VNPAY, MOMO, CASH
    idempotencyKey?: string; // UUID v4
    tickets: TicketRequest[];
}

export interface TicketResponse {
    id: number;
    tripId: number;
    seatNumber: string;
    price: number;
    status: TicketStatus;
    // Enriched trip details
    routeName?: string;
    departureStationName?: string;
    arrivalStationName?: string;
    departureDate?: string;   // "2026-02-15"
    departureTime?: string;   // "07:00"
    // Thông tin xe
    busLicensePlate?: string; // "51B-123.45"
    busTypeName?: string;     // "Giường nằm 40 chỗ"
    // Điểm đón/trả
    pickupPointName?: string;
    dropoffPointName?: string;
    
    // Hành khách thực tế
    passengerName?: string;
    passengerPhone?: string;
}

export interface BookingResponse {
    id: number;
    code: string;
    guestName: string;
    guestPhone: string;
    guestEmail?: string; // Optional, backend chưa trả về
    totalAmount: number;
    status: BookingStatus;
    paymentMethod: string;
    createdAt: string;
    expiredAt: string;
    tickets: TicketResponse[];
}

export interface SeatMapResponse {
    tripId: number;
    totalSeats: number;
    bookedSeats: number;
    availableSeats: number;
    occupiedSeats: string[]; // Danh sách ghế ĐÃ ĐẶT (PENDING/CONFIRMED)
    availableSeatsNumbers?: string[]; // Danh sách ghế TRỐNG (Optional)
}
