"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { bookingService } from "@/features/booking/services/booking-service";
import { BookingResponse } from "@/features/booking/types";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Download, Mail, Phone, Calendar, MapPin, User, CreditCard, ArrowLeft, Bus, Tag } from "lucide-react";
import { toast } from "sonner";

function BookingSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingCode = searchParams.get("code");

    const [booking, setBooking] = useState<BookingResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadBooking = async () => {
            if (!bookingCode) {
                setError("Không tìm thấy mã đặt vé");
                setLoading(false);
                return;
            }

            try {
                // 1. Kiểm tra sessionStorage cache trước (từ createBooking response)
                const cacheKey = `booking_cache_${bookingCode}`;
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    setBooking(JSON.parse(cached));
                    sessionStorage.removeItem(cacheKey); // Dùng xong → xóa
                    setLoading(false);
                    return;
                }
            } catch {
                // sessionStorage bị disabled hoặc JSON parse lỗi → fallback API
            }

            try {
                // 2. Fallback: Gọi API khi không có cache (user refresh / truy cập trực tiếp)
                const data = await bookingService.getBookingByCode(bookingCode);
                setBooking(data);
            } catch (err) {
                console.error("Failed to load booking:", err);
                setError("Không thể tải thông tin đặt vé");
            } finally {
                setLoading(false);
            }
        };

        loadBooking();
    }, [bookingCode]);

    const handleDownloadTicket = () => {
        toast.info("Tính năng tải vé PDF đang được phát triển");
        // TODO: Implement PDF download
    };

    const handleEmailTicket = () => {
        toast.success("Email xác nhận đã được gửi lại!");
        // TODO: Call resend email API
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 text-gray-500 p-4">
                <p className="text-lg">{error || "Không tìm thấy thông tin đặt vé"}</p>
                <Button variant="outline" onClick={() => router.push("/")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Về trang chủ
                </Button>
            </div>
        );
    }

    const isPaid = booking.status === "CONFIRMED";
    const isPending = booking.status === "PENDING";

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Success Banner */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 pt-20 pb-12">
                <div className="container mx-auto px-4 max-w-3xl text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                        <CheckCircle2 className="h-12 w-12 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        Đặt vé thành công!
                    </h1>
                    <p className="text-emerald-50 text-lg">
                        Mã đặt vé: <span className="font-mono font-bold">{booking.code}</span>
                    </p>
                </div>
            </div>

            <main className="container mx-auto px-4 max-w-3xl -mt-6">
                {/* Status Card */}
                {isPending && (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 mb-6 shadow-sm">
                        <div className="flex items-start gap-3">
                            <CreditCard className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-bold text-amber-900 mb-1">Chờ thanh toán</h3>
                                <p className="text-sm text-amber-700 leading-relaxed">
                                    Vui lòng thanh toán tại quầy hoặc qua các phương thức thanh toán được hướng dẫn bên dưới để hoàn tất đặt vé.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {isPaid && (
                    <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-5 mb-6 shadow-sm">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-bold text-emerald-900 mb-1">Đã thanh toán</h3>
                                <p className="text-sm text-emerald-700">
                                    Vé của bạn đã được xác nhận và thanh toán thành công!
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Contact Info Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-brand-blue" />
                        Thông tin liên hệ
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Tên:</span>
                            <span className="font-semibold text-gray-900">{booking.guestName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">SĐT:</span>
                            <span className="font-semibold text-gray-900">{booking.guestPhone}</span>
                        </div>
                        {booking.guestEmail && (
                            <div className="flex items-center gap-2 md:col-span-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">Email:</span>
                                <span className="font-semibold text-gray-900">{booking.guestEmail}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tickets */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-brand-blue" />
                        Thông tin vé ({booking.tickets.length} vé)
                    </h2>
                    <div className="space-y-4">
                        {booking.tickets.map((ticket) => {
                            const formattedDate = ticket.departureDate
                                ? new Date(ticket.departureDate + "T00:00:00").toLocaleDateString("vi-VN", {
                                    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric"
                                })
                                : null;
                            const formattedTime = ticket.departureTime
                                ? ticket.departureTime.substring(0, 5)
                                : null;

                            return (
                                <div key={ticket.id} className="border border-gray-200 rounded-xl overflow-hidden hover:border-brand-blue/30 transition-colors">
                                    {/* Header: Tên tuyến + Ghế */}
                                    <div className="bg-gradient-to-r from-brand-blue to-sky-500 px-4 py-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-white/70">{booking.code}-{ticket.seatNumber}</p>
                                            <h3 className="font-bold text-white text-base">
                                                {ticket.routeName || "Chuyến xe"}
                                            </h3>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
                                            <p className="text-xs text-white/70 text-center">Ghế</p>
                                            <p className="font-mono font-bold text-white text-lg leading-tight text-center">
                                                {ticket.seatNumber}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Body: Chi tiết chuyến */}
                                    <div className="p-4 space-y-3">
                                        {/* Bến đi → Bến đến */}
                                        {(ticket.departureStationName || ticket.arrivalStationName) && (
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 text-center">
                                                    <p className="text-xs text-gray-500 mb-0.5">Bến đi</p>
                                                    <p className="font-semibold text-gray-900 text-sm">
                                                        {ticket.departureStationName || "—"}
                                                    </p>
                                                </div>
                                                <div className="flex items-center text-brand-blue">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    <div className="w-12 h-0.5 bg-gradient-to-r from-emerald-400 to-red-400" />
                                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                                </div>
                                                <div className="flex-1 text-center">
                                                    <p className="text-xs text-gray-500 mb-0.5">Bến đến</p>
                                                    <p className="font-semibold text-gray-900 text-sm">
                                                        {ticket.arrivalStationName || "—"}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Ngày & Giờ khởi hành */}
                                        {(formattedDate || formattedTime) && (
                                            <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-3">
                                                {formattedDate && (
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <Calendar className="h-4 w-4 text-brand-blue flex-shrink-0" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">Ngày khởi hành</p>
                                                            <p className="font-semibold text-gray-900 text-sm">{formattedDate}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {formattedTime && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-500">Giờ đi</p>
                                                            <p className="font-bold text-brand-blue text-lg">{formattedTime}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Thông tin xe */}
                                        {(ticket.busLicensePlate || ticket.busTypeName) && (
                                            <div className="grid grid-cols-2 gap-3 bg-blue-50/60 rounded-lg p-3">
                                                {ticket.busLicensePlate && (
                                                    <div className="flex items-center gap-2">
                                                        <Bus className="h-4 w-4 text-brand-blue flex-shrink-0" />
                                                        <div>
                                                            <p className="text-[11px] text-gray-400">Biển số xe</p>
                                                            <p className="font-bold text-gray-900 text-sm">{ticket.busLicensePlate}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {ticket.busTypeName && (
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="h-4 w-4 text-brand-blue flex-shrink-0" />
                                                        <div>
                                                            <p className="text-[11px] text-gray-400">Loại xe</p>
                                                            <p className="font-semibold text-gray-700 text-sm">{ticket.busTypeName}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Điểm đón/trả */}
                                        {(ticket.pickupPointName || ticket.dropoffPointName) && (
                                            <div className="space-y-1.5 text-sm">
                                                {ticket.pickupPointName && (
                                                    <div className="flex items-start gap-2 text-gray-600">
                                                        <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                        <span><span className="text-gray-500">Đón:</span> {ticket.pickupPointName}</span>
                                                    </div>
                                                )}
                                                {ticket.dropoffPointName && (
                                                    <div className="flex items-start gap-2 text-gray-600">
                                                        <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                                        <span><span className="text-gray-500">Trả:</span> {ticket.dropoffPointName}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Giá vé & Trạng thái & Hành khách */}
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                            <div>
                                                <p className="text-xs text-gray-500">Hành khách</p>
                                                <p className="font-semibold text-gray-900 text-sm truncate max-w-[120px]" title={ticket.passengerName || booking.guestName}>
                                                    {ticket.passengerName || booking.guestName}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">Giá vé</p>
                                                <p className="font-bold text-lg text-emerald-600">
                                                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(ticket.price))}
                                                </p>
                                            </div>
                                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${ticket.status === "CONFIRMED"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-amber-100 text-amber-700"
                                                }`}>
                                                {ticket.status === "CONFIRMED" ? "Đã xác nhận" : "Chờ xử lý"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Payment Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-brand-blue" />
                        Thanh toán
                    </h2>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-600">Phương thức</span>
                        <span className="font-semibold text-gray-900">
                            {booking.paymentMethod === "COUNTER" ? "Thanh toán tại quầy" : booking.paymentMethod}
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-600">Tổng tiền</span>
                        <span className="font-bold text-xl text-emerald-600">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(booking.totalAmount)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <span className="text-gray-600">Trạng thái</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            }`}>
                            {isPaid ? "Đã thanh toán" : "Chờ thanh toán"}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    <Button onClick={handleDownloadTicket} className="h-12 gap-2 bg-brand-blue hover:bg-sky-600">
                        <Download className="h-4 w-4" />
                        Tải vé PDF
                    </Button>
                    <Button onClick={handleEmailTicket} variant="outline" className="h-12 gap-2 border-brand-blue text-brand-blue hover:bg-brand-blue/5">
                        <Mail className="h-4 w-4" />
                        Gửi lại email
                    </Button>
                </div>

                <div className="text-center space-y-2 mt-6">
                    <Button variant="ghost" onClick={() => router.push("/")} className="gap-2 text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="h-4 w-4" />
                        Về trang chủ
                    </Button>
                </div>
            </main>
        </div>
    );
}

export default function BookingSuccessPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
            </div>
        }>
            <BookingSuccessContent />
        </Suspense>
    );
}
