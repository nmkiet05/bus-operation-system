/**
 * Utility functions cho date/time formatting trong admin module
 * Tách từ AssignmentForm.tsx để tái sử dụng
 */

/**
 * Build ISO datetime string từ dateStr + timeStr
 * @param dateStr - "2026-03-01"
 * @param timeStr - "08:00" hoặc "2026-03-01T08:00:00"
 * @param isEnd - nếu true và không có timeStr → dùng 23:59:59
 */
export function formatDateTime(dateStr?: string, timeStr?: string, isEnd: boolean = false): string {
    if (!dateStr) return "";
    if (!timeStr) {
        return isEnd ? `${dateStr}T23:59:59` : `${dateStr}T00:00:00`;
    }
    if (timeStr.includes('T')) return timeStr; // Already ISO format
    return `${dateStr}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}`;
}

/**
 * Extract HH:mm từ ISO datetime hoặc time string
 * @param isoOrTime - "2026-03-01T08:00:00" hoặc "08:00"
 * @returns "08:00" hoặc "--:--"
 */
export function extractTime(isoOrTime?: string): string {
    if (!isoOrTime) return "--:--";
    if (isoOrTime.includes('T')) return isoOrTime.split('T')[1].slice(0, 5);
    return isoOrTime.slice(0, 5);
}

/**
 * Format date string sang dd/MM/yyyy (VN format)
 * @param dateStr - "2026-03-01"
 * @returns "01/03/2026"
 */
export function formatDateVN(dateStr?: string): string {
    if (!dateStr) return "";
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
}
