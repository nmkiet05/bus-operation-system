"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { bookingService } from "@/features/booking/services/booking-service";
import { BookingResponse } from "@/features/booking/types";
import { BookingDetailView } from "@/features/booking/components/BookingDetailView";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function DashboardBookingDetailPage() {
    const params = useParams<{ code: string }>();
    const bookingCode = typeof params?.code === "string" ? params.code : "";

    const [booking, setBooking] = useState<BookingResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadBooking = async () => {
            if (!bookingCode) {
                setError("Không tìm thấy mã booking");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const data = await bookingService.getMyBookingByCode(bookingCode);
                setBooking(data);
            } catch (err) {
                console.error("Failed to load my booking:", err);
                setError("Không thể tải chi tiết booking của bạn");
            } finally {
                setLoading(false);
            }
        };

        loadBooking();
    }, [bookingCode]);

    const refreshBooking = async () => {
        const updated = await bookingService.getMyBookingByCode(bookingCode);
        setBooking(updated);
    };

    const handleCancelBooking = async () => {
        await bookingService.cancelMyBooking(bookingCode);
        toast.success("Đã hủy đơn đặt vé thành công!");
        await refreshBooking();
    };

    const handleCancelTicket = async (ticketId: number) => {
        await bookingService.cancelMyTicket(bookingCode, ticketId);
        toast.success("Đã hủy vé thành công!");
        await refreshBooking();
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[320px] flex flex-col items-center justify-center text-center px-6">
                <p className="text-lg font-medium text-gray-900 mb-2">{error || "Không tìm thấy booking"}</p>
                <p className="text-sm text-gray-500 mb-6">Vui lòng kiểm tra lại hoặc quay về danh sách vé của bạn.</p>
                <Button variant="outline" asChild>
                    <Link href="/bookings">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại danh sách
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-transparent">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Chi tiết booking</h1>
                <p className="text-sm text-gray-500 mt-1">Xem lại vé đã đặt và thao tác tương tự như tra cứu booking</p>
            </div>

            <BookingDetailView
                booking={booking}
                onCancelBooking={handleCancelBooking}
                onCancelTicket={handleCancelTicket}
                backHref="/bookings"
                backLabel="Quay lại danh sách"
            />
        </div>
    );
}
