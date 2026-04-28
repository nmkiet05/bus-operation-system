package com.bus.system.modules.sales.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO cho việc tạo booking mới
 */
@Data
public class CreateBookingRequest {

    // Thông tin khách hàng
    private Long userId; // Null nếu khách vãng lai

    @NotBlank(message = "Tên khách hàng không được để trống")
    @Size(max = 100)
    private String guestName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^0\\d{9}$", message = "Số điện thoại không hợp lệ")
    private String guestPhone;

    @Email(message = "Email không hợp lệ")
    private String guestEmail;

    // Danh sách ghế đặt
    @NotNull(message = "Danh sách vé không được để trống")
    @Size(min = 1, message = "Phải có ít nhất 1 vé")
    private List<TicketRequest> tickets;

    // Phương thức thanh toán
    @NotBlank(message = "Phương thức thanh toán không được để trống")
    private String paymentMethod; // CASH, VNPAY, MOMO

    // Idempotency key (để chống duplicate booking)
    private String idempotencyKey;

    /**
     * DTO cho thông tin vé/ghế trong booking
     */
    @Data
    public static class TicketRequest {

        @NotNull(message = "Trip ID không được để trống")
        private Long tripId;

        @NotBlank(message = "Số ghế không được để trống")
        private String seatNumber;

        @NotNull(message = "Giá vé không được để trống")
        @DecimalMin(value = "0.0", inclusive = false, message = "Giá vé phải lớn hơn 0")
        private BigDecimal price;

        private Long fareConfigId;
        private Long pickupPointId;
        private Long dropoffPointId;

        private String passengerName;
        private String passengerPhone;
    }
}
