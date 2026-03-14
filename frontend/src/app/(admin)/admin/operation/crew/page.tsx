"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    RefreshCw,
    Loader2,
    Users,
    Bus,
    AlertCircle,
    ArrowRight,
    UserPlus,
    UserMinus,
    Shield,
    User,
    UserCheck,
    History,
    MapPin,
    Search,
    Filter,
} from "lucide-react";
import { Trip, DriverAvailable, TripStatus, CrewMember, CrewRole } from "@/features/admin/types";
import { tripService } from "@/features/admin/services/trip-service";
import { crewService } from "@/features/admin/services/crew-service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminDatePicker } from "@/features/admin/components/AdminDatePicker";
import { format } from "date-fns";
import { extractTime } from "@/features/admin/utils/date-format";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Status options
const STATUS_CONFIG: Record<TripStatus, { label: string; className: string }> = {
    SCHEDULED: { label: "Đã lên lịch", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    APPROVED: { label: "Đã duyệt", className: "bg-green-50 text-green-700 border-green-200" },
    RUNNING: { label: "Đang chạy", className: "bg-blue-50 text-blue-700 border-blue-200" },
    COMPLETED: { label: "Hoàn thành", className: "bg-gray-50 text-gray-600 border-gray-200" },
    CANCELLED: { label: "Đã hủy", className: "bg-red-50 text-red-600 border-red-200" },
};

// Role config — khớp backend CrewRole enum
const ROLE_CONFIG: Partial<Record<CrewRole, { label: string; icon: React.ElementType; className: string }>> = {
    MAIN_DRIVER: { label: "Tài xế chính", icon: Shield, className: "bg-blue-50 text-blue-700" },
    CO_DRIVER: { label: "Tài xế phụ", icon: User, className: "bg-indigo-50 text-indigo-700" },
    // ATTENDANT: { label: "Tiếp Viên", icon: Headphones, className: "bg-emerald-50 text-emerald-700" }, // Khoan quản lý tiếp viên - không ảnh hưởng trực tiếp vận hành
};

// Role options cho Select dropdown
const ROLE_OPTIONS: { value: CrewRole; label: string }[] = [
    { value: "MAIN_DRIVER", label: "Tài xế chính" },
    { value: "CO_DRIVER", label: "Tài xế phụ" },
    // { value: "ATTENDANT", label: "Tiếp Viên" }, // Khoan quản lý tiếp viên
];

const STATUS_FILTERS = [
    { value: "ALL", label: "Tất cả" },
    { value: "SCHEDULED", label: "Đã lên lịch" },
    { value: "APPROVED", label: "Đã duyệt" },
    { value: "RUNNING", label: "Đang chạy" },
];

export default function CrewPage() {
    const [selectedDate, setSelectedDate] = useState(() => {
        return new Date().toISOString().split("T")[0];
    });
    const [statusFilter, setStatusFilter] = useState("ALL");

    // Crew Management Dialog
    const [crewDialogOpen, setCrewDialogOpen] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

    const queryClient = useQueryClient();

    // Fetch Trips (all statuses except CANCELLED)
    const { data: trips = [], isLoading, refetch } = useQuery({
        queryKey: ["crew-trips", selectedDate, statusFilter],
        queryFn: async () => {
            const params: Record<string, unknown> = {
                fromDate: selectedDate,
                toDate: selectedDate,
            };
            if (statusFilter !== "ALL") {
                params.status = statusFilter;
            }
            return await tripService.getTrips(params);
        },
    });

    // Filter out cancelled
    const filteredTrips = trips.filter((t: Trip) => t.status !== "CANCELLED");

    // Stats
    const stats = {
        total: filteredTrips.length,
        withCrew: filteredTrips.filter((t: Trip) => t.driverName).length,
        noCrew: filteredTrips.filter((t: Trip) => !t.driverName).length,
    };

    // Sort: actionable first → APPROVED → RUNNING → SCHEDULED chưa gán → COMPLETED
    const sortedTrips = useMemo(() => {
        const getOrder = (t: Trip): number => {
            if (t.status === "SCHEDULED" && t.busLicensePlate && t.driverName) return 0;
            if (t.status === "SCHEDULED" && (t.busLicensePlate || t.driverName)) return 1;
            if (t.status === "APPROVED") return 2;
            if (t.status === "RUNNING") return 3;
            if (t.status === "SCHEDULED") return 4;
            if (t.status === "COMPLETED") return 5;
            return 6;
        };
        return [...filteredTrips].sort((a: Trip, b: Trip) => {
            const diff = getOrder(a) - getOrder(b);
            if (diff !== 0) return diff;
            return String(a.departureTime || "").localeCompare(String(b.departureTime || ""));
        });
    }, [filteredTrips]);

    const handleManageCrew = (trip: Trip) => {
        setSelectedTrip(trip);
        setCrewDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Crew Management Dialog */}
            {selectedTrip && (
                <CrewManagementDialog
                    trip={selectedTrip}
                    open={crewDialogOpen}
                    onOpenChange={setCrewDialogOpen}
                    onChanged={() => {
                        queryClient.invalidateQueries({ queryKey: ["crew-trips"] });
                    }}
                />
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Đội Ngũ</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Quản lý tài xế và tiếp viên cho từng chuyến
                    </p>
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
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Tổng chuyến", value: stats.total, color: "text-gray-900" },
                    { label: "Đã gán nhân viên", value: stats.withCrew, color: "text-green-600" },
                    { label: "Chưa gán", value: stats.noCrew, color: "text-red-600" },
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
                    <AdminDatePicker
                        value={selectedDate ? new Date(selectedDate) : null}
                        onChange={(date) => setSelectedDate(date ? format(date, "yyyy-MM-dd") : "")}
                        className="w-[200px]"
                    />
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
                            <span className="font-medium text-gray-900">{filteredTrips.length}</span>
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
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Biển số</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Đội ngũ</th>
                                <th className="text-center py-3.5 px-4 font-semibold text-gray-600">Trạng thái</th>
                                <th className="text-center py-3.5 px-4 font-semibold text-gray-600">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredTrips.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-gray-400">
                                        <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-sm">Không có chuyến nào</p>
                                    </td>
                                </tr>
                            ) : (
                                sortedTrips.map((trip: Trip) => {
                                    const statusCfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.SCHEDULED;
                                    const hasCrew = !!trip.driverName;
                                    const hasBus = !!trip.busLicensePlate;
                                    const isEditableStatus = trip.status === "SCHEDULED" || trip.status === "APPROVED";
                                    const canManage = isEditableStatus && hasBus;

                                    return (
                                        <tr key={trip.id} className={cn(
                                            "hover:bg-gray-50/50 transition-colors",
                                            !hasCrew ? "bg-amber-50/30" : ""
                                        )}>
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

                                            {/* Đội ngũ */}
                                            <td className="py-3.5 px-4">
                                                {hasCrew ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-brand-blue/10 flex items-center justify-center text-[10px] font-bold text-brand-blue">
                                                            {trip.driverName![0]}
                                                        </div>
                                                        <span className="text-gray-700 font-medium text-xs">
                                                            {trip.driverName}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded">
                                                        <AlertCircle className="h-3 w-3" />
                                                        Chưa gán
                                                    </span>
                                                )}
                                            </td>

                                            {/* Trạng thái */}
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border",
                                                    statusCfg.className
                                                )}>
                                                    {statusCfg.label}
                                                </span>
                                            </td>

                                            {/* Thao tác */}
                                            <td className="py-3.5 px-4 text-center">
                                                {canManage ? (
                                                    <button
                                                        onClick={() => handleManageCrew(trip)}
                                                        className={cn(
                                                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                                            !hasCrew
                                                                ? "bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20"
                                                                : "text-gray-600 hover:bg-gray-100"
                                                        )}
                                                    >
                                                        <Users className="h-3.5 w-3.5" />
                                                        {!hasCrew ? "Gán nhân viên" : "Quản lý"}
                                                    </button>
                                                ) : isEditableStatus && !hasBus ? (
                                                    <span
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 cursor-not-allowed"
                                                        title="Cần gán xe trước khi gán nhân viên"
                                                    >
                                                        <Bus className="h-3.5 w-3.5" />
                                                        Chưa gán xe
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleManageCrew(trip)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Users className="h-3.5 w-3.5" />
                                                        Xem
                                                    </button>
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

// ==================== Crew Management Dialog (Batch Mode) ====================

/**
 * Pending item trong queue (chưa submit lên server)
 */
interface PendingCrewItem {
    id: string;            // UUID tạm (client-side)
    driverId: number;
    driverName: string;
    licenseClass: string;
    role: CrewRole;
}

function CrewManagementDialog({
    trip,
    open,
    onOpenChange,
    onChanged,
}: {
    trip: Trip;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onChanged: () => void;
}) {
    const [selectedDriverId, setSelectedDriverId] = useState<string>("");
    const [selectedRole, setSelectedRole] = useState<CrewRole>("MAIN_DRIVER");
    const [pendingQueue, setPendingQueue] = useState<PendingCrewItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [licenseFilter, setLicenseFilter] = useState("ALL");
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<{ assignmentId: number; fullName: string } | null>(null);
    const queryClient = useQueryClient();

    const canEdit = trip.status === "SCHEDULED" || trip.status === "APPROVED";

    // Fetch current crew
    const { data: crew = [], isLoading: crewLoading } = useQuery({
        queryKey: ["trip-crew", trip.id],
        queryFn: () => crewService.getTripCrew(trip.id),
        enabled: open,
    });

    // Fetch available drivers
    const { data: availableDrivers = [], isLoading: driversLoading } = useQuery({
        queryKey: ["available-drivers-trip", trip.id],
        queryFn: () => tripService.getAvailableDriversForTrip(trip.id),
        enabled: open && canEdit,
    });

    // ─── Mutations ───
    const batchAssignMutation = useMutation({
        mutationFn: (items: { driverId: number; role: CrewRole }[]) =>
            crewService.assignCrewBatch(trip.id, items),
        onSuccess: (result) => {
            toast.success(`Gán thành công ${result.length} nhân sự!`);
            setPendingQueue([]);
            setSelectedDriverId("");
            queryClient.invalidateQueries({ queryKey: ["trip-crew", trip.id] });
            queryClient.invalidateQueries({ queryKey: ["available-drivers-trip", trip.id] });
            onChanged();
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || "Lỗi gán nhân sự");
        },
    });

    const assignMutation = useMutation({
        mutationFn: ({ driverId, role }: { driverId: number; role: CrewRole }) =>
            crewService.assignCrewMember(trip.id, { driverId, role }),
        onSuccess: () => {
            toast.success("Gán nhân sự thành công!");
            setSelectedDriverId("");
            queryClient.invalidateQueries({ queryKey: ["trip-crew", trip.id] });
            queryClient.invalidateQueries({ queryKey: ["available-drivers-trip", trip.id] });
            onChanged();
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || "Lỗi gán nhân sự");
        },
    });

    const cancelMutation = useMutation({
        mutationFn: (assignmentId: number) => crewService.cancelAssignment(assignmentId),
        onSuccess: () => {
            toast.success("Đã hủy phân công!");
            queryClient.invalidateQueries({ queryKey: ["trip-crew", trip.id] });
            queryClient.invalidateQueries({ queryKey: ["available-drivers-trip", trip.id] });
            onChanged();
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || "Lỗi hủy phân công");
        },
    });

    // Filter active crew vs historical
    const activeCrew = crew.filter((m: CrewMember) => m.status === "PENDING" || m.status === "ACTIVE");
    const historyCrew = crew.filter((m: CrewMember) => m.status !== "PENDING" && m.status !== "ACTIVE");

    // ─── MAIN_DRIVER validation ───
    const hasMainDriver = activeCrew.some((m: CrewMember) => m.role === "MAIN_DRIVER")
        || pendingQueue.some(p => p.role === "MAIN_DRIVER");

    // Auto switch role if MAIN_DRIVER already exists
    const effectiveRole = (selectedRole === "MAIN_DRIVER" && hasMainDriver) ? "CO_DRIVER" : selectedRole;

    // Unique license classes từ danh sách khả dụng
    const uniqueLicenseClasses = useMemo(() => {
        const classes = new Set<string>();
        availableDrivers.forEach((d: DriverAvailable) => {
            if (d.driverDetail?.licenseClass) classes.add(d.driverDetail.licenseClass);
        });
        return Array.from(classes).sort();
    }, [availableDrivers]);

    // Filter available drivers (loại đã gán + queue + bộ lọc bằng lái + tìm kiếm)
    const filteredDrivers = useMemo(() => {
        return availableDrivers.filter((d: DriverAvailable) => {
            if (pendingQueue.some(p => p.driverId === d.id)) return false;
            if (activeCrew.some((m: CrewMember) => m.userId === d.id)) return false;
            // Lọc bằng lái
            if (licenseFilter !== "ALL" && d.driverDetail?.licenseClass !== licenseFilter) return false;
            // Tìm kiếm theo tên
            if (searchQuery && !d.fullName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [availableDrivers, pendingQueue, activeCrew, licenseFilter, searchQuery]);

    // ─── Handlers ───
    const handleAddToQueue = () => {
        if (!selectedDriverId) {
            toast.error("Vui lòng chọn nhân sự");
            return;
        }
        const driverId = Number(selectedDriverId);

        if (pendingQueue.some(p => p.driverId === driverId)) {
            toast.error("Nhân sự này đã có trong hàng chờ");
            return;
        }
        if (activeCrew.some((m: CrewMember) => m.userId === driverId)) {
            toast.error("Nhân sự này đã được gán cho chuyến rồi");
            return;
        }

        // Validate max 1 MAIN_DRIVER
        if (effectiveRole === "MAIN_DRIVER" && hasMainDriver) {
            toast.error("Chuyến này đã có tài xế chính. Mỗi chuyến chỉ được phép 1 tài xế chính.");
            return;
        }

        const driver = availableDrivers.find((d: DriverAvailable) => d.id === driverId);
        if (!driver) return;

        setPendingQueue(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                driverId,
                driverName: driver.fullName,
                licenseClass: driver.driverDetail?.licenseClass || "N/A",
                role: effectiveRole,
            },
        ]);
        setSelectedDriverId("");
        toast.success(`Đã thêm ${driver.fullName} vào hàng chờ`);
    };

    const handleRemoveFromQueue = (id: string) => {
        setPendingQueue(prev => prev.filter(p => p.id !== id));
    };

    const handleSubmitBatch = () => {
        if (pendingQueue.length === 0) {
            toast.error("Hàng chờ trống, vui lòng thêm nhân sự trước");
            return;
        }
        const items = pendingQueue.map(p => ({ driverId: p.driverId, role: p.role }));
        batchAssignMutation.mutate(items);
    };

    const handleDirectAssign = () => {
        if (!selectedDriverId) {
            toast.error("Vui lòng chọn nhân sự");
            return;
        }
        if (effectiveRole === "MAIN_DRIVER" && hasMainDriver) {
            toast.error("Chuyến này đã có tài xế chính.");
            return;
        }
        assignMutation.mutate({
            driverId: Number(selectedDriverId),
            role: effectiveRole,
        });
    };

    const isSubmitting = batchAssignMutation.isPending || assignMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={(v) => {
            if (!v) setPendingQueue([]);
            onOpenChange(v);
        }}>
            <DialogContent className="!max-w-[1060px] p-0 overflow-hidden bg-white">
                <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-brand-blue" />
                        </div>
                        Quản Lý Đội Ngũ
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Quản lý nhân sự cho chuyến {trip.routeName}
                    </DialogDescription>
                </DialogHeader>

                {/* 2-Column Layout */}
                <div className="grid grid-cols-[1fr_380px] divide-x divide-gray-100" style={{ minHeight: 420 }}>
                    {/* ─── CỘT TRÁI: Thông tin chuyến + Đội ngũ hiện tại ─── */}
                    <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
                        {/* Trip Info Card */}
                        <div className="border border-gray-200 rounded-xl p-4">
                            <div className="flex items-start gap-2 mb-3">
                                <MapPin className="h-4 w-4 text-brand-blue mt-0.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-gray-900">{trip.routeName}</div>
                                    {trip.routeCode && <span className="text-xs font-mono text-gray-400">{trip.routeCode}</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mb-3">
                                <div className="text-center">
                                    <div className="text-xl font-bold text-gray-900 tabular-nums leading-none">
                                        {extractTime(trip.departureTime)}
                                    </div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Xuất bến</div>
                                </div>
                                <div className="flex-1 flex items-center">
                                    <div className="h-px flex-1 bg-gray-200" />
                                    <ArrowRight className="h-3.5 w-3.5 text-gray-300 mx-1.5 shrink-0" />
                                    <div className="h-px flex-1 bg-gray-200" />
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-gray-900 tabular-nums leading-none">
                                        {extractTime(trip.arrivalTime)}
                                    </div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Đến nơi</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="border border-gray-100 rounded-lg p-2.5">
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5 flex items-center gap-1">
                                        <Bus className="h-3 w-3" />Phương tiện
                                    </div>
                                    {trip.busLicensePlate ? (
                                        <p className="font-mono font-semibold text-gray-900 text-sm">{trip.busLicensePlate}</p>
                                    ) : (
                                        <p className="text-brand-blue text-sm font-medium">Chưa gán</p>
                                    )}
                                </div>
                                <div className="border border-gray-100 rounded-lg p-2.5">
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5 flex items-center gap-1">
                                        <User className="h-3 w-3" />Tài xế chính
                                    </div>
                                    {trip.driverName ? (
                                        <p className="font-medium text-gray-900 text-sm">{trip.driverName}</p>
                                    ) : (
                                        <p className="text-brand-blue text-sm font-medium">Chưa gán</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Đội ngũ hiện tại */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <UserCheck className="h-4 w-4 text-slate-500" />
                                <h4 className="text-sm font-semibold text-slate-700">
                                    Đội ngũ hiện tại
                                </h4>
                                <span className="text-xs text-slate-400 ml-auto">
                                    {activeCrew.length} thành viên
                                </span>
                            </div>

                            {crewLoading ? (
                                <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Đang tải danh sách...</span>
                                </div>
                            ) : activeCrew.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                                    <Users className="h-8 w-8 text-slate-300 mb-2" />
                                    <p className="text-sm text-slate-400">Chưa có thành viên nào</p>
                                    {canEdit && (
                                        <p className="text-xs text-slate-300 mt-1">Sử dụng form bên phải để gán nhân sự</p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {activeCrew.map((member: CrewMember) => {
                                        const roleCfg = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.MAIN_DRIVER!;
                                        const RoleIcon = roleCfg.icon;
                                        return (
                                            <div
                                                key={member.assignmentId}
                                                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                <div className="w-9 h-9 rounded-full bg-brand-blue/10 flex items-center justify-center text-xs font-bold text-brand-blue shrink-0">
                                                    {member.fullName?.[0] || "?"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 truncate">
                                                        {member.fullName}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={cn(
                                                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                                                            roleCfg.className
                                                        )}>
                                                            <RoleIcon className="h-2.5 w-2.5" />
                                                            {roleCfg.label}
                                                        </span>
                                                        {member.phone && (
                                                            <span className="text-[10px] text-slate-400">
                                                                {member.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={cn(
                                                    "text-xs px-2 py-1 rounded-full font-medium shrink-0",
                                                    member.status === "ACTIVE"
                                                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                        : "bg-amber-50 text-amber-600 border border-amber-100"
                                                )}>
                                                    {member.status === "ACTIVE" ? "Hoạt động" : "Chờ"}
                                                </span>
                                                {canEdit && (
                                                    <button
                                                        onClick={() => {
                                                            setCancelTarget({
                                                                assignmentId: member.assignmentId,
                                                                fullName: member.fullName,
                                                            });
                                                            setCancelConfirmOpen(true);
                                                        }}
                                                        disabled={cancelMutation.isPending}
                                                        className="p-1.5 rounded-md hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                                                        title="Hủy phân công"
                                                    >
                                                        <UserMinus className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Lịch sử */}
                        {historyCrew.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <History className="h-3.5 w-3.5 text-slate-400" />
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                        Lịch sử
                                    </h4>
                                    <span className="text-[10px] text-slate-300 ml-auto">
                                        {historyCrew.length} bản ghi
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {historyCrew.map((member: CrewMember) => {
                                        const roleCfg = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.MAIN_DRIVER!;
                                        return (
                                            <div
                                                key={member.assignmentId}
                                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50/50"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                                                    {member.fullName?.[0] || "?"}
                                                </div>
                                                <span className="text-xs text-slate-500 flex-1 truncate">{member.fullName}</span>
                                                <span className="text-[10px] text-slate-400">{roleCfg.label}</span>
                                                <span className={cn(
                                                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                                    member.status === "COMPLETED"
                                                        ? "bg-slate-100 text-slate-500"
                                                        : "bg-red-50 text-red-400"
                                                )}>
                                                    {member.status === "COMPLETED" ? "Hoàn thành" : "Đã hủy"}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── CỘT PHẢI: Thêm nhân sự ─── */}
                    <div className="p-5 space-y-4 overflow-y-auto bg-gray-50/30" style={{ maxHeight: "calc(90vh - 140px)" }}>
                        {canEdit ? (
                            <>
                                <div className="flex items-center gap-2 mb-1">
                                    <UserPlus className="h-4 w-4 text-brand-blue" />
                                    <h4 className="text-sm font-semibold text-slate-700">Thêm nhân sự</h4>
                                </div>

                                {/* MAIN_DRIVER warning */}
                                {hasMainDriver && (
                                    <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                        <p className="text-xs text-amber-700">
                                            Chuyến này đã có <strong>tài xế chính</strong>. Chỉ có thể thêm tài xế phụ.
                                        </p>
                                    </div>
                                )}

                                {/* Bộ lọc */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                        <Filter className="h-3 w-3" />
                                        Bộ lọc
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                        <Input
                                            placeholder="Tìm theo tên..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-8 h-8 text-xs bg-white"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        <button
                                            onClick={() => setLicenseFilter("ALL")}
                                            className={cn(
                                                "px-2 py-1 rounded-md text-[10px] font-medium border transition-colors",
                                                licenseFilter === "ALL"
                                                    ? "bg-brand-blue text-white border-brand-blue"
                                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            Tất cả
                                        </button>
                                        {uniqueLicenseClasses.map(cls => (
                                            <button
                                                key={cls}
                                                onClick={() => setLicenseFilter(cls)}
                                                className={cn(
                                                    "px-2 py-1 rounded-md text-[10px] font-medium border transition-colors",
                                                    licenseFilter === cls
                                                        ? "bg-brand-blue text-white border-brand-blue"
                                                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                                )}
                                            >
                                                {cls}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-400">
                                        {filteredDrivers.length} nhân sự khả dụng
                                    </p>
                                </div>

                                {/* Nhân sự select */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-500">Nhân sự</label>
                                    <Select
                                        value={selectedDriverId}
                                        onValueChange={setSelectedDriverId}
                                    >
                                        <SelectTrigger className="w-full bg-white">
                                            <SelectValue placeholder={
                                                driversLoading ? "Đang tải..." : "Chọn nhân sự..."
                                            } />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredDrivers.map((d: DriverAvailable) => (
                                                <SelectItem key={d.id} value={String(d.id)}>
                                                    <span className="flex items-center gap-2">
                                                        <span>{d.fullName}</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                                                            {d.driverDetail?.licenseClass || "N/A"}
                                                        </span>
                                                    </span>
                                                </SelectItem>
                                            ))}
                                            {filteredDrivers.length === 0 && (
                                                <div className="px-3 py-2 text-xs text-slate-400 text-center">
                                                    Không tìm thấy nhân sự phù hợp
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Vai trò select */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-500">Vai trò</label>
                                    <Select
                                        value={effectiveRole}
                                        onValueChange={(v) => setSelectedRole(v as CrewRole)}
                                    >
                                        <SelectTrigger className="w-full bg-white">
                                            <SelectValue placeholder="Vai trò" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLE_OPTIONS.map(r => (
                                                <SelectItem
                                                    key={r.value}
                                                    value={r.value}
                                                    disabled={r.value === "MAIN_DRIVER" && hasMainDriver}
                                                >
                                                    {r.label} {r.value === "MAIN_DRIVER" && hasMainDriver ? "(đã có)" : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Nút thêm vào hàng chờ */}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full border-brand-blue/30 text-brand-blue hover:bg-brand-blue/5"
                                    onClick={handleAddToQueue}
                                    disabled={!selectedDriverId}
                                >
                                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                                    Thêm vào hàng chờ
                                </Button>

                                {/* Pending Queue */}
                                {pendingQueue.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-px flex-1 bg-slate-200" />
                                            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                Hàng chờ — {pendingQueue.length} nhân sự
                                            </span>
                                            <div className="h-px flex-1 bg-slate-200" />
                                        </div>

                                        <div className="space-y-1.5">
                                            {pendingQueue.map((item) => {
                                                const roleCfg = ROLE_CONFIG[item.role] ?? ROLE_CONFIG.MAIN_DRIVER!;
                                                const RoleIcon = roleCfg.icon;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center gap-2 p-2.5 bg-amber-50/50 rounded-lg border border-amber-100/60 animate-in slide-in-from-top-1 duration-200"
                                                    >
                                                        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-700 shrink-0">
                                                            {item.driverName[0]}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-800 truncate">
                                                                {item.driverName}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className={cn(
                                                                    "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium",
                                                                    roleCfg.className
                                                                )}>
                                                                    <RoleIcon className="h-2.5 w-2.5" />
                                                                    {roleCfg.label}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    GPLX: {item.licenseClass}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveFromQueue(item.id)}
                                                            className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                                                            title="Xóa khỏi hàng chờ"
                                                        >
                                                            <UserMinus className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className={cn("pt-2", pendingQueue.length > 0 ? "border-t border-slate-200" : "")}>
                                    {pendingQueue.length > 0 ? (
                                        <Button
                                            size="sm"
                                            className="w-full bg-brand-blue hover:bg-brand-blue/90 shadow-sm"
                                            onClick={handleSubmitBatch}
                                            disabled={isSubmitting}
                                        >
                                            {batchAssignMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Users className="h-4 w-4 mr-2" />
                                            )}
                                            Gán tất cả ({pendingQueue.length} nhân sự)
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full text-slate-600 border-slate-200 hover:bg-slate-50"
                                            onClick={handleDirectAssign}
                                            disabled={!selectedDriverId || isSubmitting}
                                        >
                                            {assignMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <UserPlus className="h-4 w-4 mr-2" />
                                            )}
                                            Gán nhanh 1 nhân sự
                                        </Button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <AlertCircle className="h-8 w-8 text-slate-300 mb-3" />
                                <p className="text-sm text-slate-500 font-medium">Chế độ xem</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Chuyến ở trạng thái {trip.status} không thể chỉnh sửa đội ngũ
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        <ConfirmDialog
            open={cancelConfirmOpen}
            onOpenChange={setCancelConfirmOpen}
            title="Xác nhận hủy phân công"
            description={cancelTarget ? `Hủy phân công ${cancelTarget.fullName}?` : "Hủy phân công này?"}
            confirmLabel="Hủy phân công"
            variant="danger"
            isLoading={cancelMutation.isPending}
            onConfirm={() => {
                if (!cancelTarget) return;
                cancelMutation.mutate(cancelTarget.assignmentId, {
                    onSuccess: () => {
                        setCancelConfirmOpen(false);
                        setCancelTarget(null);
                    },
                });
            }}
        />
    );
}
