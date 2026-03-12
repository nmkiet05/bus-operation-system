import axiosInstance from "../http/axios";

/**
 * Trip API Service
 * Xử lý các API liên quan đến chuyến xe
 */

/**
 * Backend API Response wrapper
 */
interface ApiResponse<T> {
    code: number;
    message: string;
    result: T;
}

export interface TripSearchParams {
    fromProvinceId: number;
    toProvinceId: number;
    departureDate: string; // Format: YYYY-MM-DD
    busTypeId?: number;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    size?: number;
}

export interface Trip {
    id: number;
    routeCode: string;
    routeName: string;
    departureDate: string; // "YYYY-MM-DD" from backend LocalDate
    departureTime: string; // "HH:mm:ss" from backend LocalTime
    arrivalTime: string;   // ISO datetime from backend LocalDateTime
    duration: number; // minutes
    price: number;
    availableSeats: number;
    totalSeats: number;
    busType: string;
    busLicensePlate?: string;
    status: string;
    // B\u1ebfn xu\u1ea5t ph\u00e1t v\u00e0 b\u1ebfn \u0111\u1ebfn (t\u1eeb backend route.departureStation / arrivalStation)
    departureStationName?: string;
    arrivalStationName?: string;
}

export interface TripDetail extends Trip {
    routeId: number; // Route ID for fetching pickup points
    fromStation: {
        id: number;
        name: string;
        address: string;
        provinceName?: string;
    };
    toStation: {
        id: number;
        name: string;
        address: string;
        provinceName?: string;
    };
    seatMap: unknown; // JSON object
    bookedSeats: string[]; // Array of seat codes
}

/**
 * Tìm kiếm chuyến xe
 */
interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

export async function searchTrips(params: TripSearchParams): Promise<Trip[]> {
    const response = await axiosInstance.get<ApiResponse<PageResponse<Trip>>>("/operation/trips/search", {
        params,
    });
    return response.data.result.content;
}

/**
 * Lấy thông tin trip theo ID (Public - cho khách hàng)
 * Sử dụng endpoint search với filter tripId
 */
export async function getTripById(tripId: number): Promise<TripDetail> {
    // Use search endpoint to get trip details (public endpoint)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await axiosInstance.get<ApiResponse<PageResponse<any>>>("/operation/trips/search", {
        params: {
            size: 100, // Get enough to find our trip
        },
    });

    const trips = response.data.result.content;
    // Find trip by id since backend search doesn't support tripId filter
    const trip = trips.find((t: { id: number }) => t.id === tripId);
    if (!trip) {
        throw new Error(`Trip with ID ${tripId} not found`);
    }

    // Safe parsing of route name
    const routeParts = (trip.routeName || "").split(" - ");
    const fromProvinceName = routeParts[0] || "Chưa xác định";
    const toProvinceName = routeParts[1] || "Chưa xác định";

    // Build proper ISO datetimes from backend's LocalDate + LocalTime
    const depDate = trip.departureDate || new Date().toISOString().split("T")[0];
    const depTime = trip.departureTime || trip.actualDepartureTime || "00:00:00";
    const departureISO = `${depDate}T${depTime}`;

    // arrivalTime might be ISO or HH:mm:ss
    let arrivalISO = trip.arrivalTime;
    if (arrivalISO && !arrivalISO.includes("T")) {
        arrivalISO = `${depDate}T${arrivalISO}`;
    }

    // Calculate duration
    const depMs = new Date(departureISO).getTime();
    const arrMs = arrivalISO ? new Date(arrivalISO).getTime() : depMs;
    const duration = Math.max(0, Math.round((arrMs - depMs) / 60000));

    return {
        ...trip,
        departureTime: departureISO,
        arrivalTime: arrivalISO || departureISO,
        duration: trip.duration || duration,
        price: Number(trip.price) || 0,
        routeId: trip.routeId || 0,
        fromStation: {
            id: 0,
            name: "Bến xe",
            address: "",
            provinceName: fromProvinceName,
        },
        toStation: {
            id: 0,
            name: "Bến xe",
            address: "",
            provinceName: toProvinceName,
        },
        seatMap: {},
        bookedSeats: [],
    } as TripDetail;
}

/**
 * Lấy chi tiết chuyến xe (Requires Auth)
 */
export async function getTripDetail(tripId: number): Promise<TripDetail> {
    const response = await axiosInstance.get<ApiResponse<TripDetail>>(`/operation/trips/${tripId}`);
    return response.data.result;
}

/**
 * Lấy sơ đồ ghế của chuyến xe
 */
export async function getSeatMap(tripId: number): Promise<{
    seatMap: unknown;
    bookedSeats: string[];
    lockedSeats: string[];
}> {
    const response = await axiosInstance.get<ApiResponse<{
        seatMap: unknown;
        bookedSeats: string[];
        lockedSeats: string[];
    }>>(`/trips/${tripId}/seats`);
    return response.data.result;
}
