package com.bus.system.common.utils;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

public class CodeGeneratorUtils {

    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final String NUMERIC = "0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * Sinh mã Chuyến xe (Trip) đóng vai trò Số Lệnh Vận Chuyển.
     * Format: LVC-[YYYYMMDD]-[4 Random Chars]
     * Ví dụ: LVC-20260212-A8X2
     */
    public static String generateTripCode(LocalDate departureDate) {
        String dateStr = departureDate.format(DateTimeFormatter.BASIC_ISO_DATE); // YYYYMMDD
        String seq = generateRandomString(4, ALPHANUMERIC);
        return "LVC-" + dateStr + "-" + seq;
    }

    /**
     * Sinh mã Lịch chạy mẫu (Trip Schedule).
     * Format: SCH-[Mã Tuyến]-[ThờiGian]
     * Ví dụ: SCH-7967-1530 (Trong đó 79-67 là format bóc từ routeCode)
     */
    public static String generateTripScheduleCode(String routeCode, LocalTime departureTime) {
        String cleanRouteCode = routeCode != null ? routeCode.replace("-", "") : "XXXX";
        String timeStr = departureTime.format(DateTimeFormatter.ofPattern("HHmm"));
        String suffix = generateRandomString(2, ALPHANUMERIC); // Đề phòng trùng giờ phút
        return "SCH-" + cleanRouteCode + "-" + timeStr + "-" + suffix;
    }

    /**
     * Sinh mã Điểm đón (Pickup Point).
     * Format: PP-[Mã Tuyến]-[Sequence/Random]
     * Ví dụ: PP-7967-01
     */
    public static String generatePickupPointCode(String routeCode, int sequence) {
        String cleanRouteCode = routeCode != null ? routeCode.replace("-", "") : "XXXX";
        String seqStr = String.format("%02d", sequence);
        return "PP-" + cleanRouteCode + "-" + seqStr;
    }

    /**
     * Sinh mã Loại xe (Bus Type).
     * Format: BT-[Tổng số ghế]-[Hạng/Random]
     * Ví dụ: BT-34-A7X2
     */
    public static String generateBusTypeCode(int totalSeats) {
        String suffix = generateRandomString(4, ALPHANUMERIC);
        return "BT-" + totalSeats + "-" + suffix;
    }

    /**
     * Hàm sinh mã PNR cho Vé (Booking).
     * Format: 6 ký tự Alphanumeric.
     */
    public static String generateBookingCode() {
        return generateRandomString(6, ALPHANUMERIC);
    }

    // --- HELPER METHODS ---

    private static String generateRandomString(int length, String charset) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(charset.charAt(RANDOM.nextInt(charset.length())));
        }
        return sb.toString();
    }
}
