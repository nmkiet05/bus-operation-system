package com.bus.system.modules.sales.dto.response;

import com.bus.system.modules.sales.domain.enums.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO trả về thông tin booking
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    private Long id;
    private String code; // Mã booking (PNR)

    // Thông tin khách
    private Long userId;
    private String guestName;
    private String guestPhone;
    private String guestEmail;

    // Thông tin đơn
    private BigDecimal totalAmount;
    private String channel;
    private String paymentMethod;
    private BookingStatus status;

    // Danh sách vé
    private List<TicketResponse> tickets;

    // Nhân viên xác nhận (NULL = auto qua gateway)
    private String confirmedByName;

    // Timestamps
    private LocalDateTime expiredAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
