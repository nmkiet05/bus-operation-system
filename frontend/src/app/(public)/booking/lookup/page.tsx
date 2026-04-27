"use client";

import { useState } from "react";
import { bookingService } from "@/features/booking/services/booking-service";
import { BookingResponse } from "@/features/booking/types";
import { BookingDetailView } from "@/features/booking/components/BookingDetailView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    Loader2,
    Ticket,
    Phone,
    AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function BookingLookupPage() {
    const [code, setCode] = useState("");
    const [phone, setPhone] = useState("");
    const [booking, setBooking] = useState<BookingResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

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

        try {
            await bookingService.cancelBookingPublic(code.trim(), phone.trim());
            toast.success("Đã hủy đơn đặt vé thành công!");
            // Reload booking
            const updated = await bookingService.searchBooking(code.trim(), phone.trim());
            setBooking(updated);
        } catch (err) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error?.response?.data?.message || "Không thể hủy đơn đặt vé");
            throw err; // Re-throw để ConfirmDialog giữ mở khi lỗi
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
    };

    const handleCancelTicket = async (ticketId: number) => {
        try {
            await bookingService.cancelTicketPublic(code.trim(), phone.trim(), ticketId);
            toast.success("Đã hủy vé thành công!");
            const updated = await bookingService.searchBooking(code.trim(), phone.trim());
            setBooking(updated);
        } catch (err) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error?.response?.data?.message || "Không thể hủy vé");
            throw err; // Re-throw để ConfirmDialog giữ mở khi lỗi
        }
    };

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
                    <BookingDetailView
                        booking={booking}
                        onCancelBooking={handleCancel}
                        onCancelTicket={handleCancelTicket}
                        backHref="/"
                        backLabel="Về trang chủ"
                    />
                )}
            </main>
        </div>
    );
}
