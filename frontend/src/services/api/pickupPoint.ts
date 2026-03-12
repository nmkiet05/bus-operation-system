import axiosInstance from "../http/axios";

/**
 * Pickup Point API Service
 * Xử lý các API liên quan đến điểm đón/trả khách dọc đường
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

/**
 * Pickup Point entity
 * Represents a pickup/dropoff point along a route
 */
export interface PickupPoint {
    id: number;
    routeId: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    sequenceOrder: number;
    estimatedMinutesFromDeparture: number;
    status: "ACTIVE" | "INACTIVE";
}

/**
 * Create Pickup Point Request (Admin only)
 */
export interface CreatePickupPointRequest {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    sequenceOrder: number;
    estimatedMinutesFromDeparture: number;
}

/**
 * Update Pickup Point Request (Admin only)
 * Same structure as create request
 */
export type UpdatePickupPointRequest = CreatePickupPointRequest;

/**
 * Get all pickup points for a specific route
 * @param routeId - Route ID
 * @returns List of pickup points sorted by sequenceOrder
 */
export async function getPickupPointsByRoute(
    routeId: number
): Promise<PickupPoint[]> {
    const response = await axiosInstance.get<ApiResponse<PickupPoint[]>>(
        `/planning/routes/${routeId}/pickup-points`
    );
    return response.data.result;
}

/**
 * Get a single pickup point by ID
 * @param id - Pickup Point ID
 * @returns Pickup point details
 */
export async function getPickupPointById(id: number): Promise<PickupPoint> {
    const response = await axiosInstance.get<ApiResponse<PickupPoint>>(
        `/planning/pickup-points/${id}`
    );
    return response.data.result;
}

/**
 * Create a new pickup point (Admin only)
 * @param routeId - Route ID
 * @param data - Pickup point data
 * @returns Created pickup point
 */
export async function createPickupPoint(
    routeId: number,
    data: CreatePickupPointRequest
): Promise<PickupPoint> {
    const response = await axiosInstance.post<ApiResponse<PickupPoint>>(
        `/planning/routes/${routeId}/pickup-points`,
        data
    );
    return response.data.result;
}

/**
 * Update a pickup point (Admin only)
 * @param id - Pickup Point ID
 * @param data - Updated pickup point data
 * @returns Updated pickup point
 */
export async function updatePickupPoint(
    id: number,
    data: UpdatePickupPointRequest
): Promise<PickupPoint> {
    const response = await axiosInstance.put<ApiResponse<PickupPoint>>(
        `/planning/pickup-points/${id}`,
        data
    );
    return response.data.result;
}

/**
 * Delete a pickup point (Admin only, soft delete)
 * @param id - Pickup Point ID
 */
export async function deletePickupPoint(id: number): Promise<void> {
    await axiosInstance.delete(`/planning/pickup-points/${id}`);
}
