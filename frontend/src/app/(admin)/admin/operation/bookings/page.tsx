"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    RefreshCw,
    Loader2,
    XCircle,
    ShoppingCart,
    Search,
    Ticket,
    Calendar,
    Clock,
    Bus,
} from "lucide-react";
import { BookingResponse } from "@/features/booking/types";
import { bookingService } from "@/features/booking/services/booking-service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    CONFIRMED: { label: "Đã thanh toán", className: "bg-emerald-100 text-emerald-700" },
    PENDING: { label: "Chờ thanh toán", className: "bg-amber-100 text-amber-700" },
    CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-700" },
    EXPIRED: { label: "Hết hạn", className: "bg-gray-100 text-gray-600" },
};

const STATUS_FILTERS = [
    { value: "ALL", label: "Tất cả" },
    { value: "PENDING", label: "Chờ thanh toán" },
    { value: "CONFIRMED", label: "Đã thanh toán" },
    { value: "CANCELLED", label: "Đã hủy" },
];

export default function AdminBookingsPage() {
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<BookingResponse | null>(null);

    const queryClient = useQueryClient();

    // Fetch all bookings (admin)
    const { data: bookings = [], isLoading, refetch } = useQuery({
        queryKey: ["admin-bookings"],
        queryFn: () => bookingService.getAllBookings(),
    });

    // Filter + search
    const filtered = bookings
        .filter(b => statusFilter === "ALL" || b.status === statusFilter)
        .filter(b => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                b.code?.toLowerCase().includes(q) ||
                b.guestName?.toLowerCase().includes(q) ||
                b.guestPhone?.includes(q)
            );
        });

    // Cancel mutation
    const cancelMutation = useMutation({
        mutationFn: (id: number) => bookingService.cancelBooking(id),
        onSuccess: () => {
            toast.success("Đã hủy booking thành công");
            setCancelDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || "Lỗi hủy booking");
        },
    });

    const handleCancelOpen = (booking: BookingResponse) => {
        setCancelTarget(booking);
        setCancelDialogOpen(true);
    };

    const handleCancelConfirm = () => {
        if (!cancelTarget) return;
        cancelMutation.mutate(cancelTarget.id);
    };

    // Stats
    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === "PENDING").length,
        confirmed: bookings.filter(b => b.status === "CONFIRMED").length,
        totalRevenue: bookings
            .filter(b => b.status === "CONFIRMED")
            .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    };

    return (
        <div className="space-y-6">
            {/* Cancel Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-500" />
                            Hủy đơn đặt vé
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-sm text-gray-600">
                            Bạn có chắc muốn hủy booking <strong>#{cancelTarget?.code}</strong>?
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Khách: {cancelTarget?.guestName} — SĐT: {cancelTarget?.guestPhone}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                            Không
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancelConfirm}
                            disabled={cancelMutation.isPending}
                        >
                            {cancelMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                            Hủy booking
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản Lý Đặt Vé</h1>
                    <p className="text-sm text-gray-500 mt-1">Xem và quản lý tất cả đơn đặt vé</p>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    Làm mới
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Tổng đơn", value: stats.total, color: "text-gray-900" },
                    { label: "Chờ thanh toán", value: stats.pending, color: "text-amber-600" },
                    { label: "Đã thanh toán", value: stats.confirmed, color: "text-emerald-600" },
                    {
                        label: "Doanh thu",
                        value: new Intl.NumberFormat("vi-VN", { notation: "compact" }).format(stats.totalRevenue) + "đ",
                        color: "text-blue-600",
                    },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-lg border border-gray-100 p-3 text-center">
                        <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                        <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {/* Search */}
                    <div className="relative w-full sm:w-[280px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm mã PNR, tên, SĐT..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Status */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_FILTERS.map(sf => (
                                <SelectItem key={sf.value} value={sf.value}>{sf.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center text-sm text-gray-500 sm:ml-auto">
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <span className="font-medium text-gray-900">{filtered.length}</span>
                        )}
                        &nbsp;đơn
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Mã PNR</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Khách hàng</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Chuyến</th>
                                <th className="text-center py-3.5 px-4 font-semibold text-gray-600">Số vé</th>
                                <th className="text-right py-3.5 px-4 font-semibold text-gray-600">Tổng tiền</th>
                                <th className="text-center py-3.5 px-4 font-semibold text-gray-600">Trạng thái</th>
                                <th className="text-center py-3.5 px-4 font-semibold text-gray-600">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-gray-500">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center text-gray-400">
                                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-sm">Không có đơn đặt vé nào</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((booking) => {
                                    const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
                                    const canCancel = booking.status === "PENDING" || booking.status === "CONFIRMED";
                                    const firstTicket = booking.tickets?.[0];

                                    return (
                                        <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                                            {/* Mã PNR */}
                                            <td className="py-3.5 px-4">
                                                <span className="font-bold text-brand-blue">#{booking.code}</span>
                                                <div className="text-xs text-gray-400 mt-0.5">
                                                    {format(new Date(booking.createdAt), "dd/MM/yyyy HH:mm")}
                                                </div>
                                            </td>

                                            {/* Khách hàng */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-medium text-gray-900 text-xs">{booking.guestName}</div>
                                                <div className="text-xs text-gray-400">{booking.guestPhone}</div>
                                            </td>

                                            {/* Chuyến */}
                                            <td className="py-3.5 px-4">
                                                {firstTicket ? (
                                                    <div>
                                                        <div className="font-medium text-gray-900 text-xs">{firstTicket.routeName}</div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                                            <span className="flex items-center gap-0.5">
                                                                <Calendar className="h-3 w-3" />
                                                                {firstTicket.departureDate ? format(new Date(firstTicket.departureDate), "dd/MM") : "—"}
                                                            </span>
                                                            <span className="flex items-center gap-0.5">
                                                                <Clock className="h-3 w-3" />
                                                                {firstTicket.departureTime?.substring(0, 5) || "—"}
                                                            </span>
                                                            <span className="flex items-center gap-0.5">
                                                                <Bus className="h-3 w-3" />
                                                                {firstTicket.busTypeName || "—"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">—</span>
                                                )}
                                            </td>

                                            {/* Số vé */}
                                            <td className="py-3.5 px-4 text-center">
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700">
                                                    <Ticket className="h-3 w-3 text-gray-400" />
                                                    {booking.tickets?.length || 0}
                                                </span>
                                            </td>

                                            {/* Tổng tiền */}
                                            <td className="py-3.5 px-4 text-right">
                                                <span className="font-medium text-emerald-600 text-sm">
                                                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(booking.totalAmount)}
                                                </span>
                                            </td>

                                            {/* Trạng thái */}
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-xs font-bold",
                                                    statusCfg.className
                                                )}>
                                                    {statusCfg.label}
                                                </span>
                                            </td>

                                            {/* Thao tác */}
                                            <td className="py-3.5 px-4 text-center">
                                                {canCancel ? (
                                                    <button
                                                        onClick={() => handleCancelOpen(booking)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                    >
                                                        <XCircle className="h-3 w-3" />
                                                        Hủy
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
