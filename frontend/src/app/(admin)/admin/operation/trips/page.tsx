"use client";

import { useState, useMemo, Fragment } from "react";
import { cn } from "@/lib/utils";
import {
    RefreshCw,
    Bus,
    Loader2,
    Play,
    Flag,
    ShieldCheck,
    ArrowRight,
    Eye,
    XCircle,
    Clock,
    MapPin,
    User,
    DollarSign,
    Ticket,
    Plus,
    Zap,
    CalendarPlus,
    Route as RouteIcon,
    CalendarClock,
    AlertTriangle,
    Info,
} from "lucide-react";
import { Trip, TripStatus, Route, TripSchedule } from "@/features/admin/types";
import { tripService } from "@/features/admin/services/trip-service";
import { routeService } from "@/features/admin/services/route-service";
import { scheduleService } from "@/features/admin/services/schedule-service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminDatePicker } from "@/features/admin/components/AdminDatePicker";
import { format } from "date-fns";
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
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractTime } from "@/features/admin/utils/date-format";

// Badge màu theo trạng thái
const STATUS_CONFIG: Record<
    TripStatus,
    { label: string; className: string; icon: React.ElementType }
> = {
    SCHEDULED: {
        label: "Đã lên lịch",
        className: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: Clock,
    },
    APPROVED: {
        label: "Đã duyệt",
        className: "bg-green-50 text-green-700 border-green-200",
        icon: ShieldCheck,
    },
    RUNNING: {
        label: "Đang chạy",
        className: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Play,
    },
    COMPLETED: {
        label: "Hoàn thành",
        className: "bg-gray-50 text-gray-600 border-gray-200",
        icon: Flag,
    },
    CANCELLED: {
        label: "Đã hủy",
        className: "bg-red-50 text-red-600 border-red-200",
        icon: XCircle,
    },
};

// Status filter options
const STATUS_FILTERS: { value: string; label: string }[] = [
    { value: "ALL", label: "Tất cả" },
    { value: "SCHEDULED", label: "Đã lên lịch" },
    { value: "APPROVED", label: "Đã duyệt" },
    { value: "RUNNING", label: "Đang chạy" },
    { value: "COMPLETED", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Đã hủy" },
];

export default function TripListPage() {
    // Filter State
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [groupFilter, setGroupFilter] = useState("ALL");

    // Detail Dialog State
    const [detailTrip, setDetailTrip] = useState<Trip | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    // Generate Dialog State
    const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

    // Manual Create Dialog State
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const queryClient = useQueryClient();

    // Fetch Trips
    const {
        data: trips = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["admin-trips", selectedDate, statusFilter],
        queryFn: async () => {
            try {
                const params: Record<string, unknown> = {
                    fromDate: selectedDate,
                    toDate: selectedDate,
                };
                if (statusFilter !== "ALL") {
                    params.status = statusFilter;
                }
                return await tripService.getTrips(params);
            } catch {
                toast.error("Không thể tải danh sách chuyến xe");
                return [];
            }
        },
    });

    // Mutations
    const approveMutation = useMutation({
        mutationFn: (tripId: number) => tripService.approveTrip(tripId),
        onSuccess: () => {
            toast.success("Duyệt chuyến thành công! Đã mở bán vé.");
            queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || "Lỗi duyệt chuyến");
        },
    });

    const startMutation = useMutation({
        mutationFn: (tripId: number) => tripService.startTrip(tripId),
        onSuccess: () => {
            toast.success("Chuyến xe đã bắt đầu khởi hành!");
            queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || "Lỗi bắt đầu chuyến");
        },
    });

    const completeMutation = useMutation({
        mutationFn: (tripId: number) => tripService.completeTrip(tripId),
        onSuccess: () => {
            toast.success("Chuyến xe đã hoàn thành!");
            queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || "Lỗi hoàn thành chuyến");
        },
    });

    const cancelMutation = useMutation({
        mutationFn: (tripId: number) => tripService.cancelTrip(tripId),
        onSuccess: () => {
            toast.success("Đã hủy chuyến thành công!");
            queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || "Lỗi hủy chuyến");
        },
    });

    const handleApprove = (trip: Trip) => {
        if (!confirm(`Duyệt chuyến ${trip.routeName} lúc ${extractTime(trip.departureTime)}? Chuyến sẽ được mở bán vé.`)) return;
        approveMutation.mutate(trip.id);
    };

    const handleStart = (trip: Trip) => {
        if (!confirm(`Bắt đầu chuyến ${trip.routeName} lúc ${extractTime(trip.departureTime)}?`)) return;
        startMutation.mutate(trip.id);
    };

    const handleComplete = (trip: Trip) => {
        if (!confirm(`Hoàn thành chuyến ${trip.routeName}?`)) return;
        completeMutation.mutate(trip.id);
    };

    const handleCancel = (trip: Trip) => {
        if (!confirm(`⚠️ Hủy chuyến ${trip.routeName} lúc ${extractTime(trip.departureTime)}? Hành động này không thể hoàn tác.`)) return;
        cancelMutation.mutate(trip.id);
    };

    const handleViewDetail = (trip: Trip) => {
        setDetailTrip(trip);
        setDetailOpen(true);
    };

    // Stats
    const stats = {
        total: trips.length,
        scheduled: trips.filter(t => t.status === "SCHEDULED").length,
        approved: trips.filter(t => t.status === "APPROVED").length,
        running: trips.filter(t => t.status === "RUNNING").length,
    };

    // Sort: actionable first → APPROVED → RUNNING → SCHEDULED (chưa gán) → COMPLETED → CANCELLED
    const sortedTrips = useMemo(() => {
        const getOrder = (t: Trip): number => {
            // SCHEDULED có xe + tài xế → "sẵn duyệt" → ưu tiên cao nhất
            if (t.status === "SCHEDULED" && t.busLicensePlate && t.driverName) return 0;
            // SCHEDULED có xe hoặc tài xế
            if (t.status === "SCHEDULED" && (t.busLicensePlate || t.driverName)) return 1;
            // APPROVED → sẵn sàng chạy
            if (t.status === "APPROVED") return 2;
            // RUNNING → đang chạy
            if (t.status === "RUNNING") return 3;
            // SCHEDULED chưa gán gì
            if (t.status === "SCHEDULED") return 4;
            // COMPLETED
            if (t.status === "COMPLETED") return 5;
            // CANCELLED
            return 6;
        };
        return [...trips].sort((a, b) => {
            const diff = getOrder(a) - getOrder(b);
            if (diff !== 0) return diff;
            // Cùng nhóm → sort theo giờ xuất bến
            return String(a.departureTime || "").localeCompare(String(b.departureTime || ""));
        });
    }, [trips]);

    // Group by Bus
    const groupedTripsByBus = useMemo(() => {
        const groups: Record<string, Trip[]> = {};
        sortedTrips.forEach(trip => {
            let busKey = "";
            if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
                busKey = "ĐÃ HOÀN THÀNH / HỦY";
            } else if (trip.busLicensePlate) {
                busKey = `Xe ${trip.busLicensePlate} (${trip.busTypeName || ''})`;
            } else {
                busKey = "CHƯA PHÂN CÔNG XE";
            }
            if (!groups[busKey]) groups[busKey] = [];
            groups[busKey].push(trip);
        });
        
        // Trước tiên, sort danh sách các chuyến xe bên trong mỗi Nhóm Xe theo thời gian khởi hành thực tế
        Object.values(groups).forEach(tripList => {
             tripList.sort((a, b) => {
                  const dateA = new Date(`${a.departureDate}T${a.departureTime || '00:00'}`).getTime();
                  const dateB = new Date(`${b.departureDate}T${b.departureTime || '00:00'}`).getTime();
                  if (isNaN(dateA) || isNaN(dateB)) {
                        return String(a.departureTime || "").localeCompare(String(b.departureTime || ""));
                  }
                  return dateA - dateB;
             });
        });

        // Thứ hai, sort tên CÁC NHÓM XE với nhau (Dựa trên chuyến khởi hành Sớm nhất của nhóm)
        const keys = Object.keys(groups).sort((a, b) => {
             // Đẩy "Không xe" và "Hoàn Thành" xuống cuối cùng
             const getWeight = (k: string) => {
                  if (k === "ĐÃ HOÀN THÀNH / HỦY") return 2;
                  if (k === "CHƯA PHÂN CÔNG XE") return 1;
                  return 0; // Nhóm xe bình thường
             };
             
             const weightA = getWeight(a);
             const weightB = getWeight(b);
             if (weightA !== weightB) return weightA - weightB;

             // Lấy chuyến đi sớm nhất của Nhóm A và Nhóm B
             const firstTripA = groups[a][0];
             const firstTripB = groups[b][0];

             if (firstTripA && firstTripB) {
                  const dateA = new Date(`${firstTripA.departureDate}T${firstTripA.departureTime || '00:00'}`).getTime();
                  const dateB = new Date(`${firstTripB.departureDate}T${firstTripB.departureTime || '00:00'}`).getTime();
                  if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) {
                       return dateA - dateB; // Trọng số Nhóm Xe nào chạy TRƯỚC sẽ đứng trên
                  }
             }

             // Nếu cùng giờ, fallback sort Alphabet theo Biển Số
             return a.localeCompare(b);
        });

        return { groups, keys };
    }, [sortedTrips]);

    return (
        <div className="space-y-6">

            {/* Dialogs */}
            <TripDetailDialog
                trip={detailTrip}
                open={detailOpen}
                onOpenChange={setDetailOpen}
            />
            <GenerateTripsDialog
                open={generateDialogOpen}
                onOpenChange={setGenerateDialogOpen}
                onSuccess={() => {
                    refetch();
                }}
            />
            <CreateTripDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={() => {
                    refetch();
                }}
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quản Lý Chuyến Xe
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Duyệt, theo dõi và quản lý vòng đời chuyến xe
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setGenerateDialogOpen(true)}
                        className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                    >
                        <Zap className="mr-2 h-4 w-4 text-brand-blue" />
                        Sinh chuyến tự động
                    </Button>
                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="bg-brand-blue hover:bg-brand-blue/90"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Tạo chuyến thủ công
                    </Button>
                    <button
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Tổng chuyến", value: stats.total, color: "text-gray-900" },
                    { label: "Chờ duyệt", value: stats.scheduled, color: "text-yellow-600" },
                    { label: "Đã duyệt", value: stats.approved, color: "text-green-600" },
                    { label: "Đang chạy", value: stats.running, color: "text-blue-600" },
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
                    {/* Date Picker */}
                    <AdminDatePicker
                        value={selectedDate ? new Date(selectedDate) : null}
                        onChange={(date) => setSelectedDate(date ? format(date, "yyyy-MM-dd") : "")}
                        className="w-[200px]"
                    />

                    {/* Status Filter */}
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

                    {/* Group Filter */}
                    <Select value={groupFilter} onValueChange={setGroupFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Nhóm xe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả nhóm</SelectItem>
                            {groupedTripsByBus.keys.map(k => (
                                <SelectItem key={k} value={k}>{k}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Result Count */}
                    <div className="flex items-center text-sm text-gray-500 sm:ml-auto">
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <span className="font-medium text-gray-900">{trips.length}</span>
                        )}
                        &nbsp;chuyến
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Giờ</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Tuyến</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600 hidden lg:table-cell">Loại xe</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Biển số</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Tài xế</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600 hidden md:table-cell">Vé</th>
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
                            ) : trips.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-gray-400">
                                        <Bus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-sm">Không có chuyến nào trong ngày này</p>
                                        <p className="text-xs text-gray-300 mt-1">Nhấn &quot;Sinh chuyến tự động&quot; hoặc &quot;Tạo chuyến thủ công&quot; để thêm chuyến mới</p>
                                    </td>
                                </tr>
                            ) : (
                                groupedTripsByBus.keys
                                    .filter(key => groupFilter === "ALL" || key === groupFilter)
                                    .map((busKey) => (
                                    <Fragment key={busKey}>
                                        <tr className="bg-gray-100/80 border-b border-t border-gray-200">
                                            <td colSpan={8} className="py-2.5 px-4 hover:bg-transparent">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded bg-brand-blue/10 flex items-center justify-center">
                                                        <Bus className="h-3.5 w-3.5 text-brand-blue" />
                                                    </div>
                                                    <span className="font-bold text-gray-800 text-sm">{busKey}</span>
                                                    <span className="bg-white px-2 py-0.5 rounded-full text-xs font-semibold text-gray-500 border border-gray-200">
                                                        {groupedTripsByBus.groups[busKey].length} chuyến
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                        {groupedTripsByBus.groups[busKey].map((trip) => {
                                            const statusCfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.SCHEDULED;
                                    const StatusIcon = statusCfg.icon;
                                    const isUnassignedGroup = busKey === "CHƯA PHÂN CÔNG XE";
                                    const canApprove = trip.status === "SCHEDULED" && !isUnassignedGroup;
                                    const canStart = trip.status === "APPROVED";
                                    const canComplete = trip.status === "RUNNING";
                                    const canCancel = (trip.status === "SCHEDULED" || trip.status === "APPROVED") && !isUnassignedGroup;

                                    return (
                                        <tr key={trip.id} className="hover:bg-gray-50/50 transition-colors">
                                            {/* Giờ */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-gray-900">
                                                    {extractTime(trip.departureTime)}
                                                </div>
                                                <div className="text-xs text-gray-400 flex items-center gap-0.5">
                                                    <ArrowRight className="h-3 w-3" />
                                                    {extractTime(trip.arrivalTime)}
                                                </div>
                                            </td>

                                            {/* Tuyến */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-medium text-gray-900">{trip.routeName}</div>
                                                <div className="text-xs text-gray-400">{trip.routeCode}</div>
                                            </td>

                                            {/* Loại xe */}
                                            <td className="py-3.5 px-4 hidden lg:table-cell">
                                                <span className="text-gray-600">{trip.busTypeName || trip.busType || "—"}</span>
                                            </td>

                                            {/* Biển số */}
                                            <td className="py-3.5 px-4">
                                                {trip.busLicensePlate ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs font-mono font-medium text-gray-700">
                                                        <Bus className="h-3 w-3" />
                                                        {trip.busLicensePlate}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>

                                            {/* Tài xế */}
                                            <td className="py-3.5 px-4">
                                                {trip.driverName ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-brand-blue/10 flex items-center justify-center text-[10px] font-bold text-brand-blue">
                                                            {trip.driverName[0]}
                                                        </div>
                                                        <span className="text-gray-700 font-medium text-xs">
                                                            {trip.driverName}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>

                                            {/* Vé */}
                                            <td className="py-3.5 px-4 hidden md:table-cell">
                                                {trip.totalSeats > 0 ? (
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <Ticket className="h-3 w-3 text-gray-400" />
                                                        <span className="font-medium text-gray-700">
                                                            {trip.availableSeats}/{trip.totalSeats}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>

                                            {/* Trạng thái */}
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border",
                                                    statusCfg.className
                                                )}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {statusCfg.label}
                                                </span>
                                            </td>

                                            {/* Thao tác */}
                                            <td className="py-3.5 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {/* View Detail */}
                                                    <button
                                                        onClick={() => handleViewDetail(trip)}
                                                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                    </button>

                                                    {isUnassignedGroup && trip.status === "SCHEDULED" && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200 whitespace-nowrap" title="Vui lòng bấm vào [Chi tiết] hoặc [Sửa] để phân công xe/tài xế trước khi duyệt">
                                                            <AlertTriangle className="h-2.5 w-2.5" />
                                                            Thiếu dữ liệu
                                                        </span>
                                                    )}

                                                    {canApprove && (
                                                        <button
                                                            onClick={() => handleApprove(trip)}
                                                            disabled={approveMutation.isPending}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                                                        >
                                                            <ShieldCheck className="h-3 w-3" />
                                                            Duyệt
                                                        </button>
                                                    )}
                                                    {canStart && (
                                                        <button
                                                            onClick={() => handleStart(trip)}
                                                            disabled={startMutation.isPending}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                                                        >
                                                            <Play className="h-3 w-3" />
                                                            Bắt đầu
                                                        </button>
                                                    )}
                                                    {canComplete && (
                                                        <button
                                                            onClick={() => handleComplete(trip)}
                                                            disabled={completeMutation.isPending}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                                                        >
                                                            <Flag className="h-3 w-3" />
                                                            Hoàn thành
                                                        </button>
                                                    )}
                                                    {canCancel && (
                                                        <button
                                                            onClick={() => handleCancel(trip)}
                                                            disabled={cancelMutation.isPending}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                                                        >
                                                            <XCircle className="h-3 w-3" />
                                                            Hủy
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                        })
                                    }
                                    </Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ==================== Generate Trips Dialog ====================

function GenerateTripsDialog({
    open,
    onOpenChange,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}) {
    const [selectedRouteId, setSelectedRouteId] = useState<string>("");
    const [genFromDate, setGenFromDate] = useState<Date | null>(null);
    const [genToDate, setGenToDate] = useState<Date | null>(null);
    const [forceRegenerate, setForceRegenerate] = useState(false);

    // Fetch Routes
    const { data: routes = [] } = useQuery({
        queryKey: ["routes"],
        queryFn: routeService.getAll,
        enabled: open,
    });

    const generateMutation = useMutation({
        mutationFn: (payload: { routeId: number; fromDate: string; toDate: string; forceRegenerate: boolean }) =>
            tripService.generateTrips(payload),
        onSuccess: (result) => {
            const msg = result
                ? `Tạo ${result.totalTripsCreated} chuyến, bỏ qua ${result.totalSkipped} chuyến trùng.`
                : "Sinh chuyến thành công!";
            toast.success(msg);
            onOpenChange(false);
            resetForm();
            onSuccess();
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            toast.error(err?.response?.data?.message || "Lỗi khi sinh chuyến tự động");
        },
    });

    const resetForm = () => {
        setSelectedRouteId("");
        setGenFromDate(null);
        setGenToDate(null);
        setForceRegenerate(false);
    };

    const handleGenerate = () => {
        if (!selectedRouteId) {
            toast.warning("Vui lòng chọn tuyến đường");
            return;
        }
        if (!genFromDate || !genToDate) {
            toast.warning("Vui lòng chọn ngày bắt đầu và kết thúc");
            return;
        }
        if (genFromDate > genToDate) {
            toast.warning("Ngày bắt đầu không được lớn hơn ngày kết thúc");
            return;
        }
        generateMutation.mutate({
            routeId: Number(selectedRouteId),
            fromDate: format(genFromDate, "yyyy-MM-dd"),
            toDate: format(genToDate, "yyyy-MM-dd"),
            forceRegenerate,
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => {
            if (!v) resetForm();
            onOpenChange(v);
        }}>
            <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-white">
                <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                            <Zap className="h-4.5 w-4.5 text-brand-blue" />
                        </div>
                        Sinh Chuyến Tự Động
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500 mt-1">
                        Hệ thống sẽ dựa trên Lịch trình mẫu (Active) để sinh chuyến xe cho tuyến và khoảng thời gian bạn chọn.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-5 space-y-4">
                    {/* Route Selection */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Tuyến đường <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <RouteIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                                <SelectTrigger className="w-full pl-10 bg-white">
                                    <SelectValue placeholder="-- Chọn tuyến đường --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {routes.map((r: Route) => (
                                        <SelectItem key={r.id} value={r.id.toString()}>
                                            {r.name} ({r.distance} km)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Từ ngày <span className="text-red-500">*</span></label>
                            <AdminDatePicker
                                value={genFromDate}
                                onChange={(d) => setGenFromDate(d || null)}
                                className="w-full"
                                placeholder="Chọn ngày bắt đầu"
                            />
                        </div>
                        <div className="space-y-1.5 flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Đến ngày <span className="text-red-500">*</span></label>
                            <AdminDatePicker
                                value={genToDate}
                                onChange={(d) => setGenToDate(d || null)}
                                className="w-full"
                                minDate={genFromDate || undefined}
                                placeholder="Chọn ngày kết thúc"
                            />
                        </div>
                    </div>

                    {/* Force Regenerate Toggle */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/60 border border-amber-100">
                        <input
                            type="checkbox"
                            id="forceRegenerate"
                            checked={forceRegenerate}
                            onChange={(e) => setForceRegenerate(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor="forceRegenerate" className="text-sm leading-tight">
                            <span className="font-medium text-amber-800 flex items-center gap-1">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Sinh lại (Force Regenerate)
                            </span>
                            <span className="text-xs text-amber-600 block mt-0.5">
                                Xóa các chuyến SCHEDULED cũ và sinh lại. Chuyến đã APPROVED/RUNNING sẽ không bị ảnh hưởng.
                            </span>
                        </label>
                    </div>

                    {/* Info note */}
                    <div className="flex items-start gap-2 text-xs text-gray-400">
                        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>Chỉ các lịch trình ở trạng thái ACTIVE mới được sử dụng để sinh chuyến.</span>
                    </div>
                </div>

                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={generateMutation.isPending}
                        className="bg-brand-blue hover:bg-brand-blue/90"
                    >
                        {generateMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <Zap className="h-4 w-4 mr-2" />
                                Bắt đầu sinh chuyến
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ==================== Create Trip Dialog (Manual) ====================

function CreateTripDialog({
    open,
    onOpenChange,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}) {
    const [selectedRouteId, setSelectedRouteId] = useState<string>("");
    const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
    const [departureDate, setDepartureDate] = useState<Date | null>(null);
    const [departureTime, setDepartureTime] = useState<string>("");
    const [tripType, setTripType] = useState<string>("MAIN");
    const [note, setNote] = useState<string>("");

    // Fetch Routes
    const { data: routes = [] } = useQuery({
        queryKey: ["routes"],
        queryFn: routeService.getAll,
        enabled: open,
    });

    // Fetch Schedules for selected route
    const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
        queryKey: ["schedules-for-create", selectedRouteId],
        queryFn: () => scheduleService.getByRoute(Number(selectedRouteId)),
        enabled: open && !!selectedRouteId,
    });

    // Filter only ACTIVE schedules
    const activeSchedules = schedules.filter((s: TripSchedule) => s.status === "ACTIVE");

    const createMutation = useMutation({
        mutationFn: (payload: {
            tripScheduleId: number;
            departureDate: string;
            departureTime?: string;
            tripType?: string;
            note?: string;
        }) => tripService.createTrip(payload),
        onSuccess: () => {
            toast.success(
                tripType === "REINFORCEMENT"
                    ? "Tạo chuyến tăng cường thành công!"
                    : "Tạo chuyến chính thành công!"
            );
            onOpenChange(false);
            resetForm();
            onSuccess();
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            toast.error(err?.response?.data?.message || "Lỗi khi tạo chuyến thủ công");
        },
    });

    const resetForm = () => {
        setSelectedRouteId("");
        setSelectedScheduleId("");
        setDepartureDate(null);
        setDepartureTime("");
        setTripType("MAIN");
        setNote("");
    };

    const handleCreate = () => {
        if (!selectedScheduleId) {
            toast.warning("Vui lòng chọn lịch trình mẫu");
            return;
        }
        if (!departureDate) {
            toast.warning("Vui lòng chọn ngày khởi hành");
            return;
        }

        const payload: {
            tripScheduleId: number;
            departureDate: string;
            departureTime?: string;
            tripType?: string;
            note?: string;
        } = {
            tripScheduleId: Number(selectedScheduleId),
            departureDate: format(departureDate, "yyyy-MM-dd"),
            tripType,
        };

        if (departureTime) {
            payload.departureTime = departureTime;
        }
        if (note.trim()) {
            payload.note = note.trim();
        }

        createMutation.mutate(payload);
    };

    // When route changes, reset schedule selection
    const handleRouteChange = (val: string) => {
        setSelectedRouteId(val);
        setSelectedScheduleId("");
    };

    return (
        <Dialog open={open} onOpenChange={(v) => {
            if (!v) resetForm();
            onOpenChange(v);
        }}>
            <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-white">
                <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                            <CalendarPlus className="h-4.5 w-4.5 text-brand-blue" />
                        </div>
                        Tạo Chuyến Thủ Công
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500 mt-1">
                        Tạo 1 chuyến dựa trên Lịch trình mẫu. Chọn loại MAIN (chuyến chính) hoặc REINFORCEMENT (tăng cường).
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-5 space-y-4">
                    {/* Route Selection */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Tuyến đường <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <RouteIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <Select value={selectedRouteId} onValueChange={handleRouteChange}>
                                <SelectTrigger className="w-full pl-10 bg-white">
                                    <SelectValue placeholder="-- Chọn tuyến đường --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {routes.map((r: Route) => (
                                        <SelectItem key={r.id} value={r.id.toString()}>
                                            {r.name} ({r.distance} km)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Schedule Selection */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Lịch trình mẫu <span className="text-red-500">*</span></label>
                        <Select
                            value={selectedScheduleId}
                            onValueChange={setSelectedScheduleId}
                            disabled={!selectedRouteId || schedulesLoading}
                        >
                            <SelectTrigger className="w-full bg-white">
                                <SelectValue placeholder={
                                    !selectedRouteId
                                        ? "Chọn tuyến trước"
                                        : schedulesLoading
                                            ? "Đang tải..."
                                            : activeSchedules.length === 0
                                                ? "Không có lịch trình Active"
                                                : "-- Chọn lịch trình --"
                                } />
                            </SelectTrigger>
                            <SelectContent>
                                {activeSchedules.map((s: TripSchedule) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>
                                        <div className="flex items-center gap-2">
                                            <CalendarClock className="h-3.5 w-3.5 text-brand-blue" />
                                            <span className="font-medium">{s.departureTime.slice(0, 5)}</span>
                                            <span className="text-gray-400">—</span>
                                            <span className="text-gray-500 text-xs">{s.code}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                                {activeSchedules.length === 0 && selectedRouteId && !schedulesLoading && (
                                    <div className="px-3 py-2 text-xs text-gray-400 text-center">
                                        Không có lịch trình Active cho tuyến này
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Departure Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Ngày khởi hành <span className="text-red-500">*</span></label>
                            <AdminDatePicker
                                value={departureDate}
                                onChange={(d) => setDepartureDate(d || null)}
                                className="w-full"
                                placeholder="Chọn ngày"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">
                                Giờ thực tế
                                <span className="text-xs text-gray-400 ml-1">(tùy chọn)</span>
                            </label>
                            <div className="h-10 border border-gray-200 rounded-md overflow-hidden bg-white hover:border-brand-blue focus-within:border-brand-blue transition-colors px-3 flex items-center">
                                <input
                                    type="time"
                                    value={departureTime}
                                    onChange={(e) => setDepartureTime(e.target.value)}
                                    className="w-full h-full bg-transparent border-none outline-none focus:ring-0 text-sm"
                                    placeholder="Lấy từ lịch trình"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400">Nếu bỏ trống, hệ thống lấy giờ từ Lịch trình mẫu</p>
                        </div>
                    </div>

                    {/* Trip Type */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Loại chuyến</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setTripType("MAIN")}
                                className={cn(
                                    "flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all",
                                    tripType === "MAIN"
                                        ? "border-brand-blue bg-brand-blue/5 ring-1 ring-brand-blue/20"
                                        : "border-gray-200 bg-white hover:border-gray-300"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    tripType === "MAIN" ? "bg-brand-blue/10 text-brand-blue" : "bg-gray-100 text-gray-400"
                                )}>
                                    <Bus className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className={cn("text-sm font-medium", tripType === "MAIN" ? "text-brand-blue" : "text-gray-700")}>
                                        Chuyến chính
                                    </p>
                                    <p className="text-[10px] text-gray-400">Chuyến thường theo lịch</p>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTripType("REINFORCEMENT")}
                                className={cn(
                                    "flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all",
                                    tripType === "REINFORCEMENT"
                                        ? "border-amber-500 bg-amber-50/50 ring-1 ring-amber-200"
                                        : "border-gray-200 bg-white hover:border-gray-300"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    tripType === "REINFORCEMENT" ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400"
                                )}>
                                    <Plus className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className={cn("text-sm font-medium", tripType === "REINFORCEMENT" ? "text-amber-700" : "text-gray-700")}>
                                        Tăng cường
                                    </p>
                                    <p className="text-[10px] text-gray-400">Thêm chuyến khi đông</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Note */}
                    {tripType === "REINFORCEMENT" && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Ghi chú / Lý do</label>
                            <Input
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Ví dụ: Tăng cường dịp lễ 30/4, khách đông..."
                                className="bg-white"
                            />
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={createMutation.isPending}
                        className="bg-brand-blue hover:bg-brand-blue/90"
                    >
                        {createMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Đang tạo...
                            </>
                        ) : (
                            <>
                                <CalendarPlus className="h-4 w-4 mr-2" />
                                Tạo chuyến
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ==================== Trip Detail Dialog ====================

function TripDetailDialog({
    trip,
    open,
    onOpenChange,
}: {
    trip: Trip | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (!trip) return null;

    const statusCfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.SCHEDULED;
    const StatusIcon = statusCfg.icon;
    const occupancy = trip.totalSeats > 0
        ? Math.round(((trip.totalSeats - trip.availableSeats) / trip.totalSeats) * 100)
        : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-brand-blue" />
                        Chi Tiết Chuyến Xe
                    </DialogTitle>
                    <DialogDescription>
                        Mã chuyến: {trip.code}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                        <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border",
                            statusCfg.className
                        )}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusCfg.label}
                        </span>
                        <span className="text-sm text-gray-500">
                            {trip.departureDate}
                        </span>
                    </div>

                    {/* Route Info */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-brand-blue" />
                            <div>
                                <p className="font-semibold text-gray-900">{trip.routeName}</p>
                                <p className="text-xs text-gray-500">{trip.routeCode}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 ml-6">
                            <div className="text-center">
                                <p className="text-lg font-bold text-gray-900">{extractTime(trip.departureTime)}</p>
                                <p className="text-[10px] text-gray-400">Xuất bến</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-300" />
                            <div className="text-center">
                                <p className="text-lg font-bold text-gray-900">{extractTime(trip.arrivalTime)}</p>
                                <p className="text-[10px] text-gray-400">Đến nơi</p>
                            </div>
                        </div>
                    </div>

                    {/* Resources */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Bus */}
                        <div className="border border-gray-100 rounded-lg p-2.5">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Phương tiện</p>
                            {trip.busLicensePlate ? (
                                <div className="flex items-center gap-1.5">
                                    <Bus className="h-3.5 w-3.5 text-gray-500" />
                                    <span className="font-mono font-medium text-sm text-gray-800">{trip.busLicensePlate}</span>
                                </div>
                            ) : (
                                <span className="text-xs text-red-500">Chưa gán</span>
                            )}
                            <p className="text-[11px] text-gray-400 mt-0.5">{trip.busTypeName || trip.busType || "—"}</p>
                        </div>

                        {/* Driver */}
                        <div className="border border-gray-100 rounded-lg p-2.5">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Tài xế</p>
                            {trip.driverName ? (
                                <div className="flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-gray-500" />
                                    <span className="font-medium text-sm text-gray-800">{trip.driverName}</span>
                                </div>
                            ) : (
                                <span className="text-xs text-red-500">Chưa gán</span>
                            )}
                        </div>
                    </div>

                    {/* Ticket & Price Info */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="text-center border border-gray-100 rounded-lg p-2.5">
                            <Ticket className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                            <p className="text-sm font-bold text-gray-900">
                                {trip.availableSeats}/{trip.totalSeats}
                            </p>
                            <p className="text-[10px] text-gray-400">Chỗ trống</p>
                        </div>
                        <div className="text-center border border-gray-100 rounded-lg p-2.5">
                            <DollarSign className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                            <p className="text-sm font-bold text-gray-900">
                                {trip.price?.toLocaleString("vi-VN")}₫
                            </p>
                            <p className="text-[10px] text-gray-400">Giá vé</p>
                        </div>
                        <div className="text-center border border-gray-100 rounded-lg p-2.5">
                            <div className="h-4 w-4 mx-auto mb-1 flex items-center justify-center">
                                <div className={cn(
                                    "w-3 h-3 rounded-full",
                                    occupancy > 80 ? "bg-red-400" : occupancy > 50 ? "bg-yellow-400" : "bg-green-400"
                                )} />
                            </div>
                            <p className="text-sm font-bold text-gray-900">{occupancy}%</p>
                            <p className="text-[10px] text-gray-400">Lấp đầy</p>
                        </div>
                    </div>

                    {/* Dispatch Note */}
                    {trip.dispatchNote && (
                        <div className="bg-blue-50/50 rounded-lg p-2.5 text-xs">
                            <p className="font-semibold text-blue-700 mb-0.5">Ghi chú điều độ</p>
                            <p className="text-blue-600">{trip.dispatchNote}</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
