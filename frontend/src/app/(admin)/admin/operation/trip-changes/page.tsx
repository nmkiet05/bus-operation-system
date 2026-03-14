"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    RefreshCw,
    Loader2,
    ShieldCheck,
    XCircle,
    Clock,
    ArrowLeftRight,
    CheckCircle2,
    AlertTriangle,
    MessageSquare,
} from "lucide-react";
import {
    TripChangeRequest,
    tripChangeService,
} from "@/features/admin/services/trip-change-service";
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
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

// Status config
const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    PENDING: {
        label: "Chờ duyệt",
        className: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Clock,
    },
    APPROVED: {
        label: "Đã duyệt",
        className: "bg-green-50 text-green-700 border-green-200",
        icon: CheckCircle2,
    },
    REJECTED: {
        label: "Từ chối",
        className: "bg-red-50 text-red-600 border-red-200",
        icon: XCircle,
    },
    CANCELLED: {
        label: "Đã hủy",
        className: "bg-gray-50 text-gray-600 border-gray-200",
        icon: XCircle,
    },
    AUTO_APPROVED: {
        label: "Tự động duyệt",
        className: "bg-blue-50 text-blue-700 border-blue-200",
        icon: ShieldCheck,
    },
    ROLLBACK: {
        label: "Đã rollback",
        className: "bg-purple-50 text-purple-700 border-purple-200",
        icon: ArrowLeftRight,
    },
};

const CHANGE_TYPE_LABELS: Record<string, string> = {
    REPLACE_DRIVER: "Đổi tài xế",
    REPLACE_BUS: "Đổi xe",
    REPLACE_BOTH: "Đổi cả hai",
    DRIVER: "Đổi tài xế",
    BUS: "Đổi xe",
};

const ZONE_CONFIG: Record<string, { label: string; className: string }> = {
    STANDARD: { label: "> 60 phút", className: "bg-blue-100 text-blue-700" },
    URGENT: { label: "15-60 phút", className: "bg-yellow-100 text-yellow-700" },
    CRITICAL: { label: "< 15 phút", className: "bg-orange-100 text-orange-700" },
    DEPARTED: { label: "Đã xuất bến", className: "bg-red-100 text-red-700" },
    MID_ROUTE: { label: "Sự cố dọc đường", className: "bg-red-100 text-red-800" },
};

const STATUS_FILTERS = [
    { value: "ALL", label: "Tất cả" },
    { value: "PENDING", label: "Chờ duyệt" },
    { value: "APPROVED", label: "Đã duyệt" },
    { value: "REJECTED", label: "Từ chối" },
];

export default function TripChangesPage() {
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectTarget, setRejectTarget] = useState<TripChangeRequest | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const queryClient = useQueryClient();

    // Fetch
    const { data: requests = [], isLoading, refetch } = useQuery({
        queryKey: ["trip-changes"],
        queryFn: () => tripChangeService.getAll(),
    });

    // Filter
    const filtered = statusFilter === "ALL"
        ? requests
        : requests.filter(r => r.status === statusFilter);

    // Mutations
    const approveMutation = useMutation({
        mutationFn: (id: number) => tripChangeService.approve(id),
        onSuccess: () => {
            toast.success("Đã duyệt yêu cầu phân công lại");
            queryClient.invalidateQueries({ queryKey: ["trip-changes"] });
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || "Lỗi duyệt yêu cầu");
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) =>
            tripChangeService.reject(id, reason),
        onSuccess: () => {
            toast.success("Đã từ chối yêu cầu");
            setRejectDialogOpen(false);
            setRejectReason("");
            queryClient.invalidateQueries({ queryKey: ["trip-changes"] });
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || "Lỗi từ chối yêu cầu");
        },
    });

    const handleApprove = (req: TripChangeRequest) => {
        if (!confirm(`Duyệt yêu cầu ${CHANGE_TYPE_LABELS[req.changeType] || req.changeType}?`)) return;
        approveMutation.mutate(req.id);
    };

    const handleRejectOpen = (req: TripChangeRequest) => {
        setRejectTarget(req);
        setRejectReason("");
        setRejectDialogOpen(true);
    };

    const handleRejectConfirm = () => {
        if (!rejectTarget || !rejectReason.trim()) {
            toast.error("Vui lòng nhập lý do từ chối");
            return;
        }
        rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason });
    };

    // Stats
    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === "PENDING").length,
        approved: requests.filter(r => r.status === "APPROVED").length,
        rejected: requests.filter(r => r.status === "REJECTED").length,
    };

    return (
        <div className="space-y-6">
            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-500" />
                            Từ chối yêu cầu
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <p className="text-sm text-gray-600">
                            Yêu cầu: <strong>{CHANGE_TYPE_LABELS[rejectTarget?.changeType || ""] || "—"}</strong>
                        </p>
                        <Textarea
                            placeholder="Nhập lý do từ chối..."
                            value={rejectReason}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejectConfirm}
                            disabled={rejectMutation.isPending || !rejectReason.trim()}
                        >
                            {rejectMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : null}
                            Từ chối
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Yêu Cầu Phân Công Lại
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Duyệt hoặc từ chối yêu cầu đổi tài xế / xe
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Tổng", value: stats.total, color: "text-gray-900" },
                    { label: "Chờ duyệt", value: stats.pending, color: "text-amber-600" },
                    { label: "Đã duyệt", value: stats.approved, color: "text-green-600" },
                    { label: "Từ chối", value: stats.rejected, color: "text-red-600" },
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
                        &nbsp;yêu cầu
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Ngày tạo</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Loại</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Vùng TG</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Lý do</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Người yêu cầu</th>
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
                                        <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-sm">Không có yêu cầu nào</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((req) => {
                                    const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
                                    const StatusIcon = statusCfg.icon;
                                    const zoneCfg = ZONE_CONFIG[req.urgencyZone];
                                    const isPending = req.status === "PENDING";

                                    return (
                                        <tr key={req.id} className={cn(
                                            "hover:bg-gray-50/50 transition-colors",
                                            isPending ? "bg-amber-50/20" : ""
                                        )}>
                                            {/* Ngày tạo */}
                                            <td className="py-3.5 px-4">
                                                <div className="text-gray-900 font-medium">
                                                    {format(new Date(req.createdAt), "dd/MM/yyyy")}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {format(new Date(req.createdAt), "HH:mm")}
                                                </div>
                                            </td>

                                            {/* Loại thay đổi */}
                                            <td className="py-3.5 px-4">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                                                    <ArrowLeftRight className="h-3 w-3" />
                                                    {CHANGE_TYPE_LABELS[req.changeType] || req.changeType}
                                                </span>
                                            </td>

                                            {/* Vùng thời gian */}
                                            <td className="py-3.5 px-4">
                                                {zoneCfg ? (
                                                    <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium", zoneCfg.className)}>
                                                        <AlertTriangle className="h-3 w-3" />
                                                        {zoneCfg.label}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>

                                            {/* Lý do */}
                                            <td className="py-3.5 px-4 max-w-[200px]">
                                                <p className="text-gray-700 text-xs truncate" title={req.requestReason}>
                                                    {req.requestReason || "—"}
                                                </p>
                                                {req.rejectedReason && (
                                                    <p className="text-red-500 text-xs mt-0.5 truncate flex items-center gap-1" title={req.rejectedReason}>
                                                        <MessageSquare className="h-3 w-3 shrink-0" />
                                                        {req.rejectedReason}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Người yêu cầu */}
                                            <td className="py-3.5 px-4">
                                                <span className="text-gray-700 font-medium text-xs">
                                                    {req.createdBy ? `User #${req.createdBy}` : "—"}
                                                </span>
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
                                                {isPending ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleApprove(req)}
                                                            disabled={approveMutation.isPending}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                                                        >
                                                            <ShieldCheck className="h-3 w-3" />
                                                            Duyệt
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectOpen(req)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                        >
                                                            <XCircle className="h-3 w-3" />
                                                            Từ chối
                                                        </button>
                                                    </div>
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
