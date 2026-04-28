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
    RotateCcw,
    User2,
    Bus as BusIcon
} from "lucide-react";
import {
    TripChangeRequest,
    tripChangeService,
} from "@/features/admin/services/trip-change-service";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { tripService } from "@/features/admin/services/trip-service";
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
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { AdminDatePicker } from "@/features/admin/components/AdminDatePicker";
import { useAuth } from "@/providers/auth-provider";

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
    ESCALATED: {
        label: "Đã escalate",
        className: "bg-orange-50 text-orange-700 border-orange-200",
        icon: AlertTriangle,
    },
    REJECTED: {
        label: "Từ chối",
        className: "bg-red-50 text-red-600 border-red-200",
        icon: XCircle,
    },
    CANCELLED: {
        label: "Đã hoàn tác",
        className: "bg-slate-50 text-slate-500 border-slate-200",
        icon: RotateCcw,
    },
};

const CHANGE_TYPE_LABELS: Record<string, string> = {
    REPLACE_DRIVER: "Đổi tài xế",
    REPLACE_CO_DRIVER: "Đổi tài xế phụ",
    REPLACE_ATTENDANT: "Đổi nhân viên phục vụ",
    REPLACE_BUS: "Đổi xe",
    INCIDENT_SWAP: "Sự cố dọc đường",
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
    { value: "ESCALATED", label: "Đã escalate" },
    { value: "APPROVED", label: "Đã duyệt" },
    { value: "REJECTED", label: "Từ chối" },
    { value: "CANCELLED", label: "Đã hoàn tác" },
];

const INCIDENT_TYPE_OPTIONS = [
    { value: "FATIGUE_SWAP", label: "Tài xế mệt mỏi — cần thay ca (TT09/2015)" },
    { value: "DRIVER_HEALTH", label: "Tài xế có vấn đề sức khỏe đột xuất" },
    { value: "VEHICLE_BREAKDOWN", label: "Phương tiện hư hỏng / không đảm bảo ATKT" },
    { value: "TRAFFIC_ACCIDENT", label: "Tai nạn giao thông — cần ứng cứu" },
];

export default function TripChangesPage() {
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectTarget, setRejectTarget] = useState<TripChangeRequest | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    // Review Dialog (thay thế prompt())
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [reviewTarget, setReviewTarget] = useState<TripChangeRequest | null>(null);
    const [reviewApproved, setReviewApproved] = useState(true);
    const [reviewNotes, setReviewNotes] = useState("");
    // Confirm Dialog cho Approve & Rollback (thay thế confirm())
    const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
    const [approveTarget, setApproveTarget] = useState<TripChangeRequest | null>(null);
    const [rollbackConfirmOpen, setRollbackConfirmOpen] = useState(false);
    const [rollbackTarget, setRollbackTarget] = useState<TripChangeRequest | null>(null);
    const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
    const [incidentTripId, setIncidentTripId] = useState<number | null>(null);
    const [incidentDate, setIncidentDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [incidentCrewRole, setIncidentCrewRole] = useState<"REPLACE_DRIVER" | "REPLACE_CO_DRIVER">("REPLACE_DRIVER");
    const [incidentDriverId, setIncidentDriverId] = useState<number | null>(null);
    const [incidentType, setIncidentType] = useState("FATIGUE_SWAP");
    const [incidentGps, setIncidentGps] = useState("");
    const [incidentReason, setIncidentReason] = useState("");

    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();

    // Fetch
    const { data: requests = [], isLoading, refetch } = useQuery({
        queryKey: ["trip-changes"],
        queryFn: () => tripChangeService.getAll(),
    });

    const { data: runningTrips = [], isLoading: isLoadingRunningTrips } = useQuery({
        queryKey: ["incident-running-trips", incidentDate],
        queryFn: () => tripService.getTrips({ status: "RUNNING", fromDate: incidentDate, toDate: incidentDate }),
    });

    const { data: incidentDrivers = [], isLoading: isLoadingIncidentDrivers } = useQuery({
        queryKey: ["incident-available-drivers", incidentTripId],
        queryFn: () => tripService.getAvailableDriversForTrip(incidentTripId!),
        enabled: !!incidentTripId,
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

    const reviewMutation = useMutation({
        mutationFn: ({ id, approved, notes }: { id: number; approved: boolean; notes?: string }) =>
            tripChangeService.review(id, approved, notes),
        onSuccess: (_data, vars) => {
            toast.success(vars.approved ? "Đã hậu kiểm: đạt" : "Đã hậu kiểm: không đạt");
            setReviewDialogOpen(false);
            setReviewNotes("");
            setReviewTarget(null);
            queryClient.invalidateQueries({ queryKey: ["trip-changes"] });
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || "Lỗi hậu kiểm yêu cầu");
        },
    });

    const rollbackMutation = useMutation({
        mutationFn: (id: number) => tripChangeService.rollback(id),
        onSuccess: () => {
            toast.success("Đã hoàn tác yêu cầu");
            queryClient.invalidateQueries({ queryKey: ["trip-changes"] });
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || "Lỗi hoàn tác yêu cầu");
        },
    });

    const incidentMutation = useMutation({
        mutationFn: (payload: {
            tripId: number;
            changeType: "REPLACE_DRIVER" | "REPLACE_CO_DRIVER";
            newDriverId: number;
            incidentType: "FATIGUE_SWAP" | "DRIVER_HEALTH" | "VEHICLE_BREAKDOWN" | "TRAFFIC_ACCIDENT";
            incidentGps?: string;
            reason: string;
        }) =>
            tripChangeService.incident(
                {
                    tripId: payload.tripId,
                    changeType: payload.changeType,
                    reason: payload.reason,
                    newDriverId: payload.newDriverId,
                },
                payload.incidentType,
                payload.incidentGps
            ),
        onSuccess: () => {
            toast.success("Đã tạo sự cố dọc đường và gửi hậu kiểm");
            setIncidentDialogOpen(false);
            setIncidentTripId(null);
            setIncidentCrewRole("REPLACE_DRIVER");
            setIncidentDate(new Date().toISOString().split("T")[0]);
            setIncidentDriverId(null);
            setIncidentType("FATIGUE_SWAP");
            setIncidentGps("");
            setIncidentReason("");
            queryClient.invalidateQueries({ queryKey: ["trip-changes"] });
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || "Lỗi báo sự cố dọc đường");
        },
    });

    const resetAntiSpamMutation = useMutation({
        mutationFn: (userId: number) => tripChangeService.resetAntiSpam(userId),
        onSuccess: () => {
            toast.success("Đã reset giới hạn gửi yêu cầu (Anti-spam) cho bạn");
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || "Lỗi reset Anti-spam");
        },
    });

    const handleApprove = (req: TripChangeRequest) => {
        setApproveTarget(req);
        setApproveConfirmOpen(true);
    };

    const handleRejectOpen = (req: TripChangeRequest) => {
        const rejectableZones = ["STANDARD", "URGENT", "CRITICAL"];
        if (req.urgencyZone && !rejectableZones.includes(req.urgencyZone)) {
            toast.error(`Vùng ${req.urgencyZone} không cho phép từ chối. Vui lòng dùng hậu kiểm.`);
            return;
        }
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

    const handleReviewOpen = (req: TripChangeRequest, approved: boolean) => {
        setReviewTarget(req);
        setReviewApproved(approved);
        setReviewNotes("");
        setReviewDialogOpen(true);
    };

    const handleReviewConfirm = () => {
        if (!reviewTarget) return;
        if (!reviewApproved && !reviewNotes.trim()) {
            toast.error("Vui lòng nhập lý do hậu kiểm không đạt");
            return;
        }
        reviewMutation.mutate({
            id: reviewTarget.id,
            approved: reviewApproved,
            notes: reviewNotes.trim() || undefined,
        });
    };

    const handleRollback = (req: TripChangeRequest) => {
        setRollbackTarget(req);
        setRollbackConfirmOpen(true);
    };

    const handleSubmitIncident = () => {
        if (!incidentTripId || !incidentDriverId || !incidentReason.trim()) {
            toast.error("Vui lòng chọn chuyến, tài xế thay thế và nhập lý do sự cố");
            return;
        }

        incidentMutation.mutate({
            tripId: incidentTripId,
            changeType: incidentCrewRole,
            newDriverId: incidentDriverId,
            incidentType: incidentType as "FATIGUE_SWAP" | "DRIVER_HEALTH" | "VEHICLE_BREAKDOWN" | "TRAFFIC_ACCIDENT",
            incidentGps: incidentGps.trim() || undefined,
            reason: incidentReason.trim(),
        });
    };

    // Stats
    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === "PENDING").length,
        escalated: requests.filter(r => r.status === "ESCALATED").length,
        approved: requests.filter(r => r.status === "APPROVED").length,
        rejected: requests.filter(r => r.status === "REJECTED").length,
    };

    return (
        <div className="space-y-6">
            {/* Approve Confirm Dialog */}
            <ConfirmDialog
                open={approveConfirmOpen}
                onOpenChange={setApproveConfirmOpen}
                title="Duyệt yêu cầu phân công lại"
                description={`Duyệt yêu cầu "${CHANGE_TYPE_LABELS[approveTarget?.changeType || ""] || "—"}"? Thao tác sẽ thực thi ngay và không thể hoàn tác trực tiếp.`}
                confirmLabel="Duyệt"
                variant="info"
                isLoading={approveMutation.isPending}
                onConfirm={() => {
                    if (approveTarget) approveMutation.mutate(approveTarget.id);
                    setApproveConfirmOpen(false);
                }}
            />
            {/* Rollback Confirm Dialog */}
            <ConfirmDialog
                open={rollbackConfirmOpen}
                onOpenChange={setRollbackConfirmOpen}
                title="Hoàn tác yêu cầu"
                description={`Hoàn tác yêu cầu "${CHANGE_TYPE_LABELS[rollbackTarget?.changeType || ""] || "—"}"? Hệ thống sẽ khôi phục tài xế/xe cũ cho chuyến.`}
                confirmLabel="Hoàn tác"
                variant="warning"
                isLoading={rollbackMutation.isPending}
                onConfirm={() => {
                    if (rollbackTarget) rollbackMutation.mutate(rollbackTarget.id);
                    setRollbackConfirmOpen(false);
                }}
            />
            {/* Review Dialog */}
            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {reviewApproved ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            {reviewApproved ? "Hậu kiểm đạt" : "Hậu kiểm không đạt"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <p className="text-sm text-gray-600">
                            Yêu cầu: <strong>{CHANGE_TYPE_LABELS[reviewTarget?.changeType || ""] || "—"}</strong>
                            {" — "}
                            <span className="text-xs text-gray-400">{reviewTarget?.urgencyZone}</span>
                        </p>
                        <Textarea
                            placeholder={reviewApproved ? "Ghi chú hậu kiểm (không bắt buộc)..." : "Nhập lý do hậu kiểm không đạt (bắt buộc)..."}
                            value={reviewNotes}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewNotes(e.target.value)}
                            rows={3}
                        />
                        {!reviewApproved && (
                            <p className="text-xs text-red-500">Lý do bắt buộc khi hậu kiểm không đạt.</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            variant={reviewApproved ? "default" : "destructive"}
                            onClick={handleReviewConfirm}
                            disabled={reviewMutation.isPending || (!reviewApproved && !reviewNotes.trim())}
                        >
                            {reviewMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : null}
                            {reviewApproved ? "Xác nhận đạt" : "Xác nhận không đạt"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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

            {/* Incident Dialog */}
            <Dialog open={incidentDialogOpen} onOpenChange={setIncidentDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            Biên bản sự cố dọc đường
                        </DialogTitle>
                        <p className="text-xs text-gray-500">Vùng MID_ROUTE — Hệ thống tự động thực thi, chờ hậu kiểm</p>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
                        <div className="space-y-1.5 sm:col-span-2">
                            <p className="text-xs font-medium text-gray-600">Ngày chạy <span className="text-red-500">*</span></p>
                            <AdminDatePicker
                                value={incidentDate ? new Date(incidentDate) : new Date()}
                                onChange={(date) => {
                                    if (date) {
                                        setIncidentDate(format(date, "yyyy-MM-dd"));
                                    } else {
                                        setIncidentDate("");
                                    }
                                    setIncidentTripId(null);
                                    setIncidentDriverId(null);
                                }}
                                allowPastDates={true}
                                className="w-full bg-white h-10 border-input text-gray-900 border"
                            />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <p className="text-xs font-medium text-gray-600">Chuyến xe đang vận hành <span className="text-red-500">*</span></p>
                            <Select
                                value={incidentTripId ? String(incidentTripId) : undefined}
                                onValueChange={(value) => {
                                    const nextTripId = Number(value);
                                    setIncidentTripId(nextTripId);
                                    setIncidentDriverId(null);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingRunningTrips ? "Đang tải..." : "— Chọn chuyến đang chạy —"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {runningTrips.map((trip) => (
                                        <SelectItem key={trip.id} value={String(trip.id)}>
                                            {trip.code} — {trip.routeName} ({trip.busLicensePlate || "Chưa gán xe"})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {incidentTripId && (
                            <div className="sm:col-span-2 bg-slate-50 border rounded-md p-3 mb-1">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Thông tin chuyến gặp sự cố</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Nhân sự gặp sự cố <span className="text-red-500">*</span></p>
                                        <Select value={incidentCrewRole} onValueChange={(v: "REPLACE_DRIVER" | "REPLACE_CO_DRIVER") => setIncidentCrewRole(v)}>
                                            <SelectTrigger className="bg-white h-8 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(() => {
                                                    const trip = runningTrips.find(t => t.id === incidentTripId);
                                                    if (trip?.crew && trip.crew.length > 0) {
                                                        return trip.crew.map(c => {
                                                            const chgType = c.role === "MAIN_DRIVER" ? "REPLACE_DRIVER" : "REPLACE_CO_DRIVER";
                                                            const roleName = c.role === "MAIN_DRIVER" ? "Tài xế chính" : "Tài xế phụ";
                                                            return <SelectItem key={c.userId} value={chgType}>{roleName}: {c.fullName}</SelectItem>;
                                                        });
                                                    }
                                                    return <SelectItem value="REPLACE_DRIVER">Tài xế chính: {trip?.driverName || "Chưa rõ"}</SelectItem>;
                                                })()}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="border-l pl-4 border-gray-200">
                                        <p className="text-xs text-gray-500 mb-1">Phương tiện</p>
                                        <p className="text-sm font-semibold text-gray-900 mt-1.5 flex items-center h-8">
                                            {runningTrips.find(t => t.id === incidentTripId)?.busLicensePlate || "Chưa rõ xe"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="space-y-1.5 sm:col-span-2">
                            <p className="text-xs font-medium text-gray-600">Phân loại sự cố <span className="text-red-500">*</span></p>
                            <Select value={incidentType} onValueChange={setIncidentType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="— Chọn loại sự cố —" />
                                </SelectTrigger>
                                <SelectContent>
                                    {INCIDENT_TYPE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <p className="text-xs font-medium text-gray-600">Tài xế thay thế <span className="text-red-500">*</span></p>
                            <Select
                                value={incidentDriverId ? String(incidentDriverId) : undefined}
                                onValueChange={(value) => setIncidentDriverId(Number(value))}
                                disabled={!incidentTripId || isLoadingIncidentDrivers}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={!incidentTripId
                                            ? "Chọn chuyến trước"
                                            : isLoadingIncidentDrivers
                                                ? "Đang tải danh sách..."
                                                : "— Chọn tài xế khả dụng —"}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {incidentDrivers.map((driver) => (
                                        <SelectItem key={driver.id} value={String(driver.id)}>
                                            {driver.fullName} — {driver.phone || "N/A"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <p className="text-xs font-medium text-gray-600">Tọa độ GPS xảy ra sự cố</p>
                            <Input
                                placeholder="VD: 10.0365, 105.7838 (Quốc lộ 1A, Cần Thơ)"
                                value={incidentGps}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIncidentGps(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <p className="text-xs font-medium text-gray-600">Mô tả diễn biến sự cố <span className="text-red-500">*</span></p>
                            <Textarea
                                placeholder="Mô tả chi tiết: Thời điểm, vị trí, tình trạng tài xế/xe, biện pháp xử lý tại chỗ..."
                                rows={3}
                                value={incidentReason}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setIncidentReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIncidentDialogOpen(false)}>
                            Hủy bỏ
                        </Button>
                        <Button
                            onClick={handleSubmitIncident}
                            disabled={incidentMutation.isPending}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            {incidentMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : null}
                            Xác nhận & Gửi biên bản
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
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => currentUser?.id && resetAntiSpamMutation.mutate(currentUser.id)}
                        disabled={resetAntiSpamMutation.isPending}
                        className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 h-[42px]"
                    >
                        {resetAntiSpamMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2 text-indigo-500" />
                        )}
                        Reset Cooldown
                    </Button>
                    <Button
                        onClick={() => setIncidentDialogOpen(true)}
                        className="bg-orange-600 hover:bg-orange-700 text-white h-[42px]"
                    >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Lập biên bản sự cố
                    </Button>
                    <button
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 h-[42px]"
                    >
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Tổng", value: stats.total, color: "text-gray-900" },
                    { label: "Chờ duyệt", value: stats.pending, color: "text-amber-600" },
                    { label: "Đã escalate", value: stats.escalated, color: "text-orange-600" },
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
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Loại thay đổi</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Nội dung</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Vùng TG</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Lý do</th>
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
                                    const isCancelled = req.status === "CANCELLED";
                                    const isPending = req.status === "PENDING";
                                    const isApproved = req.status === "APPROVED";
                                    const isAutoExecuteZone = ["CRITICAL", "DEPARTED", "MID_ROUTE"].includes(req.urgencyZone);
                                    const isEmergencyReviewCandidate = Boolean(req.isEmergency) && (isPending || req.status === "ESCALATED");
                                    const canReviewReject = req.urgencyZone === "CRITICAL";

                                    return (
                                        <tr key={req.id} className={cn(
                                            "hover:bg-gray-50/50 transition-all duration-200 border-l-4",
                                            isPending && "bg-amber-50/30 border-l-amber-300",
                                            isApproved && "bg-green-50/10 border-l-green-300",
                                            isCancelled && "bg-purple-50/40 border-l-purple-400 opacity-75",
                                            !isPending && !isApproved && !isCancelled && "border-l-transparent"
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
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                                    {req.changeType === "REPLACE_BUS" ? <BusIcon className="h-3 w-3" /> : <User2 className="h-3 w-3" />}
                                                    {CHANGE_TYPE_LABELS[req.changeType] || req.changeType}
                                                </span>
                                            </td>

                                            {/* Nội dung thay đổi */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-400 line-through truncate max-w-[100px]">
                                                            {req.changeType === "REPLACE_BUS" ? req.licensePlate : (req.oldDriverName || "Chưa có")}
                                                        </span>
                                                        <span className="text-blue-600 font-semibold truncate max-w-[100px]">
                                                            {req.changeType === "REPLACE_BUS" ? "Xe mới" : (req.newDriverName || "Chưa chọn")}
                                                        </span>
                                                    </div>
                                                    {isCancelled && (
                                                        <div className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100 flex items-center gap-1">
                                                            <RotateCcw className="h-2.5 w-2.5" />
                                                            Đã lùi
                                                        </div>
                                                    )}
                                                </div>
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
                                                <span className="text-gray-700 font-medium text-xs block">
                                                    {req.createdBy ? `Admin #${req.createdBy}` : "Hệ thống"}
                                                </span>
                                                <span className="text-[10px] text-gray-400 uppercase">
                                                    {req.routeName || "—"}
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
                                                {isEmergencyReviewCandidate ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleReviewOpen(req, true)}
                                                            disabled={reviewMutation.isPending}
                                                            title="Xác nhận thao tác đã thực hiện đúng nghiệp vụ"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Hậu kiểm đạt
                                                        </button>
                                                        {canReviewReject && (
                                                            <button
                                                                onClick={() => handleReviewOpen(req, false)}
                                                                disabled={reviewMutation.isPending}
                                                                title="Ghi nhận thao tác không đạt chuẩn (chỉ áp dụng Vùng CRITICAL)"
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                                                            >
                                                                <XCircle className="h-3 w-3" />
                                                                Hậu kiểm không đạt
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : isPending ? (
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
                                                            disabled={isAutoExecuteZone || rejectMutation.isPending}
                                                            title={isAutoExecuteZone ? `Vùng ${req.urgencyZone} không cho phép từ chối. Dùng Hậu kiểm.` : "Từ chối yêu cầu này"}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            <XCircle className="h-3 w-3" />
                                                            Từ chối
                                                        </button>
                                                    </div>
                                                ) : isApproved ? (
                                                    <div className="flex items-center justify-center">
                                                        <button
                                                            onClick={() => handleRollback(req)}
                                                            disabled={rollbackMutation.isPending}
                                                            title="Hoàn tác thay đổi này — khôi phục nhân sự gốc ban đầu"
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200 hover:border-purple-300 transition-colors disabled:opacity-50 shadow-sm"
                                                        >
                                                            <RotateCcw className="h-3.5 w-3.5" />
                                                            Hoàn tác
                                                        </button>
                                                    </div>
                                                ) : isCancelled ? (
                                                    <div className="flex items-center justify-center">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-600 border border-purple-200">
                                                            <RotateCcw className="h-3 w-3" />
                                                            Đã hoàn tác
                                                        </span>
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
