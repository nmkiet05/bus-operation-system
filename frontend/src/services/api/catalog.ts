import axiosInstance from "../http/axios";

/**
 * Catalog API Service
 * Xử lý các API liên quan đến danh mục (Tỉnh, Bến xe, Loại xe)
 */

/**
 * Backend API Response wrapper
 */
interface ApiResponse<T> {
    code: number;
    message: string;
    result: T;
    timestamp: number;
}

export interface Province {
    id: number;
    govCode?: string;
    name: string;
}

export interface BusStation {
    id: number;
    govCode?: string;
    code?: string;
    name: string;
    address: string;
    provinceId: number;
    provinceName?: string;
    status?: string;
}

export interface BusType {
    id: number;
    code: string;
    name: string;
    totalSeats: number;
    seatMap: unknown; // JSON object
}

/**
 * Lấy danh sách tỉnh/thành phố
 */
export async function getProvinces(): Promise<Province[]> {
    const response = await axiosInstance.get<ApiResponse<Province[]>>("/catalog/provinces");
    return response.data.result;
}

/**
 * Lấy danh sách bến xe theo tỉnh
 */
export async function getStationsByProvince(provinceId: number): Promise<BusStation[]> {
    const response = await axiosInstance.get<ApiResponse<BusStation[]>>(`/catalog/stations`, {
        params: { provinceId },
    });
    return response.data.result;
}

/**
 * Lấy danh sách tất cả bến xe
 */
export async function getAllStations(): Promise<BusStation[]> {
    const response = await axiosInstance.get<ApiResponse<BusStation[]>>("/catalog/stations");
    return response.data.result;
}

/**
 * Lấy danh sách loại xe
 */
export async function getBusTypes(): Promise<BusType[]> {
    const response = await axiosInstance.get<ApiResponse<BusType[]>>("/catalog/bus-types");
    return response.data.result;
}

export const catalogService = {
    getProvinces,
    getStationsByProvince,
    getAllStations,
    getBusTypes,
};
