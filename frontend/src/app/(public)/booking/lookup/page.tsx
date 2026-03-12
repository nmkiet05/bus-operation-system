"use client";

import { useState } from "react";
import { bookingService } from "@/features/booking/services/booking-service";
import { BookingResponse } from "@/features/booking/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    Loader2,
    Ticket,
    User,
    Phone,
    Calendar,
    Clock,
    MapPin,
    CreditCard,
    Bus,
    Tag,
    XCircle,
    AlertCircle,
    ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function BookingLookupPage() {
    const [code, setCode] = useState("");
    const [phone, setPhone] = useState("");
    const [booking, setBooking] = useState<BookingResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancellingTicketId, setCancellingTicketId] = useState<number | null>(null);

    const handleSearch = async () => {
        if (!code.trim() || !phone.trim()) {
            toast.error("Vui lòng nhập mã đặt vé và số điện thoại");
            return;
        }

        setLoading(true);
        setSearched(true);
        setBooking(null);
        try {
            const result = await bookingService.searchBooking(code.trim(), phone.trim());
            setBooking(result);
        } catch {
            toast.error("Không tìm thấy đơn đặt vé. Vui lòng kiểm tra lại mã PNR và SĐT.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!booking) return;
        if (!confirm("Bạn có chắc muốn hủy đơn đặt vé này? Thao tác này không thể hoàn tác.")) return;

        setCancelling(true);
        try {
            await bookingService.cancelBooking(booking.id);
            toast.success("Đã hủy đơn đặt vé thành công!");
            // Reload booking
            const updated = await bookingService.searchBooking(code.trim(), phone.trim());
            setBooking(updated);
        } catch (err) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error?.response?.data?.message || "Không thể hủy đơn đặt vé");
        } finally {
            setCancelling(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
    };

    const handleCancelTicket = async (ticketId: number) => {
        if (!confirm("Bạn có chắc muốn hủy vé này?")) return;
        setCancellingTicketId(ticketId);
        try {
            await bookingService.cancelTicket(ticketId);
            toast.success("Đã hủy vé thành công!");
            const updated = await bookingService.searchBooking(code.trim(), phone.trim());
            setBooking(updated);
        } catch (err) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error?.response?.data?.message || "Không thể hủy vé");
        } finally {
            setCancellingTicketId(null);
        }
    };

    const isPending = booking?.status === "PENDING";
    const isConfirmed = booking?.status === "CONFIRMED";
    const isCancelled = booking?.status === "CANCELLED";

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero */}
            <div className="bg-gradient-to-br from-brand-blue to-sky-600 pt-20 pb-16">
                <div className="container mx-auto px-4 max-w-2xl text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                        <Search className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        Tra Cứu Vé Xe
                    </h1>
                    <p className="text-sky-100 text-lg">
                        Nhập mã đặt vé (PNR) và số điện thoại để xem thông tin
                    </p>
                </div>
            </div>

            <main className="container mx-auto px-4 max-w-2xl -mt-8">
                {/* Search Form */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Mã đặt vé (PNR)
                            </label>
                            <div className="relative">
                                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="VD: BK-20260305-001"
                                    value={code}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="pl-9 h-11"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Số điện thoại
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="VD: 0901234567"
                                    value={phone}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="pl-9 h-11"
                                />
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={handleSearch}
                        disabled={loading || !code.trim() || !phone.trim()}
                        className="w-full h-11 bg-brand-blue hover:bg-sky-600 text-white font-semibold gap-2"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4" />
                        )}
                        Tra cứu
                    </Button>
                </div>

                {/* No result */}
                {searched && !loading && !booking && (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500 font-medium">Không tìm thấy đơn đặt vé</p>
                        <p className="text-sm text-gray-400 mt-1">Vui lòng kiểm tra lại mã PNR và số điện thoại</p>
                    </div>
                )}

                {/* Result */}
                {booking && (
                    <div className="space-y-6 pb-12">
                        {/* Status Banner */}
                        <div className={`rounded-xl border-2 p-5 shadow-sm ${isConfirmed ? "bg-emerald-50 border-emerald-200" :
                            isPending ? "bg-amber-50 border-amber-200" :
                                isCancelled ? "bg-red-50 border-red-200" :
                                    "bg-gray-50 border-gray-200"
                            }`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isConfirmed ? "bg-emerald-100" :
                                    isPending ? "bg-amber-100" :
                                        isCancelled ? "bg-red-100" :
                                            "bg-gray-100"
                                    }`}>
                                    {isConfirmed && <CreditCard className="h-5 w-5 text-emerald-600" />}
                                    {isPending && <Clock className="h-5 w-5 text-amber-600" />}
                                    {isCancelled && <XCircle className="h-5 w-5 text-red-600" />}
                                </div>
                                <div>
                                    <h3 className={`font-bold ${isConfirmed ? "text-emerald-900" :
                                        isPending ? "text-amber-900" :
                                            isCancelled ? "text-red-900" :
                                                "text-gray-900"
                                        }`}>
                                        {isConfirmed ? "Đã thanh toán" :
                                            isPending ? "Chờ thanh toán" :
                                                isCancelled ? "Đã hủy" :
                                                    booking.status}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Mã PNR: <span className="font-mono font-bold">{booking.code}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="h-5 w-5 text-brand-blue" />
                                Thông tin hành khách
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-500">Tên:</span>
                                    <span className="font-semibold text-gray-900">{booking.guestName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-500">SĐT:</span>
                                    <span className="font-semibold text-gray-900">{booking.guestPhone}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tickets */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Ticket className="h-5 w-5 text-brand-blue" />
                                Thông tin vé ({booking.tickets?.length || 0} vé)
                            </h2>
                            <div className="space-y-4">
                                {booking.tickets?.map((ticket) => {
                                    const formattedDate = ticket.departureDate
                                        ? new Date(ticket.departureDate + "T00:00:00").toLocaleDateString("vi-VN", {
                                            weekday: "long", day: "2-digit", month: "2-digit", year: "numeric"
                                        })
                                        : null;
                                    const formattedTime = ticket.departureTime?.substring(0, 5);

                                    return (
                                        <div key={ticket.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                            {/* Header */}
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

                                            {/* Body */}
                                            <div className="p-4 space-y-3">
                                                {/* Bến */}
                                                {(ticket.departureStationName || ticket.arrivalStationName) && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 text-center">
                                                            <p className="text-xs text-gray-500 mb-0.5">Bến đi</p>
                                                            <p className="font-semibold text-gray-900 text-sm">
                                                                {ticket.departureStationName || "—"}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center">
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

                                                {/* Ngày & Giờ */}
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
                                                            <div className="text-right">
                                                                <p className="text-xs text-gray-500">Giờ đi</p>
                                                                <p className="font-bold text-brand-blue text-lg">{formattedTime}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Xe */}
                                                {(ticket.busLicensePlate || ticket.busTypeName) && (
                                                    <div className="grid grid-cols-2 gap-3 bg-blue-50/60 rounded-lg p-3">
                                                        {ticket.busLicensePlate && (
                                                            <div className="flex items-center gap-2">
                                                                <Bus className="h-4 w-4 text-brand-blue flex-shrink-0" />
                                                                <div>
                                                                    <p className="text-[11px] text-gray-400">Biển số</p>
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

                                                {/* Giá vé */}
                                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Giá vé</p>
                                                        <p className="font-bold text-lg text-emerald-600">
                                                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(ticket.price))}
                                                        </p>
                                                    </div>
                                                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${ticket.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" :
                                                        ticket.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                                                            "bg-amber-100 text-amber-700"
                                                        }`}>
                                                        {ticket.status === "CONFIRMED" ? "Còn hiệu lực" :
                                                            ticket.status === "CANCELLED" ? "Đã hủy" : String(ticket.status)}
                                                    </span>
                                                </div>

                                                {/* Nút hủy vé đơn lẻ */}
                                                {ticket.status !== "CANCELLED" && ticket.status !== "EXPIRED" && (isPending || isConfirmed) && (
                                                    <div className="pt-2 border-t border-gray-100">
                                                        <Button
                                                            onClick={() => handleCancelTicket(ticket.id)}
                                                            disabled={cancellingTicketId === ticket.id}
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                                                        >
                                                            {cancellingTicketId === ticket.id ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <XCircle className="h-3 w-3" />
                                                            )}
                                                            Hủy vé này
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-brand-blue" />
                                Thanh toán
                            </h2>
                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <span className="text-gray-600">Tổng tiền</span>
                                <span className="font-bold text-xl text-emerald-600">
                                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(booking.totalAmount)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <span className="text-gray-600">Trạng thái</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${isConfirmed ? "bg-emerald-100 text-emerald-700" :
                                    isPending ? "bg-amber-100 text-amber-700" :
                                        "bg-red-100 text-red-700"
                                    }`}>
                                    {isConfirmed ? "Đã thanh toán" :
                                        isPending ? "Chờ thanh toán" :
                                            isCancelled ? "Đã hủy" : booking.status}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(isPending || isConfirmed) && (
                                <Button
                                    onClick={handleCancel}
                                    disabled={cancelling}
                                    variant="destructive"
                                    className="h-12 gap-2"
                                >
                                    {cancelling ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <XCircle className="h-4 w-4" />
                                    )}
                                    Hủy đơn đặt vé
                                </Button>
                            )}
                            <Link href="/">
                                <Button variant="outline" className="h-12 w-full gap-2 border-brand-blue text-brand-blue hover:bg-brand-blue/5">
                                    <ArrowLeft className="h-4 w-4" />
                                    Về trang chủ
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
