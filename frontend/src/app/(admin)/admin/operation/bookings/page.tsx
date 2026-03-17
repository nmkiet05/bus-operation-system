"use client";

import { useState, Fragment } from "react";
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
    ChevronDown,
    ChevronUp,
    MapPin,
    User,
    Phone,
    CreditCard,
} from "lucide-react";
import { BookingResponse, TicketResponse } from "@/features/booking/types";
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

const TICKET_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Chờ TT", className: "bg-amber-50 text-amber-600 border-amber-200" },
    CONFIRMED: { label: "Đã TT", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    CHECKED_IN: { label: "Đã lên xe", className: "bg-blue-50 text-blue-600 border-blue-200" },
    CANCELLED: { label: "Đã hủy", className: "bg-red-50 text-red-500 border-red-200" },
    EXPIRED: { label: "Hết hạn", className: "bg-gray-50 text-gray-500 border-gray-200" },
    NO_SHOW: { label: "Vắng mặt", className: "bg-orange-50 text-orange-600 border-orange-200" },
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
    const [expandedBookingId, setExpandedBookingId] = useState<number | null>(null);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<BookingResponse | null>(null);
    const [cancelTicketDialogOpen, setCancelTicketDialogOpen] = useState(false);
    const [cancelTicketTarget, setCancelTicketTarget] = useState<{ ticket: TicketResponse; bookingCode: string } | null>(null);

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

    // Cancel booking mutation
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

    // Cancel single ticket mutation
    const cancelTicketMutation = useMutation({
        mutationFn: (ticketId: number) => bookingService.cancelTicket(ticketId),
        onSuccess: () => {
            toast.success("Đã hủy vé thành công");
            setCancelTicketDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || "Lỗi hủy vé");
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

    const handleCancelTicketOpen = (ticket: TicketResponse, bookingCode: string) => {
        setCancelTicketTarget({ ticket, bookingCode });
        setCancelTicketDialogOpen(true);
    };

    const handleCancelTicketConfirm = () => {
        if (!cancelTicketTarget) return;
        cancelTicketMutation.mutate(cancelTicketTarget.ticket.id);
    };

    const toggleExpand = (bookingId: number) => {
        setExpandedBookingId(prev => prev === bookingId ? null : bookingId);
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
            {/* Cancel Booking Dialog */}
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
                            Bạn có chắc muốn hủy <strong>toàn bộ</strong> booking <strong>#{cancelTarget?.code}</strong>?
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Khách: {cancelTarget?.guestName} — SĐT: {cancelTarget?.guestPhone}
                        </p>
                        <p className="text-xs text-red-500 mt-2">
                            ⚠ Tất cả {cancelTarget?.tickets?.length || 0} vé sẽ bị hủy và ghế được giải phóng.
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
                            Hủy toàn bộ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Ticket Dialog */}
            <Dialog open={cancelTicketDialogOpen} onOpenChange={setCancelTicketDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Ticket className="h-5 w-5 text-red-500" />
                            Hủy vé đơn lẻ
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-sm text-gray-600">
                            Hủy vé ghế <strong>{cancelTicketTarget?.ticket.seatNumber}</strong> trong booking <strong>#{cancelTicketTarget?.bookingCode}</strong>?
                        </p>
                        {cancelTicketTarget?.ticket.passengerName && (
                            <p className="text-xs text-gray-400 mt-1">
                                Hành khách: {cancelTicketTarget.ticket.passengerName}
                            </p>
                        )}
                        <p className="text-xs text-amber-600 mt-2">
                            💡 Ghế sẽ được giải phóng. Nếu tất cả vé bị hủy, booking sẽ tự động hủy.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelTicketDialogOpen(false)}>
                            Không
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancelTicketConfirm}
                            disabled={cancelTicketMutation.isPending}
                        >
                            {cancelTicketMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                            Hủy vé này
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
                    <div className="relative w-full sm:w-[280px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm mã PNR, tên, SĐT..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
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
                                <th className="w-8 py-3.5 px-2"></th>
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
                                    <td colSpan={8} className="py-8 text-center text-gray-500">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-gray-400">
                                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-sm">Không có đơn đặt vé nào</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((booking) => {
                                    const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
                                    const canCancel = booking.status === "PENDING" || booking.status === "CONFIRMED";
                                    const firstTicket = booking.tickets?.[0];
                                    const isExpanded = expandedBookingId === booking.id;

                                    return (
                                        <Fragment key={booking.id}>
                                            {/* Main Row */}
                                            <tr
                                                className={cn(
                                                    "hover:bg-gray-50/50 transition-colors cursor-pointer",
                                                    isExpanded && "bg-blue-50/30"
                                                )}
                                                onClick={() => toggleExpand(booking.id)}
                                            >
                                                {/* Expand Arrow */}
                                                <td className="py-3.5 px-2 text-center">
                                                    <button className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors">
                                                        {isExpanded ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </td>

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
                                                <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
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

                                            {/* Expanded Ticket Details */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={8} className="p-0">
                                                        <div className="bg-gradient-to-b from-blue-50/50 to-white border-t border-blue-100/50 px-6 py-4">
                                                            {/* Booking Info Bar */}
                                                            <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-gray-500">
                                                                <span className="flex items-center gap-1">
                                                                    <CreditCard className="h-3.5 w-3.5" />
                                                                    Thanh toán: <strong className="text-gray-700">{booking.paymentMethod || "—"}</strong>
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3.5 w-3.5" />
                                                                    Hết hạn: <strong className="text-gray-700">{booking.expiredAt ? format(new Date(booking.expiredAt), "dd/MM/yyyy HH:mm") : "—"}</strong>
                                                                </span>
                                                                {booking.guestEmail && (
                                                                    <span className="flex items-center gap-1">
                                                                        ✉ {booking.guestEmail}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Tickets Table */}
                                                            <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                                                                <table className="w-full text-xs">
                                                                    <thead>
                                                                        <tr className="bg-gray-50 text-gray-500">
                                                                            <th className="text-left py-2.5 px-3 font-medium">Ghế</th>
                                                                            <th className="text-left py-2.5 px-3 font-medium">Hành khách</th>
                                                                            <th className="text-left py-2.5 px-3 font-medium">Chuyến</th>
                                                                            <th className="text-left py-2.5 px-3 font-medium">Điểm đón / trả</th>
                                                                            <th className="text-right py-2.5 px-3 font-medium">Giá vé</th>
                                                                            <th className="text-center py-2.5 px-3 font-medium">Trạng thái</th>
                                                                            <th className="text-center py-2.5 px-3 font-medium">Thao tác</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-100">
                                                                        {booking.tickets?.map((ticket) => {
                                                                            const tCfg = TICKET_STATUS_CONFIG[ticket.status] || TICKET_STATUS_CONFIG.PENDING;
                                                                            const canCancelTicket =
                                                                                ticket.status !== "CANCELLED" &&
                                                                                ticket.status !== "EXPIRED" &&
                                                                                (booking.status === "PENDING" || booking.status === "CONFIRMED");

                                                                            return (
                                                                                <tr key={ticket.id} className={cn(
                                                                                    "hover:bg-gray-50/50",
                                                                                    ticket.status === "CANCELLED" && "opacity-50"
                                                                                )}>
                                                                                    {/* Ghế */}
                                                                                    <td className="py-2.5 px-3">
                                                                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-blue/10 text-brand-blue font-bold text-xs">
                                                                                            {ticket.seatNumber}
                                                                                        </span>
                                                                                    </td>

                                                                                    {/* Hành khách */}
                                                                                    <td className="py-2.5 px-3">
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            <User className="h-3 w-3 text-gray-400 shrink-0" />
                                                                                            <div>
                                                                                                <div className="font-medium text-gray-800">
                                                                                                    {ticket.passengerName || booking.guestName}
                                                                                                </div>
                                                                                                {ticket.passengerPhone && (
                                                                                                    <div className="flex items-center gap-0.5 text-gray-400">
                                                                                                        <Phone className="h-2.5 w-2.5" />
                                                                                                        {ticket.passengerPhone}
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </td>

                                                                                    {/* Chuyến */}
                                                                                    <td className="py-2.5 px-3">
                                                                                        <div className="text-gray-800">{ticket.routeName || "—"}</div>
                                                                                        <div className="flex items-center gap-1.5 text-gray-400 mt-0.5">
                                                                                            <Calendar className="h-3 w-3" />
                                                                                            {ticket.departureDate ? format(new Date(ticket.departureDate), "dd/MM") : "—"}
                                                                                            <Clock className="h-3 w-3 ml-1" />
                                                                                            {ticket.departureTime?.substring(0, 5) || "—"}
                                                                                        </div>
                                                                                    </td>

                                                                                    {/* Điểm đón/trả */}
                                                                                    <td className="py-2.5 px-3">
                                                                                        {ticket.pickupPointName || ticket.dropoffPointName ? (
                                                                                            <div className="space-y-0.5">
                                                                                                {ticket.pickupPointName && (
                                                                                                    <div className="flex items-center gap-1 text-green-600">
                                                                                                        <MapPin className="h-3 w-3" />
                                                                                                        {ticket.pickupPointName}
                                                                                                    </div>
                                                                                                )}
                                                                                                {ticket.dropoffPointName && (
                                                                                                    <div className="flex items-center gap-1 text-red-500">
                                                                                                        <MapPin className="h-3 w-3" />
                                                                                                        {ticket.dropoffPointName}
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        ) : (
                                                                                            <span className="text-gray-400">Bến chính</span>
                                                                                        )}
                                                                                    </td>

                                                                                    {/* Giá vé */}
                                                                                    <td className="py-2.5 px-3 text-right">
                                                                                        <span className="font-medium text-gray-800">
                                                                                            {new Intl.NumberFormat("vi-VN").format(ticket.price)}đ
                                                                                        </span>
                                                                                    </td>

                                                                                    {/* Trạng thái vé */}
                                                                                    <td className="py-2.5 px-3 text-center">
                                                                                        <span className={cn(
                                                                                            "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                                                                            tCfg.className
                                                                                        )}>
                                                                                            {tCfg.label}
                                                                                        </span>
                                                                                    </td>

                                                                                    {/* Thao tác vé */}
                                                                                    <td className="py-2.5 px-3 text-center">
                                                                                        {canCancelTicket ? (
                                                                                            <button
                                                                                                onClick={() => handleCancelTicketOpen(ticket, booking.code)}
                                                                                                className="inline-flex items-center gap-0.5 px-2 py-1 rounded text-[10px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                                                                                            >
                                                                                                <XCircle className="h-3 w-3" />
                                                                                                Hủy vé
                                                                                            </button>
                                                                                        ) : (
                                                                                            <span className="text-gray-300">—</span>
                                                                                        )}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
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
