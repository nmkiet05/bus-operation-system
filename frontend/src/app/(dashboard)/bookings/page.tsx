"use client";

import { useEffect, useState } from "react";
import { bookingService } from "@/features/booking/services/booking-service";
import { BookingResponse } from "@/features/booking/types";
import { format } from "date-fns";
import { Loader2, Ticket as TicketIcon, Calendar, Clock, Bus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BookingsPage() {
    const [bookings, setBookings] = useState<BookingResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setError(null);
                const data = await bookingService.getMyBookings();
                setBookings(data);
            } catch (error) {
                console.error("Failed to fetch bookings:", error);
                setError("Không thể tải lịch sử đặt vé của bạn");
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
            <div className="p-6 border-b border-gray-100">
                <h1 className="text-xl font-bold text-gray-900">Lịch sử đặt vé</h1>
                <p className="text-sm text-gray-500 mt-1">Quản lý và xem lại các chuyến đi của bạn</p>
            </div>

            <div className="p-6">
                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {bookings.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TicketIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Bạn chưa có chuyến đi nào</h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                            Hãy đặt vé ngay để trải nghiệm những chuyến đi tuyệt vời cùng BOS.
                        </p>
                        <Button asChild>
                            <Link href="/">Tìm chuyến xe</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bookings.map((booking) => (
                            <Link
                                key={booking.id}
                                href={`/bookings/${booking.code}`}
                                className="block border border-gray-200 rounded-xl p-4 hover:border-brand-blue/50 hover:bg-blue-50/20 transition-colors"
                            >
                                <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-brand-blue">#{booking.code}</span>
                                            <span className="text-gray-300">|</span>
                                            <span className="text-sm text-gray-500">
                                                {format(new Date(booking.createdAt), "dd/MM/yyyy HH:mm")}
                                            </span>
                                        </div>
                                        <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${booking.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" :
                                            booking.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                                                booking.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                                                    "bg-gray-100 text-gray-700"
                                            }`}>
                                            {booking.status === "CONFIRMED" ? "Đã thanh toán" :
                                                booking.status === "PENDING" ? "Chờ thanh toán" :
                                                    booking.status === "CANCELLED" ? "Đã hủy" : booking.status}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5">
                                            <div className="w-2 h-2 rounded-full bg-brand-blue mb-1" />
                                            <div className="w-0.5 h-8 bg-gray-200 ml-[3px]" />
                                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-1" />
                                        </div>
                                        <div className="flex-1">
                                            {booking.tickets && booking.tickets.length > 0 ? (
                                                <>
                                                    <p className="font-medium text-gray-900">{booking.tickets[0].routeName}</p>
                                                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>{booking.tickets[0].departureDate ? format(new Date(booking.tickets[0].departureDate), "dd/MM/yyyy") : "N/A"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{booking.tickets[0].departureTime?.substring(0, 5)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Bus className="h-3 w-3" />
                                                            <span>{booking.tickets[0].busTypeName}</span>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="font-medium text-gray-900">Chi tiết chuyến đi đang cập nhật...</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 text-sm text-gray-600">
                                        <div className="flex items-center gap-1.5">
                                            <TicketIcon className="h-4 w-4 text-gray-400" />
                                            <span>{booking.tickets?.length || 0} vé</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 font-medium text-emerald-600">
                                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(booking.totalAmount)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 md:pl-4 pt-4 md:pt-0 min-w-[170px]">
                                    <div className="text-sm font-semibold text-brand-blue">Xem chi tiết</div>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        Nhấp để mở giao diện chi tiết và thao tác hủy booking hoặc hủy từng vé.
                                    </p>
                                </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
