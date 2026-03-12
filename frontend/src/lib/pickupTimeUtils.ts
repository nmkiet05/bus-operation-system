/**
 * Utility functions for Pickup Point time calculations
 */

/**
 * Calculate pickup time based on departure time and estimated minutes
 * @param departureTime - Time in HH:mm format (e.g., "08:00")
 * @param estimatedMinutes - Minutes from departure (e.g., 30)
 * @returns Pickup time in HH:mm format (e.g., "08:30")
 * 
 * @example
 * calculatePickupTime("08:00", 30) // "08:30"
 * calculatePickupTime("23:30", 60) // "00:30" (next day)
 */
export function calculatePickupTime(
    departureTime: string,
    estimatedMinutes: number
): string {
    const [hours, minutes] = departureTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + estimatedMinutes;
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Format pickup time with label
 * @param departureTime - Departure time in HH:mm format
 * @param estimatedMinutes - Minutes from departure
 * @returns Formatted string (e.g., "Dự kiến đón lúc 08:30")
 */
export function formatPickupTimeLabel(
    departureTime: string,
    estimatedMinutes: number
): string {
    const pickupTime = calculatePickupTime(departureTime, estimatedMinutes);
    return `Dự kiến đón lúc ${pickupTime}`;
}
