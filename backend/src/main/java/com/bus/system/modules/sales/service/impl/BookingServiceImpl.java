package com.bus.system.modules.sales.service.impl;

import com.bus.system.modules.sales.config.BookingProperties;
import com.bus.system.modules.sales.constant.BookingConstants;
import com.bus.system.modules.sales.domain.enums.BookingStatus;
import com.bus.system.modules.sales.domain.enums.TicketStatus;
import com.bus.system.common.exception.BadRequestException;
import com.bus.system.common.exception.ResourceNotFoundException;
import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.operation.domain.Trip;
import com.bus.system.modules.planning.domain.PickupPoint;
import com.bus.system.modules.pricing.domain.FareConfig;
import com.bus.system.modules.sales.domain.Booking;
import com.bus.system.modules.sales.domain.Ticket;
import com.bus.system.modules.sales.dto.request.CreateBookingRequest;
import com.bus.system.modules.sales.dto.request.CreateBookingRequest.TicketRequest;
import com.bus.system.modules.sales.dto.response.BookingResponse;
import com.bus.system.modules.sales.dto.response.SeatMapResponse;
import com.bus.system.modules.sales.mapper.BookingMapper;
import com.bus.system.modules.sales.repository.BookingRepository;
import com.bus.system.modules.sales.repository.TicketRepository;
import com.bus.system.modules.sales.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Implementation của BookingService
 * Class này chịu trách nhiệm xử lý toàn bộ logic đặt vé, bao gồm:
 * 1. Chống duplicate request (Idempotency)
 * 2. Chống double-booking (Distributed Lock với Redisson)
 * 3. Tạo Booking và Ticket entities
 * 4. Quản lý trạng thái Booking (Tạo mới, Hủy)
 * Config values được inject từ application.yml thông qua BookingProperties
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final BookingMapper bookingMapper;
    private final RedissonClient redissonClient;
    private final RedisTemplate<String, String> redisTemplate;
    private final BookingProperties bookingProperties;

    // Integration Clients (Microservices Simulation)
    private final com.bus.system.modules.sales.integration.OperationServiceClient operationServiceClient;
    private final com.bus.system.modules.sales.integration.IdentityServiceClient identityServiceClient;
    private final com.bus.system.modules.sales.integration.PricingServiceClient pricingServiceClient;
    private final com.bus.system.modules.sales.integration.PlanningServiceClient planningServiceClient;
    private final com.bus.system.modules.identity.repository.UserRepository userRepository;

    /**
     * Tạo mới một Booking (Đặt vé)
     * Quy trình xử lý:
     * 1. Kiểm tra Idempotency Key để tránh xử lý trùng request.
     * 2. Acquire Distributed Lock cho từng ghế để tránh xung đột (race condition).
     * 3. Kiểm tra lại trạng thái ghế trong DB (double-check).
     * 4. Tạo Booking entity từ request (thông qua Mapper).
     * 5. Tạo các Ticket entities và liên kết với Booking.
     * 6. Lưu xuống DB (Optimistic Locking sẽ catch conflict cuối cùng).
     * 7. Lưu Idempotency Key vào Cache.
     * 8. Trả về kết quả.
     * 
     * @param request Thông tin đặt vé
     * @return BookingResponse Thông tin booking đã tạo
     */
    @Override
    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request) {
        log.info("Creating booking for guest: {}, phone: {}", request.getGuestName(), request.getGuestPhone());

        // 1. Kiểm tra Idempotency Key (chống duplicate request mạng mẽo/retry từ
        // client)
        if (request.getIdempotencyKey() != null) {
            String cachedResult = redisTemplate.opsForValue()
                    .get(BookingConstants.IDEMPOTENCY_KEY_PREFIX + request.getIdempotencyKey());
            if (cachedResult != null) {
                log.warn("Duplicate request detected, idempotencyKey: {}", request.getIdempotencyKey());
                // Trả về kết quả cũ từ cache nếu đã xử lý thành công trước đó
                Booking existingBooking = bookingRepository.findByCode(cachedResult)
                        .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + cachedResult));
                return bookingMapper.toResponse(existingBooking);
            }
        }

        // 2. Lock từng ghế bằng Redisson (distributed lock)
        // Tạo key lock unique cho mỗi ghế của chuyến xe:
        // seat-lock:{tripId}:{seatNumber}
        // IMPORTANT: Sort keys lexicographic để tránh deadlock khi 2 user đặt cùng ghế
        // theo thứ tự ngược
        List<RLock> locks = request.getTickets().stream()
                .map(ticketReq -> BookingConstants.SEAT_LOCK_PREFIX + ticketReq.getTripId() + ":"
                        + ticketReq.getSeatNumber())
                .sorted() // Consistent lock ordering → prevent deadlock
                .map(redissonClient::getLock)
                .collect(Collectors.toList());

        try {
            // Acquire all locks (timeout: 10s, lease: 5 minutes)
            // Cố gắng lấy lock cho tất cả các ghế. Nếu không lấy được (do người khác đang
            // giữ),
            // sẽ chờ (wait) tối đa waitTimeoutSeconds.
            for (RLock lock : locks) {
                boolean acquired = lock.tryLock(
                        bookingProperties.getLock().getWaitTimeoutSeconds(),
                        bookingProperties.getLock().getLeaseTimeSeconds(),
                        TimeUnit.SECONDS);
                if (!acquired) {
                    throw new BadRequestException("Không thể khóa ghế, vui lòng thử lại (High Traffic)");
                }
            }

            // 3. Kiểm tra ghế đã bán chưa (Critical Section - đã có lock)
            // Query DB để chắc chắn ghế chưa bị đặt bởi transaction đã commit trước đó.
            for (TicketRequest ticketReq : request.getTickets()) {
                boolean isBooked = ticketRepository.isSeatBooked(ticketReq.getTripId(), ticketReq.getSeatNumber());
                if (isBooked) {
                    throw new BadRequestException("Ghế " + ticketReq.getSeatNumber() + " đã có người đặt");
                }
            }

            // 4. Tạo Booking entity (sử dụng mapper để map fields và business logic như
            // expiredAt)
            String bookingCode = generateBookingCode();
            Booking booking = bookingMapper.toEntity(request, bookingCode);

            // Nếu request có userId (đã đăng nhập), gán user vào booking
            if (request.getUserId() != null) {
                User user = identityServiceClient.getUserById(Objects.requireNonNull(request.getUserId()))
                        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getUserId()));
                booking.setUser(user);
            }

            // 5. Tạo tickets và add vào booking
            for (TicketRequest ticketReq : request.getTickets()) {
                Ticket ticket = createTicket(ticketReq);
                booking.addTicket(ticket);
            }

            // 6. Save (Optimistic locking @Version sẽ bắt nếu có conflict ngầm)
            Booking savedBooking = bookingRepository.save(booking);

            // 7. Lưu Idempotency Key vào Redis (cache 1 giờ - configurable)
            // Để các request sau có cùng key sẽ bị chặn ở bước 1
            if (request.getIdempotencyKey() != null) {
                redisTemplate.opsForValue().set(
                        BookingConstants.IDEMPOTENCY_KEY_PREFIX + request.getIdempotencyKey(),
                        Objects.requireNonNull(savedBooking.getCode(), "booking code must not be null"),
                        bookingProperties.getCache().getIdempotencyTtlHours(),
                        TimeUnit.HOURS);
            }

            log.info("Booking created successfully: {}", savedBooking.getCode());
            return bookingMapper.toResponse(savedBooking);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Lock acquisition interrupted", e);
        } finally {
            // Unlock tất cả ghế (quan trọng: luôn unlock trong finally)
            locks.forEach(lock -> {
                if (lock != null && lock.isHeldByCurrentThread()) {
                    lock.unlock();
                }
            });
        }
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingByCode(String code) {
        // Dùng JOIN FETCH để load toàn bộ Ticket → Trip → Route → BusStation trong 1
        // query
        // Tránh N+1: mỗi ticket sẽ không fire thêm query LAZY riêng
        Booking booking = bookingRepository.findByCodeWithFullDetails(code)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + code));
        return bookingMapper.toResponse(booking);
    }

    /**
     * Hủy Booking
     * Chỉ cho phép hủy khi đang ở trạng thái PENDING hoặc CONFIRMED.
     * Khi hủy booking, tất cả tickets cũng sẽ chuyển sang trạng thái CANCELLED.
     */
    @Override
    @Transactional
    public BookingResponse cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findByIdWithFullDetails(
                Objects.requireNonNull(bookingId, "bookingId must not be null"))
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));

        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BadRequestException("Không thể hủy booking ở trạng thái: " + booking.getStatus());
        }

        // Update status booking
        booking.setStatus(BookingStatus.CANCELLED);
        // Update status all tickets
        booking.getTickets().forEach(ticket -> ticket.setStatus(TicketStatus.CANCELLED));

        Booking cancelled = bookingRepository.save(booking);
        log.info("Booking cancelled: {}", booking.getCode());
        return bookingMapper.toResponse(cancelled);
    }

    @Override
    @Transactional
    public BookingResponse confirmBooking(String bookingCode, String paymentMethod) {
        Booking booking = bookingRepository.findByCodeWithFullDetails(bookingCode)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingCode));

        // Idempotency check logic could go here or relying on status check
        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            return bookingMapper.toResponse(booking); // Already confirmed
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Không thể xác nhận booking ở trạng thái: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setPaymentMethod(paymentMethod);

        // Ghi nhận nhân viên xác nhận (nếu có - NULL = auto qua payment gateway)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            String username = auth.getName();
            Optional<User> staffOpt = userRepository.findByUsername(username);
            staffOpt.ifPresent(booking::setConfirmedBy);
            log.info("Booking {} confirmed manually by staff: {}", bookingCode, username);
        } else {
            // Auto-confirm qua payment gateway (VNPay IPN, etc.)
            booking.setConfirmedBy(null);
            log.info("Booking {} auto-confirmed via payment gateway", bookingCode);
        }

        // Cập nhật trạng thái tất cả vé active → CONFIRMED
        booking.getTickets().forEach(ticket -> {
            if (ticket.getStatus() == TicketStatus.PENDING || ticket.getStatus() == TicketStatus.ACTIVE) {
                ticket.setStatus(TicketStatus.CONFIRMED);
            }
        });

        Booking saved = bookingRepository.save(booking);
        log.info("Booking confirmed: {} via {}", bookingCode, paymentMethod);
        return bookingMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByUser(Long userId) {
        List<Booking> bookings = bookingRepository.findByUserIdWithFullDetails(userId);
        return bookings.stream()
                .map(bookingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingByCodeForUser(String code, Long userId) {
        Booking booking = bookingRepository.findByCodeAndUserIdWithFullDetails(code, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking không tồn tại hoặc không thuộc về user hiện tại: " + code));
        return bookingMapper.toResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public SeatMapResponse getSeatMap(Long tripId) {
        // Lấy totalSeats từ Trip → Bus → BusType (ưu tiên)
        // Nếu chưa gán xe → fallback qua ScheduleBusType (loại xe trong lịch chạy)
        Trip trip = operationServiceClient.getTripById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found: " + tripId));

        Integer totalSeats = null;
        if (trip.getBus() != null && trip.getBus().getBusType() != null) {
            totalSeats = trip.getBus().getBusType().getTotalSeats();
        } else if (trip.getTripSchedule() != null) {
            // Chưa gán xe → lấy loại xe đầu tiên từ ScheduleBusType
            var allowedTypes = planningServiceClient.getEffectiveBusTypesByScheduleId(
                    trip.getTripSchedule().getId());
            if (allowedTypes != null && !allowedTypes.isEmpty()) {
                totalSeats = allowedTypes.get(0).getTotalSeats();
            }
        }
        if (totalSeats == null) {
            throw new BadRequestException(
                    "Không xác định được số ghế. Chuyến chưa gán xe hoặc chưa cấu hình loại xe.");
        }

        // Lấy tất cả vé ĐANG ACTIVE của chuyến này
        List<Ticket> bookedTickets = ticketRepository.findByTripId(tripId);

        // Lọc ra ghế đã bán (status khác CANCELLED, EXPIRED)
        List<String> occupiedSeats = bookedTickets.stream()
                .filter(t -> t.getStatus() != TicketStatus.CANCELLED && t.getStatus() != TicketStatus.EXPIRED)
                .map(Ticket::getSeatNumber)
                .collect(Collectors.toList());

        return SeatMapResponse.builder()
                .tripId(tripId)
                .totalSeats(totalSeats)
                .bookedSeats(occupiedSeats.size())
                .availableSeats(totalSeats - occupiedSeats.size())
                .occupiedSeats(occupiedSeats)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAllWithFullDetails().stream()
                .map(bookingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse searchBooking(String code, String phone) {
        Booking booking = bookingRepository.findByCodeWithFullDetails(code)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy booking: " + code));

        // Xác minh SĐT khớp
        if (!booking.getGuestPhone().equals(phone)) {
            throw new BadRequestException("Mã booking không khớp với số điện thoại.");
        }
        return bookingMapper.toResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse cancelBookingForUser(String code, Long userId) {
        Booking booking = bookingRepository.findByCodeAndUserIdWithFullDetails(code, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking không tồn tại hoặc không thuộc về user hiện tại: " + code));
        return cancelBooking(booking.getId());
    }

    @Override
    @Transactional
    public BookingResponse cancelTicketForUser(String code, Long ticketId, Long userId) {
        Booking booking = bookingRepository.findByCodeAndUserIdWithFullDetails(code, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking không tồn tại hoặc không thuộc về user hiện tại: " + code));

        boolean ticketBelongsToBooking = booking.getTickets().stream().anyMatch(t -> t.getId().equals(ticketId));
        if (!ticketBelongsToBooking) {
            throw new BadRequestException("Vé không thuộc booking của user hiện tại");
        }

        return cancelTicket(ticketId);
    }

    /**
     * Hủy 1 vé đơn lẻ.
     * Nếu tất cả vé đều cancelled → auto-cancel booking.
     * Recalc totalAmount sau khi hủy.
     */
    @Override
    @Transactional
    public BookingResponse cancelTicket(Long ticketId) {
        Ticket ticket = ticketRepository.findById(Objects.requireNonNull(ticketId, "ticketId must not be null"))
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketId));

        validateTicketCancellable(ticket);
        ticket.setStatus(TicketStatus.CANCELLED);
        ticketRepository.save(ticket);

        Booking booking = bookingRepository.findByIdWithFullDetails(ticket.getBooking().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        recalcAndAutoCancel(booking);
        log.info("Ticket #{} cancelled from booking {}", ticketId, booking.getCode());
        return bookingMapper.toResponse(booking);
    }

    /**
     * Hủy nhiều vé chọn lọc trong 1 booking.
     * Nếu tất cả vé đều cancelled → auto-cancel booking.
     */
    @Override
    @Transactional
    public BookingResponse cancelTickets(Long bookingId, List<Long> ticketIds) {
        Booking booking = bookingRepository.findByIdWithFullDetails(
                Objects.requireNonNull(bookingId, "bookingId must not be null"))
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));

        for (Ticket ticket : booking.getTickets()) {
            if (ticketIds.contains(ticket.getId())) {
                validateTicketCancellable(ticket);
                ticket.setStatus(TicketStatus.CANCELLED);
            }
        }

        recalcAndAutoCancel(booking);
        log.info("Cancelled {} tickets from booking {}", ticketIds.size(), booking.getCode());
        return bookingMapper.toResponse(bookingRepository.save(booking));
    }

    // ====== Helper Methods ======

    /** Validate vé có thể hủy (chưa cancelled/expired, chưa check-in) */
    private void validateTicketCancellable(Ticket ticket) {
        if (ticket.getStatus() == TicketStatus.CANCELLED || ticket.getStatus() == TicketStatus.EXPIRED) {
            throw new BadRequestException("Vé #" + ticket.getId() + " đã ở trạng thái: " + ticket.getStatus());
        }
        if (Boolean.TRUE.equals(ticket.getIsCheckedIn())) {
            throw new BadRequestException("Vé #" + ticket.getId() + " đã check-in, không thể hủy");
        }
    }

    /**
     * Tính lại totalAmount từ các vé còn active.
     * Auto-cancel booking nếu tất cả vé đều cancelled.
     */
    private void recalcAndAutoCancel(Booking booking) {
        BigDecimal activeTotal = booking.getTickets().stream()
                .filter(t -> t.getStatus() != TicketStatus.CANCELLED && t.getStatus() != TicketStatus.EXPIRED)
                .map(Ticket::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        booking.setTotalAmount(activeTotal);

        boolean allCancelled = booking.getTickets().stream()
                .allMatch(t -> t.getStatus() == TicketStatus.CANCELLED || t.getStatus() == TicketStatus.EXPIRED);
        if (allCancelled) {
            booking.setStatus(BookingStatus.CANCELLED);
            log.info("Auto-cancelled booking {} (all tickets cancelled)", booking.getCode());
        }
        bookingRepository.save(booking);
    }

    private String generateBookingCode() {
        // Format: BOS + timestamp + random
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(7);
        String random = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return "BOS" + timestamp + random;
    }

    /**
     * Helper tạo Ticket entity từ request request
     * <p>
     * <b>Tại sao logic này KHÔNG nằm trong Mapper?</b>
     * <br>
     * 1. <b>Separation of Concerns (Phân tách mối quan tâm):</b> Mapper chỉ nên
     * chịu trách nhiệm chuyển đổi dữ liệu (DTO <-> Entity),
     * không nên chứa business logic như validate dữ liệu (check tồn tại) hay gọi
     * Database.
     * <br>
     * 2. <b>Performance & Transaction:</b> Việc gọi Repository bên trong Mapper sẽ
     * ẩn đi các query database,
     * khó kiểm soát vấn đề N+1 query và phạm vi transaction.
     * <br>
     * 3. <b>Testing:</b> Giữ logic lookup trong Service giúp dễ dàng mock
     * Repository khi viết Unit Test cho Service,
     * thay vì phải mock cả Mapper (nếu Mapper phụ thuộc vào Repository).
     * </p>
     */
    private Ticket createTicket(CreateBookingRequest.TicketRequest ticketReq) {
        Ticket ticket = new Ticket();

        // 1. Link Trip
        Trip trip = operationServiceClient
                .getTripById(Objects.requireNonNull(ticketReq.getTripId(), "tripId must not be null"))
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found: " + ticketReq.getTripId()));
        ticket.setTrip(trip);

        // 2. Set Basic Info
        ticket.setSeatNumber(ticketReq.getSeatNumber());
        ticket.setPrice(ticketReq.getPrice());
        ticket.setStatus(TicketStatus.PENDING); // Mới tạo thì pending thanh toán

        // Thông tin hành khách
        ticket.setPassengerName(ticketReq.getPassengerName());
        ticket.setPassengerPhone(ticketReq.getPassengerPhone());

        // 3. Link FareConfig (nếu có - vé trẻ em, người cao tuổi...)
        if (ticketReq.getFareConfigId() != null) {
            FareConfig fareConfig = pricingServiceClient
                    .getFareConfigById(Objects.requireNonNull(ticketReq.getFareConfigId()))
                    .orElseThrow(() -> new ResourceNotFoundException("FareConfig not found"));
            ticket.setFareConfig(fareConfig);
        }

        // 4. Link Pickup/Dropoff Points (nếu khách chọn điểm đón trả cụ thể)
        if (ticketReq.getPickupPointId() != null) {
            PickupPoint pickupPoint = planningServiceClient
                    .getPickupPointById(Objects.requireNonNull(ticketReq.getPickupPointId()))
                    .orElseThrow(() -> new ResourceNotFoundException("PickupPoint not found"));
            ticket.setPickupPoint(pickupPoint);
        }

        if (ticketReq.getDropoffPointId() != null) {
            PickupPoint dropoffPoint = planningServiceClient
                    .getPickupPointById(Objects.requireNonNull(ticketReq.getDropoffPointId()))
                    .orElseThrow(() -> new ResourceNotFoundException("DropoffPoint not found"));
            ticket.setDropoffPoint(dropoffPoint);
        }

        return ticket;
    }
}
