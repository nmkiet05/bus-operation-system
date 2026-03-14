"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { SeatMap, Seat, SeatLegend } from "@/features/booking/components/SeatMap";
import type { SeatStatus } from "@/features/booking/components/SeatMap";
import { StepIndicator } from "@/features/booking/components/StepIndicator";
import { StepPickupDropoff } from "@/features/booking/components/StepPickupDropoff";
import { StepPassengerInfo } from "@/features/booking/components/StepPassengerInfo";
import { StepConfirmation } from "@/features/booking/components/StepConfirmation";
import { useBookingFlow } from "@/features/booking/hooks/useBookingFlow";
import { useAuth } from "@/providers/auth-provider";
import { TripDetail, getTripById } from "@/services/api/trips";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Loader2, ArrowLeft, Bus, ChevronLeft, ChevronRight, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { bookingService } from "@/features/booking/services/booking-service";
import { CreateBookingRequest, TicketRequest, BookingResponse } from "@/features/booking/types";
import { paymentService } from "@/services/api/payment";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BookingPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const searchParamsHook = useSearchParams();
    const tripId = Number(params.tripId);
    const returnTripId = searchParamsHook.get("returnTripId");
    const isRoundTrip = !!returnTripId;

    const [trip, setTrip] = useState<TripDetail | null>(null);
    const [returnTrip, setReturnTrip] = useState<TripDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [seats, setSeats] = useState<Seat[]>([]);
    const [returnSeats, setReturnSeats] = useState<Seat[]>([]);
    const [bookingTab, setBookingTab] = useState<"outbound" | "return">("outbound");
    const [processing, setProcessing] = useState(false);
    const stepContentRef = useRef<HTMLDivElement>(null);

    // Always scroll to step indicator on step change, offset for fixed navbar
    const scrollToStepContent = useCallback(() => {
        // Use setTimeout to wait for React to re-render the new step content
        setTimeout(() => {
            if (!stepContentRef.current) return;
            stepContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }, []);

    // Multi-step booking flow
    const {
        currentStep,
        bookingData,
        goToNextStep,
        goToPrevStep,
        updateSeats,
        updatePickupDropoff,
        updateReturnSeats,
        updateReturnPickupDropoff,
        updatePassengers,
        updateContactInfo,
        updatePaymentMethod,
        canProceedFromStep,
    } = useBookingFlow(tripId);

    // Helper to generate UUID v4 for Idempotency Key
    const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    const handleBookingSubmit = async () => {
        if (!trip || !bookingData.contactInfo) return;

        setProcessing(true);
        try {
            // 1. Prepare Tickets Payload
            const tickets: TicketRequest[] = [];

            // Outbound tickets
            bookingData.selectedSeats.forEach(seatNum => {
                const passenger = bookingData.passengers.find(p => p.seatCode === seatNum);
                tickets.push({
                    tripId: trip.id,
                    seatNumber: seatNum,
                    price: trip.price,
                    pickupPointId: bookingData.pickupPointId || undefined,
                    dropoffPointId: bookingData.dropoffPointId || undefined,
                    passengerName: passenger?.fullName || bookingData.contactInfo?.fullName,
                    passengerPhone: passenger?.phone || bookingData.contactInfo?.phone,
                });
            });

            // Return tickets (if any)
            if (isRoundTrip && returnTrip) {
                bookingData.returnSelectedSeats.forEach(seatNum => {
                    const returnPassenger = bookingData.passengers.find(p => p.returnSeatCode === seatNum || p.seatCode === seatNum); // Fallback to seatCode loosely just in case
                    tickets.push({
                        tripId: returnTrip.id,
                        seatNumber: seatNum,
                        price: returnTrip.price,
                        pickupPointId: bookingData.returnPickupPointId || undefined,
                        dropoffPointId: bookingData.returnDropoffPointId || undefined,
                        passengerName: returnPassenger?.fullName || bookingData.contactInfo?.fullName,
                        passengerPhone: returnPassenger?.phone || bookingData.contactInfo?.phone,
                    });
                });
            }

            // 2. Prepare Booking Request
            const request: CreateBookingRequest = {
                userId: user?.id,
                guestName: bookingData.contactInfo?.fullName || "Guest", // Lấy chuẩn tên Đại Diện từ Form Liên Hệ
                guestPhone: bookingData.contactInfo?.phone || "",
                guestEmail: bookingData.contactInfo?.email || "",
                paymentMethod: bookingData.paymentMethod || "COUNTER",
                idempotencyKey: generateUUID(),
                tickets: tickets
            };

            // 3. Call API
            const response = await bookingService.createBooking(request);

            // 4. Success handling
            // Unwrap nếu backend trả wrapper ApiResponse<BookingResponse>
            const bookingResult = (response as unknown as { result?: BookingResponse }).result || response;
            const bookingCode = bookingResult?.code;

            if (!bookingCode) {
                throw new Error("Không nhận được mã đặt vé từ server");
            }

            // 5. Process Payment (Simulated)
            try {
                // Chỉ gọi API thanh toán nếu phương thức không phải là trả sau (COUNTER/CASH)
                // Tuy nhiên, để demo "Real API", ta gọi simulate cho mọi trường hợp để update status -> CONFIRMED
                // Trong thực tế, nếu là VNPAY thì redirect, nếu CASH thì ...
                if (request.paymentMethod !== "COUNTER") {
                    const paymentRes = await paymentService.simulatePayment({
                        bookingCode: bookingCode,
                        method: request.paymentMethod || "CASH"
                    });
                    console.log("Payment successful:", paymentRes);
                    toast.success("Thanh toán thành công!", {
                        description: `Giao dịch: ${paymentRes.transactionId}`
                    });
                }
            } catch (paymentError) {
                console.error("Payment simulation failed:", paymentError);
                toast.warning("Đặt vé thành công nhưng thanh toán thất bại/chưa hoàn tất.", {
                    description: "Vui lòng kiểm tra lại trong phần Lịch sử vé."
                });
            }

            // 6. Cache response vào sessionStorage để success page không cần gọi lại API
            try {
                sessionStorage.setItem(
                    `booking_cache_${bookingCode}`,
                    JSON.stringify(bookingResult)
                );
            } catch {
                // sessionStorage full hoặc bị disabled → không sao, success page sẽ fallback gọi API
            }

            // Redirect to Success Page
            setTimeout(() => {
                router.push(`/booking/success?code=${bookingCode}`);
            }, 1000);

        } catch (error: unknown) {
            console.error("Booking failed:", error);

            const err = error as {
                response?: {
                    status?: number;
                    data?: {
                        message?: string;
                        code?: number;
                    }
                };
                message?: string;
            };

            const status = err.response?.status;
            const msg = err.response?.data?.message
                || err.message
                || "Đặt vé thất bại. Vui lòng thử lại.";

            // Hiển thị lỗi
            toast.error("Lỗi đặt vé", {
                description: msg,
                duration: 5000,
            });

            // Xử lý lỗi đặt trùng (400 Bad Request hoặc 409 Conflict)
            if (status === 400 || status === 409) {
                // TODO: Reload seat map từ API để cập nhật trạng thái ghế mới
                // Hiện tại để mock, sau khi có API seat map thực thì gọi:
                // await loadRealSeatMap(tripId);

                // Quay lại bước 1 để người dùng chọn lại ghế
                setTimeout(() => {
                    setBookingTab("outbound");
                    toast.info("Vui lòng chọn lại ghế vì ghế vừa chọn có thể đã được đặt bởi người khác.");
                    // goToStep(1); // Uncomment khi muốn force quay lại step 1
                }, 1500);
            }
        } finally {
            setProcessing(false);
        }
    };

    // Helper: generate Seat[] from totalSeats + occupiedSeats
    const generateSeats = (totalSeats: number, occupiedSeats: string[], price: number): Seat[] => {
        const half = Math.ceil(totalSeats / 2);
        return Array.from({ length: totalSeats }, (_, i) => {
            const deck: 1 | 2 = i < half ? 1 : 2;
            const deckIndex = i < half ? i : i - half;
            const prefix = deck === 1 ? "A" : "B";
            const id = `${prefix}${String(deckIndex + 1).padStart(2, "0")}`;
            const col = deckIndex % 3;
            const row = Math.floor(deckIndex / 3);
            const isBooked = occupiedSeats.includes(id);
            return {
                id,
                type: "SEAT" as const,
                status: (isBooked ? "BOOKED" : "AVAILABLE") as SeatStatus,
                price,
                deck,
                row,
                col,
            };
        });
    };

    useEffect(() => {
        const loadTripData = async () => {
            setLoading(true);
            try {
                // 1. Fetch trip details from API
                const tripData = await getTripById(tripId);
                setTrip(tripData);

                // 2. Fetch seat map from API (ghế đã đặt)
                const seatMap = await bookingService.getSeatMap(tripId);
                const generatedSeats = generateSeats(
                    seatMap.totalSeats,
                    seatMap.occupiedSeats || [],
                    Number(tripData.price) || 0
                );
                setSeats(generatedSeats);

                // 3. Load return trip if round-trip
                if (returnTripId) {
                    const returnTripData = await getTripById(Number(returnTripId));
                    setReturnTrip(returnTripData);

                    const returnSeatMap = await bookingService.getSeatMap(Number(returnTripId));
                    const returnGeneratedSeats = generateSeats(
                        returnSeatMap.totalSeats,
                        returnSeatMap.occupiedSeats || [],
                        Number(returnTripData.price) || 0
                    );
                    setReturnSeats(returnGeneratedSeats);
                }
            } catch (error) {
                console.error("Failed to load trip data:", error);
                toast.error("Không thể tải thông tin chuyến xe. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };

        if (tripId) {
            loadTripData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tripId]);

    const handleSeatClick = (seat: Seat) => {
        if (bookingData.selectedSeats.includes(seat.id)) {
            updateSeats(bookingData.selectedSeats.filter((id) => id !== seat.id));
        } else {
            if (bookingData.selectedSeats.length >= 5) {
                toast.warning("Bạn chỉ được chọn tối đa 5 ghế");
                return;
            }
            updateSeats([...bookingData.selectedSeats, seat.id]);
        }
    };

    const handleReturnSeatClick = (seat: Seat) => {
        if (bookingData.returnSelectedSeats.includes(seat.id)) {
            updateReturnSeats(bookingData.returnSelectedSeats.filter((id) => id !== seat.id));
        } else {
            if (bookingData.returnSelectedSeats.length >= 5) {
                toast.warning("Bạn chỉ được chọn tối đa 5 ghế cho chuyến về");
                return;
            }
            updateReturnSeats([...bookingData.returnSelectedSeats, seat.id]);
        }
    };

    const handlePickupDropoffChange = (
        pickupId: number | null,
        dropoffId: number | null
    ) => {
        updatePickupDropoff(pickupId, dropoffId);
    };

    const handleReturnPickupDropoffChange = (
        pickupId: number | null,
        dropoffId: number | null
    ) => {
        updateReturnPickupDropoff(pickupId, dropoffId);
    };

    const handleNext = () => {
        if (currentStep === 4) {
            // Submit booking (API Call)
            handleBookingSubmit();
            return;
        }
        if (canProceedFromStep(currentStep, isRoundTrip)) {
            setBookingTab("outbound");
            goToNextStep();
            scrollToStepContent();
        } else {
            if (isRoundTrip && currentStep === 1) {
                if (bookingData.selectedSeats.length === 0) {
                    toast.error("Vui lòng chọn ghế cho chuyến đi");
                    setBookingTab("outbound");
                } else if (bookingData.returnSelectedSeats.length === 0) {
                    toast.error("Vui lòng chọn ghế cho chuyến về");
                    setBookingTab("return");
                }
            } else {
                toast.error("Vui lòng hoàn thành bước hiện tại");
            }
        }
    };

    const outboundPrice = (trip?.price || 0) * bookingData.selectedSeats.length;
    const returnPrice = returnTrip ? (returnTrip.price * bookingData.returnSelectedSeats.length) : 0;
    const totalPrice = outboundPrice + returnPrice;

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 text-gray-500">
                <p>Không tìm thấy chuyến đi</p>
                <Button variant="outline" onClick={() => router.back()}>
                    Quay lại
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Header Banner - Matching trips page style */}
            <div className="bg-brand-blue pt-20 pb-8 mb-0 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute right-0 top-0 h-full w-1/3 opacity-20">
                        <div className="absolute right-10 top-0 h-24 w-24 rounded-full bg-white blur-[60px]" />
                    </div>
                </div>

                {/* Header Content */}
                <div className="container mx-auto px-4 relative z-10">
                    {/* Top Row: Back button + Date */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-white" />
                        </button>
                        <p className="text-sm text-white/80">
                            {format(new Date(trip.departureTime), "EEEE, dd/MM/yyyy", {
                                locale: vi,
                            })}
                        </p>
                    </div>

                    {/* Centered Route Information */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-white">
                                {trip.fromStation.provinceName || trip.fromStation.name}
                                {isRoundTrip ? (
                                    <ArrowLeftRight className="inline h-6 w-6 mx-2 opacity-80" />
                                ) : (
                                    <span className="mx-2">→</span>
                                )}
                                {trip.toStation.provinceName || trip.toStation.name}
                            </h1>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            {isRoundTrip && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-400 text-amber-900 px-2.5 py-0.5 rounded-full">
                                    <ArrowLeftRight className="h-3 w-3" />
                                    Khứ hồi
                                </span>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* Step Indicator */}
            <div ref={stepContentRef} style={{ scrollMarginTop: '4rem' }}>
                <StepIndicator currentStep={currentStep} />
            </div>

            <main className="container mx-auto px-4 py-6 max-w-4xl">
                {/* Trip Info Card - Outbound */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-3">
                    {isRoundTrip && (
                        <div className="flex items-center gap-1.5 mb-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chuyến đi</span>
                            <span className="text-xs text-gray-400">
                                • {format(new Date(trip.departureTime), "dd/MM/yyyy")}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                                <Bus className="h-5 w-5 text-brand-blue" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{trip.routeName}</p>
                                <p className="text-xs text-gray-500">{trip.busType}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-xl text-emerald-600">
                                {new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                }).format(trip.price)}
                            </div>
                            <div className="text-[11px] text-gray-400">/vé</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-3">
                        <div className="flex flex-col items-center gap-0.5">
                            <span className="font-bold text-lg text-gray-900">
                                {format(new Date(trip.departureTime), "HH:mm")}
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium">
                                {trip.fromStation.name}
                            </span>
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <div className="flex-1 border-t-2 border-dashed border-gray-300 relative">
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-50 px-2 text-[11px] text-gray-400 font-medium whitespace-nowrap">
                                    {Math.floor(trip.duration / 60)}h{trip.duration % 60 > 0 ? `${trip.duration % 60}p` : ""}
                                </span>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                            <span className="font-bold text-lg text-gray-900">
                                {format(new Date(trip.arrivalTime), "HH:mm")}
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium">
                                {trip.toStation.name}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Trip Info Card - Return (Round-trip only) */}
                {isRoundTrip && returnTrip && (
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
                        <div className="flex items-center gap-1.5 mb-3">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chuyến về</span>
                            <span className="text-xs text-gray-400">
                                • {format(new Date(returnTrip.departureTime), "dd/MM/yyyy")}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                    <Bus className="h-5 w-5 text-orange-500" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{returnTrip.routeName}</p>
                                    <p className="text-xs text-gray-500">{returnTrip.busType}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-xl text-emerald-600">
                                    {new Intl.NumberFormat("vi-VN", {
                                        style: "currency",
                                        currency: "VND",
                                    }).format(returnTrip.price)}
                                </div>
                                <div className="text-[11px] text-gray-400">/vé</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-3">
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="font-bold text-lg text-gray-900">
                                    {format(new Date(returnTrip.departureTime), "HH:mm")}
                                </span>
                                <span className="text-[11px] text-gray-500 font-medium">
                                    {returnTrip.fromStation.name}
                                </span>
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <div className="flex-1 border-t-2 border-dashed border-gray-300 relative">
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-50 px-2 text-[11px] text-gray-400 font-medium whitespace-nowrap">
                                        {Math.floor(returnTrip.duration / 60)}h{returnTrip.duration % 60 > 0 ? `${returnTrip.duration % 60}p` : ""}
                                    </span>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                            </div>
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="font-bold text-lg text-gray-900">
                                    {format(new Date(returnTrip.arrivalTime), "HH:mm")}
                                </span>
                                <span className="text-[11px] text-gray-500 font-medium">
                                    {returnTrip.toStation.name}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Spacer if not round-trip */}
                {!isRoundTrip && <div className="mb-3" />}

                {/* Step Content */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    {/* Step 1: Seat Selection */}
                    {currentStep === 1 && (
                        <div>
                            {isRoundTrip ? (
                                <>
                                    {/* Tab switcher */}
                                    <div className="flex gap-2 mb-6">
                                        <button
                                            onClick={() => setBookingTab("outbound")}
                                            className={cn(
                                                "flex-1 py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2",
                                                bookingTab === "outbound"
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                                            )}
                                        >
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            Chuyến đi
                                            {bookingData.selectedSeats.length > 0 && (
                                                <span className="ml-1 text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                                                    {bookingData.selectedSeats.length} ghế
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setBookingTab("return")}
                                            className={cn(
                                                "flex-1 py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2",
                                                bookingTab === "return"
                                                    ? "border-orange-500 bg-orange-50 text-orange-700"
                                                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                                            )}
                                        >
                                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                                            Chuyến về
                                            {bookingData.returnSelectedSeats.length > 0 && (
                                                <span className="ml-1 text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full">
                                                    {bookingData.returnSelectedSeats.length} ghế
                                                </span>
                                            )}
                                        </button>
                                    </div>

                                    {/* Outbound seat map */}
                                    {bookingTab === "outbound" && (
                                        <div>
                                            <div className="mb-5 p-4 bg-gradient-to-r from-emerald-50 to-emerald-50/30 rounded-xl border border-emerald-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                                            <Bus className="h-5 w-5 text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">{trip.fromStation.provinceName || trip.fromStation.name} → {trip.toStation.provinceName || trip.toStation.name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {format(new Date(trip.departureTime), "HH:mm")} · {format(new Date(trip.departureTime), "dd/MM/yyyy")} · {trip.busType}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right hidden sm:block">
                                                        <span className="text-sm font-bold text-emerald-600">
                                                            {new Intl.NumberFormat("vi-VN").format(trip.price)}đ
                                                        </span>
                                                        <p className="text-[10px] text-gray-400">/ghế</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <SeatMap
                                                seats={seats}
                                                selectedSeats={bookingData.selectedSeats}
                                                onSeatClick={handleSeatClick}
                                            />
                                        </div>
                                    )}

                                    {/* Return seat map */}
                                    {bookingTab === "return" && returnTrip && (
                                        <div>
                                            <div className="mb-5 p-4 bg-gradient-to-r from-orange-50 to-orange-50/30 rounded-xl border border-orange-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                                            <Bus className="h-5 w-5 text-orange-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">{returnTrip.fromStation.provinceName || returnTrip.fromStation.name} → {returnTrip.toStation.provinceName || returnTrip.toStation.name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {format(new Date(returnTrip.departureTime), "HH:mm")} · {format(new Date(returnTrip.departureTime), "dd/MM/yyyy")} · {returnTrip.busType}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right hidden sm:block">
                                                        <span className="text-sm font-bold text-orange-600">
                                                            {new Intl.NumberFormat("vi-VN").format(returnTrip.price)}đ
                                                        </span>
                                                        <p className="text-[10px] text-gray-400">/ghế</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <SeatMap
                                                seats={returnSeats}
                                                selectedSeats={bookingData.returnSelectedSeats}
                                                onSeatClick={handleReturnSeatClick}
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <h2 className="font-bold text-gray-800 mb-6 text-center">
                                        Sơ đồ ghế
                                    </h2>
                                    <SeatMap
                                        seats={seats}
                                        selectedSeats={bookingData.selectedSeats}
                                        onSeatClick={handleSeatClick}
                                    />
                                </>
                            )}
                            <div className="mt-8 border-t pt-4">
                                <SeatLegend />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Pickup/Dropoff */}
                    {currentStep === 2 && (
                        <div>
                            {isRoundTrip && returnTrip ? (
                                <>
                                    {/* Tab switcher */}
                                    <div className="flex gap-2 mb-6">
                                        <button
                                            onClick={() => setBookingTab("outbound")}
                                            className={cn(
                                                "flex-1 py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2",
                                                bookingTab === "outbound"
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                                            )}
                                        >
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            Chuyến đi
                                        </button>
                                        <button
                                            onClick={() => setBookingTab("return")}
                                            className={cn(
                                                "flex-1 py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2",
                                                bookingTab === "return"
                                                    ? "border-orange-500 bg-orange-50 text-orange-700"
                                                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                                            )}
                                        >
                                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                                            Chuyến về
                                        </button>
                                    </div>

                                    {bookingTab === "outbound" && (
                                        <StepPickupDropoff
                                            routeId={trip.routeId}
                                            fromStationName={trip.fromStation.name}
                                            toStationName={trip.toStation.name}
                                            departureTime={format(new Date(trip.departureTime), "HH:mm")}
                                            arrivalTime={format(new Date(trip.arrivalTime), "HH:mm")}
                                            pickupPointId={bookingData.pickupPointId}
                                            dropoffPointId={bookingData.dropoffPointId}
                                            onPickupChange={(id) => handlePickupDropoffChange(id, bookingData.dropoffPointId)}
                                            onDropoffChange={(id) => handlePickupDropoffChange(bookingData.pickupPointId, id)}
                                        />
                                    )}

                                    {bookingTab === "return" && (
                                        <StepPickupDropoff
                                            routeId={returnTrip.routeId}
                                            fromStationName={returnTrip.fromStation.name}
                                            toStationName={returnTrip.toStation.name}
                                            departureTime={format(new Date(returnTrip.departureTime), "HH:mm")}
                                            arrivalTime={format(new Date(returnTrip.arrivalTime), "HH:mm")}
                                            pickupPointId={bookingData.returnPickupPointId}
                                            dropoffPointId={bookingData.returnDropoffPointId}
                                            onPickupChange={(id) => handleReturnPickupDropoffChange(id, bookingData.returnDropoffPointId)}
                                            onDropoffChange={(id) => handleReturnPickupDropoffChange(bookingData.returnPickupPointId, id)}
                                        />
                                    )}
                                </>
                            ) : (
                                <StepPickupDropoff
                                    routeId={trip.routeId}
                                    fromStationName={trip.fromStation.name}
                                    toStationName={trip.toStation.name}
                                    departureTime={format(new Date(trip.departureTime), "HH:mm")}
                                    arrivalTime={format(new Date(trip.arrivalTime), "HH:mm")}
                                    pickupPointId={bookingData.pickupPointId}
                                    dropoffPointId={bookingData.dropoffPointId}
                                    onPickupChange={(id) => handlePickupDropoffChange(id, bookingData.dropoffPointId)}
                                    onDropoffChange={(id) => handlePickupDropoffChange(bookingData.pickupPointId, id)}
                                />
                            )}
                        </div>
                    )}

                    {/* Step 3: Passenger Information */}
                    {currentStep === 3 && (
                        <StepPassengerInfo
                            user={user}
                            selectedSeats={bookingData.selectedSeats}
                            returnSelectedSeats={bookingData.returnSelectedSeats}
                            passengers={bookingData.passengers}
                            contactInfo={bookingData.contactInfo}
                            onUpdate={(passengers, contactInfo) => {
                                updatePassengers(passengers);
                                updateContactInfo(contactInfo);
                            }}
                        />
                    )}

                    {/* Step 4: Confirmation & Payment */}
                    {currentStep === 4 && (
                        <StepConfirmation
                            trip={trip}
                            returnTrip={returnTrip}
                            bookingData={bookingData}
                            onPaymentMethodChange={updatePaymentMethod}
                            onSubmit={handleBookingSubmit}
                            isSubmitting={processing}
                        />
                    )}
                </div>
            </main>

            {/* Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 py-3 px-4 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] z-30">
                <div className="container mx-auto max-w-4xl flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            {/* Outbound seats */}
                            <span className="text-xs text-gray-500">{isRoundTrip ? "Đi:" : "Đã chọn"}</span>
                            <div className="flex gap-1">
                                {bookingData.selectedSeats.slice(0, 3).map((seat) => (
                                    <span key={seat} className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                        {seat}
                                    </span>
                                ))}
                                {bookingData.selectedSeats.length > 3 && (
                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                        +{bookingData.selectedSeats.length - 3}
                                    </span>
                                )}
                            </div>
                            {/* Return seats */}
                            {isRoundTrip && bookingData.returnSelectedSeats.length > 0 && (
                                <>
                                    <span className="text-xs text-gray-500">Về:</span>
                                    <div className="flex gap-1">
                                        {bookingData.returnSelectedSeats.slice(0, 3).map((seat) => (
                                            <span key={`r-${seat}`} className="text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                                                {seat}
                                            </span>
                                        ))}
                                        {bookingData.returnSelectedSeats.length > 3 && (
                                            <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                                                +{bookingData.returnSelectedSeats.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="font-bold text-xl text-brand-blue leading-tight">
                            {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                            }).format(totalPrice)}
                        </div>
                    </div>

                    <div className="flex gap-2.5">
                        {currentStep > 1 && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setBookingTab("outbound");
                                    goToPrevStep();
                                    scrollToStepContent();
                                }}
                                className="gap-1.5 rounded-xl h-11 px-5 border-brand-blue text-brand-blue hover:bg-brand-blue/5 font-semibold"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Quay lại
                            </Button>
                        )}

                        <Button
                            disabled={!canProceedFromStep(currentStep, isRoundTrip)}
                            onClick={handleNext}
                            className={cn(
                                "font-bold px-7 rounded-xl h-11 shadow-lg gap-1.5 transition-all",
                                currentStep === 4
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                                    : "bg-brand-blue hover:bg-sky-600 text-white shadow-brand-blue/20"
                            )}
                        >
                            {currentStep < 4 ? (
                                <>
                                    Tiếp tục
                                    <ChevronRight className="h-4 w-4" />
                                </>
                            ) : (
                                processing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    "Xác nhận đặt vé"
                                )
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
