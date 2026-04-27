"use client";

import Link from "next/link";
import { useState } from "react";
import { BookingResponse } from "@/features/booking/types";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
    User,
    Phone,
    Calendar,
    Clock,
    MapPin,
    CreditCard,
    Bus,
    Tag,
    XCircle,
    ArrowLeft,
    Ticket,
    Loader2,
    AlertCircle,
} from "lucide-react";

interface BookingDetailViewProps {
    booking: BookingResponse;
    onCancelBooking?: () => void | Promise<void>;
    onCancelTicket?: (ticketId: number) => void | Promise<void>;
    backHref?: string;
    backLabel?: string;
}

export function BookingDetailView({
    booking,
    onCancelBooking,
    onCancelTicket,
    backHref = "/",
    backLabel = "Về trang chủ",
}: BookingDetailViewProps) {
    const [cancelling, setCancelling] = useState(false);
    const [cancellingTicketId, setCancellingTicketId] = useState<number | null>(null);
    const [cancelBookingConfirmOpen, setCancelBookingConfirmOpen] = useState(false);
    const [cancelTicketConfirmOpen, setCancelTicketConfirmOpen] = useState(false);
    const [cancelTicketTargetId, setCancelTicketTargetId] = useState<number | null>(null);

    const isPending = booking.status === "PENDING";
    const isConfirmed = booking.status === "CONFIRMED";
    const isCancelled = booking.status === "CANCELLED";

    const canCancelBooking = !!onCancelBooking && (isPending || isConfirmed);

    const handleCancelBooking = async () => {
        if (!onCancelBooking) return;
        setCancelling(true);
        try {
            await onCancelBooking();
        } finally {
            setCancelling(false);
        }
    };

    const handleCancelTicket = async (ticketId: number) => {
        if (!onCancelTicket) return;
        setCancellingTicketId(ticketId);
        try {
            await onCancelTicket(ticketId);
            setCancelTicketTargetId(null);
        } finally {
            setCancellingTicketId(null);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <div className={`rounded-xl border-2 p-5 shadow-sm ${
                isConfirmed ? "bg-emerald-50 border-emerald-200" :
                    isPending ? "bg-amber-50 border-amber-200" :
                        isCancelled ? "bg-red-50 border-red-200" :
                            "bg-gray-50 border-gray-200"
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isConfirmed ? "bg-emerald-100" :
                            isPending ? "bg-amber-100" :
                                isCancelled ? "bg-red-100" :
                                    "bg-gray-100"
                        }`}>
                        {isConfirmed && <CreditCard className="h-5 w-5 text-emerald-600" />}
                        {isPending && <Clock className="h-5 w-5 text-amber-600" />}
                        {isCancelled && <XCircle className="h-5 w-5 text-red-600" />}
                    </div>
                    <div>
                        <h3 className={`font-bold ${
                            isConfirmed ? "text-emerald-900" :
                                isPending ? "text-amber-900" :
                                    isCancelled ? "text-red-900" :
                                        "text-gray-900"
                            }`}>
                            {isConfirmed ? "Đã thanh toán" :
                                isPending ? "Chờ thanh toán" :
                                    isCancelled ? "Đã hủy" : booking.status}
                        </h3>
                        <p className="text-sm text-gray-600">
                            Mã PNR: <span className="font-mono font-bold">{booking.code}</span>
                        </p>
                    </div>
                </div>
            </div>

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
                    {booking.guestEmail && (
                        <div className="flex items-center gap-2 sm:col-span-2">
                            <AlertCircle className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-500">Email:</span>
                            <span className="font-semibold text-gray-900">{booking.guestEmail}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-brand-blue" />
                    Thông tin vé ({booking.tickets?.length || 0} vé)
                </h2>
                <div className="space-y-4">
                    {booking.tickets?.map((ticket) => {
                        const formattedDate = ticket.departureDate
                            ? new Date(`${ticket.departureDate}T00:00:00`).toLocaleDateString("vi-VN", {
                                weekday: "long",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                            })
                            : null;
                        const formattedTime = ticket.departureTime?.substring(0, 5);
                        const canCancelTicket =
                            !!onCancelTicket &&
                            ticket.status !== "CANCELLED" &&
                            ticket.status !== "EXPIRED" &&
                            (isPending || isConfirmed);

                        return (
                            <div key={ticket.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gradient-to-r from-brand-blue to-sky-500 px-4 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-white/70">{booking.code}-{ticket.seatNumber}</p>
                                        <h3 className="font-bold text-white text-base">{ticket.routeName || "Chuyến xe"}</h3>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
                                        <p className="text-xs text-white/70 text-center">Ghế</p>
                                        <p className="font-mono font-bold text-white text-lg leading-tight text-center">{ticket.seatNumber}</p>
                                    </div>
                                </div>

                                <div className="p-4 space-y-3">
                                    {(ticket.departureStationName || ticket.arrivalStationName) && (
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 text-center">
                                                <p className="text-xs text-gray-500 mb-0.5">Bến đi</p>
                                                <p className="font-semibold text-gray-900 text-sm">{ticket.departureStationName || "—"}</p>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <div className="w-12 h-0.5 bg-gradient-to-r from-emerald-400 to-red-400" />
                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                            </div>
                                            <div className="flex-1 text-center">
                                                <p className="text-xs text-gray-500 mb-0.5">Bến đến</p>
                                                <p className="font-semibold text-gray-900 text-sm">{ticket.arrivalStationName || "—"}</p>
                                            </div>
                                        </div>
                                    )}

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

                                    {(ticket.passengerName || ticket.passengerPhone) && (
                                        <div className="grid grid-cols-2 gap-3 bg-gray-50/80 rounded-lg p-3">
                                            {ticket.passengerName && (
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-brand-blue flex-shrink-0" />
                                                    <div>
                                                        <p className="text-[11px] text-gray-400">Người đi</p>
                                                        <p className="font-semibold text-gray-700 text-sm line-clamp-1" title={ticket.passengerName}>{ticket.passengerName}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {ticket.passengerPhone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-brand-blue flex-shrink-0" />
                                                    <div>
                                                        <p className="text-[11px] text-gray-400">Điện thoại</p>
                                                        <p className="font-semibold text-gray-700 text-sm">{ticket.passengerPhone}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                        <div>
                                            <p className="text-xs text-gray-500">Giá vé</p>
                                            <p className="font-bold text-lg text-emerald-600">
                                                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(ticket.price))}
                                            </p>
                                        </div>
                                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                                            ticket.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" :
                                                ticket.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                                                    "bg-amber-100 text-amber-700"
                                            }`}>
                                            {ticket.status === "CONFIRMED" ? "Còn hiệu lực" :
                                                ticket.status === "CANCELLED" ? "Đã hủy" : String(ticket.status)}
                                        </span>
                                    </div>

                                    {canCancelTicket && (
                                        <div className="pt-2 border-t border-gray-100">
                                            <Button
                                                onClick={() => {
                                                    setCancelTicketTargetId(ticket.id);
                                                    setCancelTicketConfirmOpen(true);
                                                }}
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
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isConfirmed ? "bg-emerald-100 text-emerald-700" :
                            isPending ? "bg-amber-100 text-amber-700" :
                                "bg-red-100 text-red-700"
                        }`}>
                        {isConfirmed ? "Đã thanh toán" : isPending ? "Chờ thanh toán" : isCancelled ? "Đã hủy" : booking.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {canCancelBooking && (
                    <Button
                        onClick={() => setCancelBookingConfirmOpen(true)}
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

                <Link href={backHref}>
                    <Button variant="outline" className="h-12 w-full gap-2 border-brand-blue text-brand-blue hover:bg-brand-blue/5">
                        <ArrowLeft className="h-4 w-4" />
                        {backLabel}
                    </Button>
                </Link>
            </div>

            <ConfirmDialog
                open={cancelBookingConfirmOpen}
                onOpenChange={setCancelBookingConfirmOpen}
                title="Xác nhận hủy đơn"
                description="Bạn có chắc muốn hủy đơn đặt vé này? Thao tác này không thể hoàn tác."
                confirmLabel="Hủy đơn"
                variant="danger"
                isLoading={cancelling}
                onConfirm={handleCancelBooking}
            />

            <ConfirmDialog
                open={cancelTicketConfirmOpen}
                onOpenChange={setCancelTicketConfirmOpen}
                title="Xác nhận hủy vé"
                description="Bạn có chắc muốn hủy vé này?"
                confirmLabel="Hủy vé"
                variant="danger"
                isLoading={cancellingTicketId !== null}
                onConfirm={() => {
                    if (cancelTicketTargetId == null) return;
                    return handleCancelTicket(cancelTicketTargetId);
                }}
            />
        </div>
    );
}
