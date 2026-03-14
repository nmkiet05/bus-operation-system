"use client";

import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    RefreshCw,
    Loader2,
    Plus,
    Bus,
    AlertCircle,
    CheckCircle2,
    Clock,
    ArrowRight,
    LogIn,
    LogOut,
    XCircle,
    ChevronDown,
    ChevronRight,
    MapPin,
    Trash2,
    Pencil,
    X,
} from "lucide-react";
import { BusAssignment, BusAssignmentTripSummary, Trip } from "@/features/admin/types";
import {
    busAssignmentService,
    CreateBusAssignmentRequest,
    UpdateBusAssignmentRequest,
} from "@/features/admin/services/bus-assignment-service";
import { tripService } from "@/features/admin/services/trip-service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminDatePicker } from "@/features/admin/components/AdminDatePicker";
import { SearchableSelect, SearchableSelectOption } from "@/features/admin/components/SearchableSelect";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Status config
const ASSIGNMENT_STATUS: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    PENDING: {
        label: "Chưa xuất bãi",
        className: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: Clock,
    },
    SCHEDULED: {
        label: "Chưa xuất bãi",
        className: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: Clock,
    },
    CHECKED_IN: {
        label: "Xe đang chạy",
        className: "bg-blue-50 text-blue-700 border-blue-200",
        icon: LogIn,
    },
    CHECKED_OUT: {
        label: "Đã nhập bãi",
        className: "bg-green-50 text-green-700 border-green-200",
        icon: LogOut,
    },
    ENDED_EARLY: {
        label: "Kết thúc sớm",
        className: "bg-red-50 text-red-600 border-red-200",
        icon: XCircle,
    },
    COMPLETED: {
        label: "Hoàn thành",
        className: "bg-gray-50 text-gray-600 border-gray-200",
        icon: CheckCircle2,
    },
};

export default function BusSchedulePage() {
    const [selectedDate, setSelectedDate] = useState(() => {
        return new Date().toISOString().split("T")[0];
    });
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // Create Dialog
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        busId: "",
        startDate: new Date().toISOString().split("T")[0],
        startTime: "",
        endDate: new Date().toISOString().split("T")[0],
        endTime: "",
        notes: "",
    });
    const [selectedCreateTrips, setSelectedCreateTrips] = useState<Trip[]>([]);
    const [busTypeFilter, setBusTypeFilter] = useState(""); // filter Bus by Type
    const [depotFilter, setDepotFilter] = useState(""); // filter Bus by Depot (xe)
    // Lọc chuyến riêng cho form Tạo (tách biệt với form Cập Nhật)
    const [createDepFilter, setCreateDepFilter] = useState("");
    const [createArrFilter, setCreateArrFilter] = useState("");

    // Update (Edit) Dialog — replaces old Assign Trip Dialog
    const [assignOpen, setAssignOpen] = useState(false);
    const [assignTarget, setAssignTarget] = useState<BusAssignment | null>(null);
    const [depFilter, setDepFilter] = useState(""); // lọc bến xuất phát (form Cập Nhật)
    const [arrFilter, setArrFilter] = useState(""); // lọc bến kết thúc (form Cập Nhật)
    // Pending trips: trip được chọn ở FE, chưa gán API — chỉ commit khi nhấn "Lưu thay đổi"
    const [pendingEditTrips, setPendingEditTrips] = useState<Trip[]>([]);
    const [editForm, setEditForm] = useState({
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        notes: "",
    });

    // Check-in/out Dialog
    const [checkDialogOpen, setCheckDialogOpen] = useState(false);
    const [checkType, setCheckType] = useState<"in" | "out">("in");
    const [checkTarget, setCheckTarget] = useState<BusAssignment | null>(null);
    const [checkForm, setCheckForm] = useState({ odometer: "", fuelLevel: "", notes: "", depotId: "" });
    const [endEarlyConfirmOpen, setEndEarlyConfirmOpen] = useState(false);
    const [endEarlyConfirm, setEndEarlyConfirm] = useState<{ id: number; message: string } | null>(null);

    const queryClient = useQueryClient();

    // Fetch Bus Assignments
    const { data: assignments = [], isLoading, refetch } = useQuery({
        queryKey: ["bus-assignments", selectedDate],
        queryFn: () => busAssignmentService.list(selectedDate),
    });

    // Fetch available buses for creation
    const { data: availableBuses = [] } = useQuery({
        queryKey: ["fleet-buses-select"],
        queryFn: async () => {
            const { data } = await (await import("@/services/http/axios")).default.get(
                "/fleet/buses", { params: { status: "ACTIVE" } }
            );
            return data.result || [];
        },
    });

    // Fetch unassigned SCHEDULED trips for assigning
    const { data: unassignedTrips = [] } = useQuery({
        queryKey: ["unassigned-trips", selectedDate],
        queryFn: () => tripService.getTrips({
            fromDate: selectedDate,
            toDate: selectedDate,
            status: "SCHEDULED",
        }),
        enabled: assignOpen || createOpen,
    });

    // Fetch danh sách bãi đỗ xe (depot)
    const { data: depots = [] } = useQuery({
        queryKey: ["depots"],
        queryFn: async () => {
            const { data } = await (await import("@/services/http/axios")).default.get(
                "/depots"
            );
            return data.result || [];
        },
        enabled: checkDialogOpen || createOpen,
    });

    // ── Parse friendly error message ──
    const parseFriendlyError = (error: unknown, fallback: string): string => {
        const err = error as { response?: { status?: number; data?: { message?: string; rootCause?: string } } };
        const status = err?.response?.status;
        const raw = err?.response?.data?.message || err?.response?.data?.rootCause || "";

        // HTTP 409 Conflict (Optimistic Lock / Trùng ca xe) — message từ BE đã thân thiện
        if (status === 409 && raw) return raw;

        // Trích xuất thông điệp PL/pgSQL từ Root Cause
        const pgMatch = raw.match(/ERROR:\s*(.+?)(?:\.|$|\s*Where:)/i);
        if (pgMatch) return pgMatch[1].trim();
        // Nếu message quá dài hoặc chứa stack trace → dùng fallback
        if (raw.length > 100 || raw.includes("Exception") || raw.includes("PL/pgSQL")) return fallback;
        return raw || fallback;
    };


    // Mutations
    const createMutation = useMutation({
        mutationFn: (req: CreateBusAssignmentRequest) => busAssignmentService.create(req),
        onSuccess: () => {
            // Backend đã xử lý trip assignment nguyên tử — chỉ cần đóng form và refresh
            toast.success("Đã tạo ca xe và gán chuyến thành công!", { duration: 2500 });
            setCreateOpen(false);
            setCreateForm({ busId: "", startDate: new Date().toISOString().split("T")[0], startTime: "", endDate: new Date().toISOString().split("T")[0], endTime: "", notes: "" });
            setSelectedCreateTrips([]);
            setCreateDepFilter("");
            setCreateArrFilter("");
            queryClient.invalidateQueries({ queryKey: ["bus-assignments"] });
            queryClient.invalidateQueries({ queryKey: ["unassigned-trips"] });
        },
        onError: (error: unknown) => {
            // Backend trả lỗi (overlap, trip đã gán, xe hỏng...) — form giữ nguyên
            toast.error(parseFriendlyError(error, "Lỗi tạo ca xe"), { duration: 6000 });
        },
    });

    const unassignTripMutation = useMutation({
        mutationFn: ({ assignmentId, tripId }: { assignmentId: number; tripId: number }) =>
            busAssignmentService.unassignTrip(assignmentId, tripId),
        onMutate: ({ tripId }) => {
            // Kiểm tra trước: nếu đây là trip cuối cùng
            const currentTrips = assignTarget?.trips || [];
            const scheduledTrips = currentTrips.filter(t => t.status === "SCHEDULED");
            if (scheduledTrips.length === 1 && scheduledTrips[0].id === tripId) {
                // Cho phép gỡ nếu có trip thay thế đang pending
                if (pendingEditTrips.length > 0) {
                    // OK — có trip thay thế, cho phép gỡ
                    return;
                }
                toast.error(
                    "Không thể gỡ chuyến cuối cùng khi chưa có chuyến thay thế. Hãy chọn chuyến mới trước hoặc dùng \"Hủy ca xe\".",
                    { duration: 5000 }
                );
                throw new Error("BLOCKED_LAST_TRIP");
            }
        },
        onSuccess: (data) => {
            toast.success("Đã gỡ chuyến!", { duration: 1500 });
            setAssignTarget(data);
            queryClient.invalidateQueries({ queryKey: ["bus-assignments"] });
            queryClient.invalidateQueries({ queryKey: ["unassigned-trips"] });
        },
        onError: (error: unknown) => {
            if ((error as Error).message === "BLOCKED_LAST_TRIP") return; // đã toast rồi
            toast.error(parseFriendlyError(error, "Lỗi gỡ chuyến"));
        },
    });

    const checkMutation = useMutation({
        mutationFn: async ({ id, type, odometer, fuelLevel, notes, depotId }: {
            id: number; type: "in" | "out"; odometer: number; fuelLevel: number; notes?: string; depotId?: number;
        }) => {
            // TODO: Replace with real userId from auth context
            const byUserId = 1;
            if (type === "in") {
                await busAssignmentService.checkIn(id, odometer, fuelLevel, byUserId, notes, depotId || undefined);
            } else {
                await busAssignmentService.checkOut(id, odometer, fuelLevel, byUserId, notes, depotId || undefined);
            }
        },
        onSuccess: () => {
            toast.success(checkType === "in" ? "Xe đã xuất bãi thành công!" : "Xe đã nhập bãi thành công!");
            setCheckDialogOpen(false);
            setCheckForm({ odometer: "", fuelLevel: "", notes: "", depotId: "" });
            queryClient.invalidateQueries({ queryKey: ["bus-assignments"] });
        },
        onError: (error: unknown) => {
            toast.error(parseFriendlyError(error, "Lỗi check-in/out"));
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, request }: { id: number; request: UpdateBusAssignmentRequest }) =>
            busAssignmentService.update(id, request),
        onSuccess: (data) => {
            // Không toast ở đây — handleUpdate sẽ toast sau khi biết kết quả from trip assignment
            setAssignTarget(data);
        },
        onError: (error: unknown) => {
            toast.error(parseFriendlyError(error, "Lỗi cập nhật ca xe"));
        },
    });

    const endEarlyMutation = useMutation({
        mutationFn: (id: number) => busAssignmentService.endEarly(id),
        onSuccess: () => {
            toast.success("Đã kết thúc ca xe sớm!");
            queryClient.invalidateQueries({ queryKey: ["bus-assignments"] });
        },
        onError: (error: unknown) => {
            toast.error(parseFriendlyError(error, "Lỗi kết thúc sớm"));
        },
    });

    // Handlers
    const handleCreate = () => {
        if (!createForm.busId) { toast.error("Vui lòng chọn xe"); return; }
        if (!createForm.startTime) { toast.error("Vui lòng chọn giờ xuất bãi"); return; }
        if (!createForm.endTime) { toast.error("Vui lòng chọn giờ nhập bãi"); return; }
        // Ca xe bắt buộc phải có ít nhất 1 chuyến
        if (selectedCreateTrips.length === 0) {
            toast.error("Ca xe phải có ít nhất 1 chuyến được gán");
            return;
        }
        // Guard: chặn nếu trips trùng lịch nhau
        if (createOverlapError) {
            toast.error(`Không thể tạo ca xe: ${createOverlapError}`, { duration: 5000 });
            return;
        }
        // Guard: chặn nếu ca xe overlap với ca xe khác cùng xe
        if (createBusOverlapWarning) {
            toast.error(`Không thể tạo: ${createBusOverlapWarning}`, { duration: 5000 });
            return;
        }
        // Guard: chặn nếu ca xuất/nhập cấn vào time chuyến
        if (createTripsBoundError) {
            toast.error(createTripsBoundError, { duration: 5000 });
            return;
        }
        const scheduledStart = `${createForm.startDate}T${createForm.startTime}:00`;
        const scheduledEnd = `${createForm.endDate}T${createForm.endTime}:00`;
        if (scheduledEnd <= scheduledStart) {
            toast.error("Giờ nhập bãi phải sau giờ xuất bãi");
            return;
        }
        // Gửi tripIds cùng request — backend xử lý nguyên tử trong 1 transaction
        createMutation.mutate({
            busId: Number(createForm.busId),
            scheduledStart,
            scheduledEnd,
            notes: createForm.notes || undefined,
            tripIds: selectedCreateTrips.map(t => t.id),
        });
    };

    // Kiểm tra overlap thời gian giữa trip mới và danh sách trip đã có (FE-side)
    const checkTripOverlap = (newTrip: Trip, existingTrips: Trip[]): string | null => {
        const newStart = newTrip.departureTime ? new Date(newTrip.departureTime).getTime() : null;
        const newEnd = newTrip.arrivalTime ? new Date(newTrip.arrivalTime).getTime() : null;
        if (!newStart || !newEnd) return null;
        for (const t of existingTrips) {
            const tStart = t.departureTime ? new Date(t.departureTime).getTime() : null;
            const tEnd = t.arrivalTime ? new Date(t.arrivalTime).getTime() : null;
            if (!tStart || !tEnd) continue;
            // Overlap: newStart < tEnd && newEnd > tStart
            if (newStart < tEnd && newEnd > tStart) {
                return `Chuyến ${newTrip.routeCode || newTrip.id} trùng lịch với chuyến ${t.routeCode || t.id} (${extractTime(t.departureTime)} – ${extractTime(t.arrivalTime)})`;
            }
        }
        return null;
    };

    // Gán tuần tự — trả về true nếu CÓ lỗi (để caller quyết định đóng form hay không)
    const assignTripsSequentially = async (assignmentId: number, trips: Trip[]): Promise<boolean> => {
        const errors: string[] = [];
        let successCount = 0;
        for (const trip of trips) {
            try {
                await busAssignmentService.assignTrip(assignmentId, trip.id);
                successCount++;
            } catch (error: unknown) {
                errors.push(parseFriendlyError(error, `Chuyến ${trip.routeCode || trip.id} lỗi gán`));
            }
        }
        if (successCount > 0) {
            queryClient.invalidateQueries({ queryKey: ["bus-assignments"] });
            queryClient.invalidateQueries({ queryKey: ["unassigned-trips"] });
        }
        if (errors.length > 0) {
            toast.error(
                `${errors.length} chuyến không thể gán:\n` + errors.slice(0, 3).join("\n") + (errors.length > 3 ? `\n... và ${errors.length - 3} lỗi khác` : ""),
                { duration: 6000 }
            );
            return true; // có lỗi
        } else if (successCount > 0 && trips.length > 1) {
            toast.success(`Đã gán ${successCount} chuyến thành công!`, { duration: 2500 });
        }
        return false; // không có lỗi
    };

    // Realtime overlap check: kiểm tra tất cả cặp trip trong danh sách đã chọn
    const detectOverlapInList = (trips: Trip[]): string | null => {
        for (let i = 0; i < trips.length; i++) {
            for (let j = i + 1; j < trips.length; j++) {
                const msg = checkTripOverlap(trips[i], [trips[j]]);
                if (msg) return msg;
            }
        }
        return null;
    };

    // Form Tạo: overlap trong selectedCreateTrips
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const createOverlapError = useMemo(() => detectOverlapInList(selectedCreateTrips), [selectedCreateTrips]);

    // Form Cập nhật: overlap giữa pendingEditTrips và trips đã gán
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const editOverlapError = useMemo(() => {
        const combined = [...(assignTarget?.trips || []) as Trip[], ...pendingEditTrips];
        return detectOverlapInList(combined);
    }, [pendingEditTrips, assignTarget]);

    // ── Helper: tính thời gian ca xe từ trips ± 30 phút ──
    // Chỉ track min departure / max arrival → O(n), ko cần sort
    const BUFFER_MINUTES = 30;
    const computeAssignmentTimeFromTrips = (
        trips: (Trip | BusAssignmentTripSummary)[],
        fallbackDate: string // yyyy-MM-dd — dùng khi departureTime chỉ có HH:mm:ss
    ): { startDate: string; startTime: string; endDate: string; endTime: string } | null => {
        if (trips.length === 0) return null;
        let minDep = Infinity;
        let maxArr = -Infinity;

        for (const t of trips) {
            // Parse departure
            const depTimeStr = t.departureTime;
            if (depTimeStr) {
                const depHHmm = extractTime(depTimeStr); // "HH:mm" — always works
                const dateStr = ("departureDate" in t && t.departureDate) ? t.departureDate : fallbackDate;
                const dep = new Date(`${dateStr}T${depHHmm}:00`).getTime();
                if (!isNaN(dep) && dep < minDep) minDep = dep;
            }
            // Parse arrival
            const arrTimeStr = t.arrivalTime;
            if (arrTimeStr) {
                const arrHHmm = extractTime(arrTimeStr);
                const dateStr = ("departureDate" in t && t.departureDate) ? t.departureDate : fallbackDate;
                const arr = new Date(`${dateStr}T${arrHHmm}:00`).getTime();
                if (!isNaN(arr) && arr > maxArr) maxArr = arr;
            }
        }

        if (!isFinite(minDep) || !isFinite(maxArr)) return null;
        const startDt = new Date(minDep - BUFFER_MINUTES * 60 * 1000);
        const endDt = new Date(maxArr + BUFFER_MINUTES * 60 * 1000);
        return {
            startDate: format(startDt, "yyyy-MM-dd"),
            startTime: format(startDt, "HH:mm"),
            endDate: format(endDt, "yyyy-MM-dd"),
            endTime: format(endDt, "HH:mm"),
        };
    };

    const checkAssignmentCoversTrips = (
        startDate: string, startTime: string,
        endDate: string, endTime: string,
        trips: readonly (Trip | BusAssignmentTripSummary)[],
        fallbackDate: string
    ): string | null => {
        if (!startTime || !endTime || trips.length === 0) return null;
        const startDt = new Date(`${startDate}T${startTime}:00`).getTime();
        const endDt = new Date(`${endDate}T${endTime}:00`).getTime();
        if (isNaN(startDt) || isNaN(endDt)) return null;

        for (const t of trips) {
            const depTimeStr = t.departureTime;
            const arrTimeStr = t.arrivalTime;
            if (depTimeStr) {
                const depHHmm = extractTime(depTimeStr);
                const dDate = ("departureDate" in t && t.departureDate) ? t.departureDate : fallbackDate;
                const dep = new Date(`${dDate}T${depHHmm}:00`).getTime();
                if (startDt > dep) return `Giờ xuất bãi trễ hơn giờ khởi hành của chuyến (${depHHmm}).`;
            }
            if (arrTimeStr) {
                const arrHHmm = extractTime(arrTimeStr);
                const dDate = ("departureDate" in t && t.departureDate) ? t.departureDate : fallbackDate;
                const arr = new Date(`${dDate}T${arrHHmm}:00`).getTime();
                if (endDt < arr) return `Giờ nhập bãi sớm hơn giờ kết thúc của chuyến (${arrHHmm}).`;
            }
        }
        return null;
    };

    // ── Auto-scale Create form khi thêm/bớt trip ──
    useEffect(() => {
        const computed = computeAssignmentTimeFromTrips(selectedCreateTrips, selectedDate);
        if (computed) {
            setCreateForm(f => {
                const reqStart = new Date(`${computed.startDate}T${computed.startTime}:00`).getTime();
                const reqEnd = new Date(`${computed.endDate}T${computed.endTime}:00`).getTime();
                const curStart = f.startTime ? new Date(`${f.startDate}T${f.startTime}:00`).getTime() : Infinity;
                const curEnd = f.endTime ? new Date(`${f.endDate}T${f.endTime}:00`).getTime() : -Infinity;
                
                let changed = false;
                let newS = { d: f.startDate, t: f.startTime };
                let newE = { d: f.endDate, t: f.endTime };
                
                if (curStart > reqStart || !f.startTime) {
                    newS = { d: computed.startDate, t: computed.startTime };
                    changed = true;
                }
                if (curEnd < reqEnd || !f.endTime) {
                    newE = { d: computed.endDate, t: computed.endTime };
                    changed = true;
                }
                
                if (changed) {
                    return {
                        ...f,
                        startDate: newS.d,
                        startTime: newS.t,
                        endDate: newE.d,
                        endTime: newE.t,
                    };
                }
                return f;
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCreateTrips, selectedDate]);

    // ── Auto-scale Update form khi thêm/bớt trip ──
    useEffect(() => {
        const allTrips = [...(assignTarget?.trips || []) as Trip[], ...pendingEditTrips];
        const assignDate = assignTarget?.scheduledStart
            ? format(new Date(assignTarget.scheduledStart), "yyyy-MM-dd")
            : selectedDate;
        const computed = computeAssignmentTimeFromTrips(allTrips, assignDate);
        if (computed) {
            setEditForm(f => {
                const reqStart = new Date(`${computed.startDate}T${computed.startTime}:00`).getTime();
                const reqEnd = new Date(`${computed.endDate}T${computed.endTime}:00`).getTime();
                const curStart = f.startTime ? new Date(`${f.startDate}T${f.startTime}:00`).getTime() : Infinity;
                const curEnd = f.endTime ? new Date(`${f.endDate}T${f.endTime}:00`).getTime() : -Infinity;
                
                let changed = false;
                let newS = { d: f.startDate, t: f.startTime };
                let newE = { d: f.endDate, t: f.endTime };
                
                if (curStart > reqStart || !f.startTime) {
                    newS = { d: computed.startDate, t: computed.startTime };
                    changed = true;
                }
                if (curEnd < reqEnd || !f.endTime) {
                    newE = { d: computed.endDate, t: computed.endTime };
                    changed = true;
                }
                
                if (changed) {
                    return {
                        ...f,
                        startDate: newS.d,
                        startTime: newS.t,
                        endDate: newE.d,
                        endTime: newE.t,
                    };
                }
                return f;
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingEditTrips, assignTarget]);

    // ── Kiểm tra thời gian user nhập có bị cấn không ──
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const createTripsBoundError = useMemo(() => {
        return checkAssignmentCoversTrips(
            createForm.startDate, createForm.startTime,
            createForm.endDate, createForm.endTime,
            selectedCreateTrips, selectedDate
        );
    }, [createForm.startDate, createForm.startTime, createForm.endDate, createForm.endTime, selectedCreateTrips, selectedDate]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const editTripsBoundError = useMemo(() => {
        const allTrips = [...(assignTarget?.trips || []) as Trip[], ...pendingEditTrips];
        const assignDate = assignTarget?.scheduledStart
            ? format(new Date(assignTarget.scheduledStart), "yyyy-MM-dd")
            : selectedDate;
        return checkAssignmentCoversTrips(
            editForm.startDate, editForm.startTime,
            editForm.endDate, editForm.endTime,
            allTrips, assignDate
        );
    }, [editForm.startDate, editForm.startTime, editForm.endDate, editForm.endTime, pendingEditTrips, assignTarget, selectedDate]);

    // ── Cảnh báo ca xe overlap với ca xe khác của cùng xe ──
    const createBusOverlapWarning = useMemo(() => {
        if (!createForm.busId || !createForm.startTime || !createForm.endTime) return null;
        const newStart = new Date(`${createForm.startDate}T${createForm.startTime}:00`).getTime();
        const newEnd = new Date(`${createForm.endDate}T${createForm.endTime}:00`).getTime();
        if (isNaN(newStart) || isNaN(newEnd)) return null;
        const busId = Number(createForm.busId);
        for (const a of assignments) {
            if (a.busId !== busId) continue;
            if (["CANCELLED"].includes(a.status)) continue;
            const aStart = new Date(a.scheduledStart).getTime();
            const aEnd = new Date(a.scheduledEnd).getTime();
            if (newStart < aEnd && newEnd > aStart) {
                return `Ca xe mới trùng lịch với ca xe #${a.id} (${extractTime(a.scheduledStart)} – ${extractTime(a.scheduledEnd)})`;
            }
        }
        return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [createForm.busId, createForm.startDate, createForm.startTime, createForm.endDate, createForm.endTime, assignments]);

    const editBusOverlapWarning = useMemo(() => {
        if (!assignTarget || !editForm.startTime || !editForm.endTime) return null;
        const newStart = new Date(`${editForm.startDate}T${editForm.startTime}:00`).getTime();
        const newEnd = new Date(`${editForm.endDate}T${editForm.endTime}:00`).getTime();
        if (isNaN(newStart) || isNaN(newEnd)) return null;
        for (const a of assignments) {
            if (a.id === assignTarget.id) continue; // bỏ qua chính nó
            if (a.busId !== assignTarget.busId) continue;
            if (["CANCELLED"].includes(a.status)) continue;
            const aStart = new Date(a.scheduledStart).getTime();
            const aEnd = new Date(a.scheduledEnd).getTime();
            if (newStart < aEnd && newEnd > aStart) {
                return `Ca xe trùng lịch với ca xe #${a.id} (${extractTime(a.scheduledStart)} – ${extractTime(a.scheduledEnd)})`;
            }
        }
        return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignTarget, editForm.startDate, editForm.startTime, editForm.endDate, editForm.endTime, assignments]);

    const openEditDialog = (assignment: BusAssignment) => {
        setAssignTarget(assignment);
        // Parse existing times into form
        const startDt = assignment.scheduledStart ? new Date(assignment.scheduledStart) : new Date();
        const endDt = assignment.scheduledEnd ? new Date(assignment.scheduledEnd) : new Date();
        setEditForm({
            startDate: format(startDt, "yyyy-MM-dd"),
            startTime: format(startDt, "HH:mm"),
            endDate: format(endDt, "yyyy-MM-dd"),
            endTime: format(endDt, "HH:mm"),
            notes: assignment.notes || "",
        });
        setDepFilter("");
        setArrFilter("");
        setPendingEditTrips([]);
        setAssignOpen(true);
    };

    const handleUpdate = async () => {
        if (!assignTarget) return;
        if (!editForm.startTime || !editForm.endTime) {
            toast.error("Vui lòng chọn giờ xuất bãi và nhập bãi");
            return;
        }
        // Guard: chặn API nếu có trips trùng lịch
        if (editOverlapError) {
            toast.error(`Không thể lưu: ${editOverlapError}`, { duration: 5000 });
            return;
        }
        // Guard: chặn nếu ca xe overlap với ca xe khác cùng xe
        if (editBusOverlapWarning) {
            toast.error(`Không thể lưu: ${editBusOverlapWarning}`, { duration: 5000 });
            return;
        }
        // Guard: chặn nếu cấn giờ với chuyến xe
        if (editTripsBoundError) {
            toast.error(editTripsBoundError, { duration: 5000 });
            return;
        }
        const scheduledStart = `${editForm.startDate}T${editForm.startTime}:00`;
        const scheduledEnd = `${editForm.endDate}T${editForm.endTime}:00`;
        if (scheduledEnd <= scheduledStart) {
            toast.error("Giờ nhập bãi phải sau giờ xuất bãi");
            return;
        }
        try {
            // Lưu thông tin ca xe — dùng updateMutation.mutateAsync để nhất quán với createMutation
            await updateMutation.mutateAsync({
                id: assignTarget.id,
                request: { scheduledStart, scheduledEnd, notes: editForm.notes || undefined },
            });
            queryClient.invalidateQueries({ queryKey: ["bus-assignments"] });

            // Gán tuần tự các trip đang pending (nếu có)
            if (pendingEditTrips.length > 0) {
                const hasError = await assignTripsSequentially(assignTarget.id, pendingEditTrips);
                if (!hasError) {
                    setPendingEditTrips([]);
                    toast.success("Đã lưu ca xe và gán chờển thành công!", { duration: 2500 });
                }
                // nếu hasError → assignTripsSequentially đã tiật error toast, form giữ mở
                const updated = await busAssignmentService.list(selectedDate);
                const refreshed = updated.find(a => a.id === assignTarget!.id);
                if (refreshed) setAssignTarget(refreshed);
            } else {
                // Không có trip pending — chỉ cập nhật info ca xe
                toast.success("Cập nhật ca xe thành công!", { duration: 2500 });
            }
        } catch (error: unknown) {
            toast.error(parseFriendlyError(error, "Lỗi cập nhật ca xe"));
        }
    };

    const handleCheckOpen = (assignment: BusAssignment, type: "in" | "out") => {
        setCheckTarget(assignment);
        setCheckType(type);
        // Check-in (xuất bãi): tự động điền bãi xuất = bãi hiện tại của xe (startDepotId)
        // Check-out (nhập bãi): mặc định = bãi xuất (quay về), user có thể đổi
        const defaultDepotId = type === "in"
            ? (assignment.startDepotId ? String(assignment.startDepotId) : "")
            : (assignment.startDepotId ? String(assignment.startDepotId) : "");
        setCheckForm({ odometer: "", fuelLevel: "", notes: "", depotId: defaultDepotId });
        setCheckDialogOpen(true);
    };

    const handleCheckSubmit = () => {
        if (!checkTarget || !checkForm.odometer || !checkForm.fuelLevel) {
            toast.error("Vui lòng nhập ODO và mức nhiên liệu");
            return;
        }
        checkMutation.mutate({
            id: checkTarget.id,
            type: checkType,
            odometer: Number(checkForm.odometer),
            fuelLevel: Number(checkForm.fuelLevel),
            notes: checkForm.notes || undefined,
            depotId: checkForm.depotId ? Number(checkForm.depotId) : undefined,
        });
    };

    // Stats — PENDING là trạng thái mặc định theo SQL, đếm cùng SCHEDULED
    const stats = useMemo(() => ({
        total: assignments.length,
        scheduled: assignments.filter(a => ["PENDING", "SCHEDULED"].includes(a.status)).length,
        checkedIn: assignments.filter(a => a.status === "CHECKED_IN").length,
        completed: assignments.filter(a => ["CHECKED_OUT", "COMPLETED"].includes(a.status)).length,
    }), [assignments]);

    return (
        <div className="space-y-6">
            {/* Create Dialog */}
            <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) setSelectedCreateTrips([]); }}>
                <DialogContent className="!max-w-[1160px] p-0 overflow-hidden bg-white">
                    <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                                <Plus className="h-4 w-4 text-brand-blue" />
                            </div>
                            Tạo Ca Xe Mới
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 mt-1">
                            Chọn xe, thời gian và gán chuyến ngay khi tạo ca xe
                        </DialogDescription>
                    </DialogHeader>

                    {/* ── Row 1: Chọn xe (với filter loại xe + depot) ── */}
                    <div className="px-6 pt-4 pb-3 border-b border-gray-100 bg-white">
                        <div className="space-y-0">
                            {(() => {
                                interface BusOption {
                                    id: number | string;
                                    currentDepotId?: number | string;
                                    busTypeName?: string;
                                    licensePlate?: string;
                                    currentDepotName?: string;
                                }
                                interface DepotOption {
                                    id: number | string;
                                    name: string;
                                }
                                let filteredBuses = availableBuses as BusOption[];
                                // Lấy xe đang hoạt động
                                // @ts-expect-error status field exists at runtime
                                filteredBuses = filteredBuses.filter(b => b.status === "ACTIVE");

                                // Lọc theo depot
                                if (depotFilter) {
                                    if (depotFilter === "null") {
                                        filteredBuses = filteredBuses.filter((b) => !b.currentDepotId);
                                    } else {
                                        filteredBuses = filteredBuses.filter((b) => String(b.currentDepotId) === depotFilter);
                                    }
                                }
                                // Lọc theo loại xe
                                if (busTypeFilter && busTypeFilter !== "__all__") {
                                    filteredBuses = filteredBuses.filter((b) => b.busTypeName === busTypeFilter);
                                }
                                const busOptions: SearchableSelectOption[] = filteredBuses.map((b) => ({
                                    value: String(b.id),
                                    label: b.licensePlate || "",
                                    searchText: `${b.licensePlate} ${b.busTypeName || ""} ${b.currentDepotName || ""}`,
                                    group: b.busTypeName || "Khác",
                                    raw: b,
                                }));
                                // Giữ xe đang chọn dù có đổi filter — thêm vào đầu nếu chưa có trong list
                                if (createForm.busId && !busOptions.find(o => o.value === createForm.busId)) {
                                    const selectedBusRaw = (availableBuses as BusOption[]).find(b => String(b.id) === createForm.busId);
                                    if (selectedBusRaw) {
                                        busOptions.unshift({
                                            value: String(selectedBusRaw.id),
                                            label: selectedBusRaw.licensePlate || "",
                                            searchText: `${selectedBusRaw.licensePlate} ${selectedBusRaw.busTypeName || ""}`,
                                            group: selectedBusRaw.busTypeName || "Khác",
                                            raw: selectedBusRaw,
                                        });
                                    }
                                }
                                const busTypes = Array.from(new Set((availableBuses as BusOption[]).map(b => b.busTypeName).filter(Boolean))) as string[];
                                // Dùng danh sách bãi trực tiếp từ API đã fetch
                                const depotNames = (depots as DepotOption[]).map((d) => ({
                                    id: String(d.id),
                                    name: d.name
                                }));
                                // Xe đang chọn
                                const selectedBus = createForm.busId ? (availableBuses as BusOption[]).find((b) => String(b.id) === createForm.busId) : null;
                                return (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full">
                                            {/* Cột 1: Bãi */}
                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium text-gray-700">Thuộc Bãi Đỗ</Label>
                                                <Select value={depotFilter || "__all__"} onValueChange={(v) => setDepotFilter(v === "__all__" ? "" : v)}>
                                                    <SelectTrigger className="h-10 text-sm font-medium rounded-lg w-full bg-white border-gray-200 shadow-sm hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-brand-blue/20">
                                                        <SelectValue placeholder="Tất cả bãi" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-gray-200 shadow-xl z-[200]">
                                                        <SelectItem value="__all__">Tất cả bãi</SelectItem>
                                                        <SelectItem value="null">Chưa có bãi</SelectItem>
                                                        {depotNames.map((d) => (
                                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Cột 2: Loại Xe */}
                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium text-gray-700">Loại Xe</Label>
                                                <Select value={busTypeFilter || "__all__"} onValueChange={(v) => setBusTypeFilter(v === "__all__" ? "" : v)}>
                                                    <SelectTrigger className="h-10 text-sm font-medium rounded-lg w-full bg-white border-gray-200 shadow-sm hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-brand-blue/20">
                                                        <SelectValue placeholder="Tất cả loại xe" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-gray-200 shadow-xl z-[200]">
                                                        <SelectItem value="__all__">Tất cả loại xe</SelectItem>
                                                        {busTypes.map((t) => (
                                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Cột 3: Xe */}
                                            <div className="space-y-1 md:col-span-2">
                                                <Label className="text-sm font-medium text-gray-700">Xe (Biển số) <span className="text-red-500">*</span></Label>
                                                <SearchableSelect
                                                    options={busOptions}
                                                    value={createForm.busId}
                                                    onChange={v => setCreateForm(f => ({ ...f, busId: v }))}
                                                    placeholder="-- Chọn xe --"
                                                    searchPlaceholder="Tìm biển số, loại xe..."
                                                    triggerClassName="h-10 w-full rounded-lg border-gray-200 shadow-sm focus:ring-2 focus:ring-brand-blue/20"
                                                    renderOption={(opt) => (
                                                        <div className="flex items-center gap-2">
                                                            <Bus className="h-3.5 w-3.5 text-brand-blue" />
                                                            <span className="font-mono font-medium">{opt.label}</span>
                                                            <span className="text-gray-400 text-xs">— {opt.group}</span>
                                                            {opt.raw?.currentDepotName ? (
                                                                <span className="ml-auto text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 flex-shrink-0">
                                                                    <MapPin className="h-2.5 w-2.5 inline mr-0.5" />{opt.raw.currentDepotName}
                                                                </span>
                                                            ) : (
                                                                <span className="ml-auto text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 flex-shrink-0">
                                                                    <MapPin className="h-2.5 w-2.5 inline mr-0.5" />Chưa có bãi
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    renderValue={(opt) => (
                                                        <span className="flex items-center gap-2">
                                                            <Bus className="h-3.5 w-3.5 text-brand-blue" />
                                                            <span className="font-mono font-medium">{opt?.label}</span>
                                                            <span className="text-gray-400 text-xs">— {opt?.group}</span>
                                                        </span>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        {/* Hiển thị depot hiện tại của xe đã chọn */}
                                        {selectedBus && (
                                            <div className="mt-3 flex items-center gap-1.5 text-xs">
                                                <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                                                <span className="text-gray-500">Bãi hiện tại:</span>
                                                <span className="font-medium text-gray-800">
                                                    {selectedBus.currentDepotName || "Chưa xác định"}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* ── Row 2: Thời gian + Ghi chú ── */}
                    <div className="px-6 py-3 border-b border-gray-100 bg-white">
                        <div className="flex items-end gap-4 flex-wrap">
                            {/* Xuất bãi */}
                            <div className="space-y-1">
                                <Label className="text-sm font-medium text-gray-700">
                                    Xuất bãi <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex items-center gap-1.5">
                                    <AdminDatePicker
                                        value={createForm.startDate ? new Date(createForm.startDate) : null}
                                        onChange={(date) => setCreateForm(f => ({ ...f, startDate: date ? format(date, "yyyy-MM-dd") : f.startDate }))}
                                        className="w-[130px]"
                                    />
                                    <TimeSelectField label="" value={createForm.startTime} onChange={v => setCreateForm(f => ({ ...f, startTime: v }))} required compact />
                                </div>
                            </div>
                            {/* Nhập bãi */}
                            <div className="space-y-1">
                                <Label className="text-sm font-medium text-gray-700">
                                    Nhập bãi <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex items-center gap-1.5">
                                    <AdminDatePicker
                                        value={createForm.endDate ? new Date(createForm.endDate) : null}
                                        onChange={(date) => setCreateForm(f => ({ ...f, endDate: date ? format(date, "yyyy-MM-dd") : f.endDate }))}
                                        className="w-[130px]"
                                    />
                                    <TimeSelectField label="" value={createForm.endTime} onChange={v => setCreateForm(f => ({ ...f, endTime: v }))} required compact />
                                </div>
                            </div>
                            {/* Ghi chú */}
                            <div className="space-y-1 flex-1 min-w-[160px]">
                                <Label className="text-sm font-medium text-gray-700">
                                    Ghi chú <span className="text-xs text-gray-400 font-normal">(tùy chọn)</span>
                                </Label>
                                <Input
                                    placeholder="Ca sáng..."
                                    value={createForm.notes}
                                    onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))}
                                    className="h-10 text-sm font-medium rounded-lg bg-white border-gray-200 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-brand-blue/20 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Cảnh báo ca xe overlap */}
                    {createBusOverlapWarning && (
                        <div className="mx-6 mb-1 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                            <span className="text-xs text-amber-700 font-medium">{createBusOverlapWarning}</span>
                        </div>
                    )}
                    
                    {/* Cảnh báo giờ không bao phủ chuyến */}
                    {createTripsBoundError && (
                        <div className="mx-6 mb-1 px-3 py-2 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                            <span className="text-xs text-red-700 font-medium">{createTripsBoundError}</span>
                        </div>
                    )}

                    <div className="flex min-h-[360px]">
                        {/* LEFT: available trips */}
                        <div className="flex-1 min-w-0 flex flex-col border-r border-gray-100">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Chuyến chưa gán
                                </span>
                            </div>
                            {(() => {
                                const selectedIds = new Set(selectedCreateTrips.map((t: Trip) => t.id));
                                // Filter: chỉ hiện trip chưa gán xe (busId == null) và chưa chọn
                                const availableBase = unassignedTrips
                                    .filter((t: Trip) => t.busId == null)
                                    .filter((t: Trip) => !selectedIds.has(t.id));

                                const depStations = Array.from(new Set(
                                    availableBase.map((t: Trip) => t.departureStationName).filter(Boolean)
                                )).sort() as string[];
                                const arrStations = Array.from(new Set(
                                    availableBase.map((t: Trip) => t.arrivalStationName).filter(Boolean)
                                )).sort() as string[];

                                const filtered = availableBase
                                    .filter((t: Trip) => {
                                        const matchDep = !createDepFilter || t.departureStationName === createDepFilter;
                                        const matchArr = !createArrFilter || t.arrivalStationName === createArrFilter;
                                        return matchDep && matchArr;
                                    })
                                    .sort((a: Trip, b: Trip) => {
                                        const ta = String(a.departureTime || "");
                                        const tb = String(b.departureTime || "");
                                        return ta < tb ? -1 : ta > tb ? 1 : 0;
                                    });

                                return (
                                    <>
                                        {(depStations.length > 0 || arrStations.length > 0) && (
                                            <div className="px-5 py-2.5 border-b border-gray-100 bg-white flex items-end gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 block">Bến xuất phát</label>
                                                    <Select value={createDepFilter || "__all__"} onValueChange={v => setCreateDepFilter(v === "__all__" ? "" : v)}>
                                                        <SelectTrigger className="h-8 text-xs min-w-[120px] truncate">
                                                            <SelectValue placeholder="Tất cả" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="__all__">Tất cả</SelectItem>
                                                            {depStations.map(s => (
                                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <span className="text-gray-300 text-sm pb-1.5 shrink-0">→</span>
                                                <div className="flex-1 min-w-0">
                                                    <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 block">Bến kết thúc</label>
                                                    <Select value={createArrFilter || "__all__"} onValueChange={v => setCreateArrFilter(v === "__all__" ? "" : v)}>
                                                        <SelectTrigger className="h-8 text-xs min-w-[120px] truncate">
                                                            <SelectValue placeholder="Tất cả" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="__all__">Tất cả</SelectItem>
                                                            {arrStations.map(s => (
                                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}
                                        <div className="max-h-[380px] overflow-y-auto px-5 py-3 space-y-3">
                                            {filtered.length === 0 ? (
                                                <p className="text-sm text-gray-400 text-center py-8">
                                                    {(createDepFilter || createArrFilter)
                                                        ? "Không có chuyến nào khớp bộ lọc"
                                                        : "Không còn chuyến nào chưa gán trong ngày"}
                                                </p>
                                            ) : filtered.map(trip => {
                                                const benDi = trip.departureStationName || (trip.routeName || "").split(" - ")[0] || "—";
                                                const benDen = trip.arrivalStationName || (trip.routeName || "").split(" - ").slice(1).join(" - ") || "—";
                                                return (
                                                    <div
                                                        key={trip.id}
                                                        className="border border-gray-200 rounded-lg p-4 hover:border-brand-blue/30 hover:shadow-sm transition-all"
                                                    >
                                                        <div className="flex items-start gap-2 mb-3">
                                                            <MapPin className="h-4 w-4 text-brand-blue mt-0.5 shrink-0" />
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-medium text-sm text-gray-800">
                                                                    {benDi} – {benDen}
                                                                </div>
                                                                {trip.routeCode && (
                                                                    <span className="text-xs font-mono text-gray-400">{trip.routeCode}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4 mb-3">
                                                            <div className="text-center">
                                                                <div className="text-sm font-semibold text-gray-900 tabular-nums leading-none">
                                                                    {extractTime(trip.departureTime)}
                                                                </div>
                                                                <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Xuất bến</div>
                                                            </div>
                                                            <div className="flex-1 flex items-center">
                                                                <div className="h-px flex-1 bg-gray-200" />
                                                                <ArrowRight className="h-3.5 w-3.5 text-gray-300 mx-1 shrink-0" />
                                                                <div className="h-px flex-1 bg-gray-200" />
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-sm font-semibold text-gray-900 tabular-nums leading-none">
                                                                    {extractTime(trip.arrivalTime)}
                                                                </div>
                                                                <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Đến nơi</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                            <div className="flex items-center gap-1.5 text-xs">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500 font-medium">{benDi}</span>
                                                                <span className="text-gray-300">→</span>
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500 font-medium">{benDen}</span>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                className="shrink-0 bg-brand-blue hover:bg-brand-blue/90 text-white h-8 px-4 rounded-lg"
                                                                onClick={() => {
                                                                    const overlapMsg = checkTripOverlap(trip, selectedCreateTrips);
                                                                    if (overlapMsg) { toast.error(overlapMsg, { duration: 4000 }); return; }
                                                                    const newTrips = [...selectedCreateTrips, trip];
                                                                    setSelectedCreateTrips(newTrips);
                                                                    // DEBUG: log trip time format
                                                                    console.log("[AUTO-SCALE DEBUG] trip:", JSON.stringify({
                                                                        id: trip.id,
                                                                        departureTime: trip.departureTime,
                                                                        arrivalTime: trip.arrivalTime,
                                                                        departureDate: trip.departureDate,
                                                                        selectedDate,
                                                                        extractedDep: extractTime(trip.departureTime),
                                                                        extractedArr: extractTime(trip.arrivalTime),
                                                                    }));
                                                                    const computed = computeAssignmentTimeFromTrips(newTrips, selectedDate);
                                                                    console.log("[AUTO-SCALE DEBUG] computed:", JSON.stringify(computed));
                                                                    if (computed) {
                                                                        setCreateForm(f => ({
                                                                            ...f,
                                                                            startDate: computed.startDate,
                                                                            startTime: computed.startTime,
                                                                            endDate: computed.endDate,
                                                                            endTime: computed.endTime,
                                                                        }));
                                                                    }
                                                                }}
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                                Chọn
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* RIGHT: chuyến đã chọn (chờ lưu) */}
                        <div className="w-[280px] shrink-0 flex flex-col bg-gray-50/30">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                    Đã gán ({selectedCreateTrips.length})
                                    {selectedCreateTrips.length > 0 && (
                                        <span className="ml-auto text-[10px] font-medium bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full border border-yellow-200">
                                            {selectedCreateTrips.length} chờ lưu
                                        </span>
                                    )}
                                </h4>
                            </div>
                            <div className="flex-1 overflow-y-auto max-h-[420px] px-3 py-2 space-y-1.5">
                                {selectedCreateTrips.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                                        <Clock className="h-6 w-6 mb-2" />
                                        <p className="text-xs">Chưa có chuyến nào</p>
                                    </div>
                                ) : (
                                    [...selectedCreateTrips]
                                        .sort((a, b) => String(a.departureTime || "").localeCompare(String(b.departureTime || "")))
                                        .map(trip => {
                                            const benDi = trip.departureStationName || (trip.routeName || "").split(" - ")[0] || "—";
                                            const benDen = trip.arrivalStationName || (trip.routeName || "").split(" - ").slice(1).join(" - ") || "—";
                                            return (
                                                <div key={trip.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 group hover:border-red-200 shadow-sm transition-all">
                                                    <div className="flex items-center gap-1.5 text-sm">
                                                        <span className="font-semibold text-gray-900 tabular-nums">{extractTime(trip.departureTime)}</span>
                                                        <span className="text-gray-300">→</span>
                                                        <span className="font-semibold text-gray-900 tabular-nums">{extractTime(trip.arrivalTime)}</span>
                                                        {trip.routeCode && (
                                                            <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1 py-0.5 rounded">{trip.routeCode}</span>
                                                        )}
                                                        <span className="ml-auto text-[10px] font-medium bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full border border-yellow-200 shrink-0">Chờ lưu</span>
                                                        <button
                                                            className="p-0.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Gỡ chuyến"
                                                            onClick={() => {
                                                                const remaining = selectedCreateTrips.filter(t => t.id !== trip.id);
                                                                setSelectedCreateTrips(remaining);
                                                                const computed = computeAssignmentTimeFromTrips(remaining, selectedDate);
                                                                if (computed) {
                                                                    setCreateForm(f => ({
                                                                        ...f,
                                                                        startDate: computed.startDate,
                                                                        startTime: computed.startTime,
                                                                        endDate: computed.endDate,
                                                                        endTime: computed.endTime,
                                                                    }));
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                    <div className="text-xs font-medium text-gray-500 mt-1 truncate">
                                                        {benDi} → {benDen}
                                                    </div>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                        {createOverlapError && (
                            <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
                                <span className="font-semibold">⚠️ Trùng lịch:</span> {createOverlapError}
                            </p>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
                                Đóng
                            </Button>
                            <Button
                                size="sm"
                                className="bg-brand-blue hover:bg-brand-blue/90"
                                onClick={handleCreate}
                                disabled={createMutation.isPending || !!createOverlapError || !!createTripsBoundError}
                            >
                                {createMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                                Tạo ca xe{selectedCreateTrips.length > 0 ? ` (+${selectedCreateTrips.length} chuyến)` : ""}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Cập Nhật Ca Xe Dialog */}
            <Dialog open={assignOpen} onOpenChange={(open) => { setAssignOpen(open); if (!open) { setDepFilter(""); setArrFilter(""); setPendingEditTrips([]); } }}>
                <DialogContent className="!max-w-[1160px] p-0 overflow-hidden bg-white">
                    <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <Pencil className="h-4 w-4 text-brand-blue" />
                            Cập Nhật Ca Xe
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            Chỉnh thời gian, ghi chú và gán/gỡ chuyến
                        </DialogDescription>
                    </DialogHeader>

                    {/* ── Row 1: Xe (readonly) + Depot info ── */}
                    <div className="px-6 pt-4 pb-3 border-b border-gray-100 bg-white">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Xe</Label>
                            <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center shrink-0">
                                    <Bus className="h-4 w-4 text-brand-blue" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="font-mono font-bold text-gray-900 text-sm">{assignTarget?.busLicensePlate}</span>
                                    <span className="text-xs text-gray-400 ml-2">— {assignTarget?.busTypeName || "N/A"}</span>
                                </div>
                            </div>
                            {/* Depot info badges */}
                            <div className="flex items-center gap-3 flex-wrap">
                                {assignTarget?.startDepotName && (
                                    <div className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
                                        <MapPin className="h-3 w-3" />
                                        <span className="text-gray-500">Bãi xuất:</span>
                                        <span className="font-medium">{assignTarget.startDepotName}</span>
                                    </div>
                                )}
                                {assignTarget?.endDepotName && (
                                    <div className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700">
                                        <MapPin className="h-3 w-3" />
                                        <span className="text-gray-500">Bãi nhập:</span>
                                        <span className="font-medium">{assignTarget.endDepotName}</span>
                                    </div>
                                )}
                                {!assignTarget?.startDepotName && !assignTarget?.endDepotName && (
                                    <div className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                                        <MapPin className="h-3 w-3" />
                                        <span>Chưa gán bãi (sẽ xác định khi check-in/out)</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Row 2: Thời gian + Ghi chú ── */}
                    <div className="px-6 py-3 border-b border-gray-100 bg-white">
                        <div className="flex items-end gap-4 flex-wrap">
                            {/* Xuất bãi */}
                            <div className="space-y-1">
                                <Label className="text-sm font-medium text-gray-700">
                                    Xuất bãi <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex items-center gap-1.5">
                                    <AdminDatePicker
                                        value={editForm.startDate ? new Date(editForm.startDate) : null}
                                        onChange={(date) => setEditForm(f => ({ ...f, startDate: date ? format(date, "yyyy-MM-dd") : f.startDate }))}
                                        className="w-[130px]"
                                    />
                                    <TimeSelectField label="" value={editForm.startTime} onChange={v => setEditForm(f => ({ ...f, startTime: v }))} required compact />
                                </div>
                            </div>
                            {/* Nhập bãi */}
                            <div className="space-y-1">
                                <Label className="text-sm font-medium text-gray-700">
                                    Nhập bãi <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex items-center gap-1.5">
                                    <AdminDatePicker
                                        value={editForm.endDate ? new Date(editForm.endDate) : null}
                                        onChange={(date) => setEditForm(f => ({ ...f, endDate: date ? format(date, "yyyy-MM-dd") : f.endDate }))}
                                        className="w-[130px]"
                                    />
                                    <TimeSelectField label="" value={editForm.endTime} onChange={v => setEditForm(f => ({ ...f, endTime: v }))} required compact />
                                </div>
                            </div>
                            {/* Ghi chú */}
                            <div className="space-y-1 flex-1 min-w-[160px]">
                                <Label className="text-sm font-medium text-gray-700">
                                    Ghi chú <span className="text-xs text-gray-400 font-normal">(tùy chọn)</span>
                                </Label>
                                <Input
                                    placeholder="Ca sáng..."
                                    value={editForm.notes}
                                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                                    className="h-10 text-sm font-medium rounded-lg bg-white border-gray-200 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-brand-blue/20 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Cảnh báo ca xe overlap */}
                    {editBusOverlapWarning && (
                        <div className="mx-6 mb-1 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                            <span className="text-xs text-amber-700 font-medium">{editBusOverlapWarning}</span>
                        </div>
                    )}

                    {/* Cảnh báo giờ không bao phủ chuyến */}
                    {editTripsBoundError && (
                        <div className="mx-6 mb-1 px-3 py-2 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                            <span className="text-xs text-red-700 font-medium">{editTripsBoundError}</span>
                        </div>
                    )}

                    {/* ── Row 3: Trip selection (gán/gỡ chuyến) ── */}
                    <div className="flex min-h-[360px]">
                        {/* LEFT: Trips chưa gán */}
                        <div className="flex-1 min-w-0 flex flex-col border-r border-gray-100">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Chuyến chưa gán
                                </span>
                            </div>

                            {(() => {
                                const pendingIds = new Set(pendingEditTrips.map(t => t.id));
                                const assignedIds = new Set((assignTarget?.trips || []).map(t => t.id));
                                // Ẩn trip đã pending, đã gán ca này, hoặc đã gán xe cho chuyến khác
                                const available = unassignedTrips
                                    .filter(t => t.busId == null)
                                    .filter(t => !pendingIds.has(t.id) && !assignedIds.has(t.id));
                                const depStations = Array.from(new Set(
                                    available.map(t => t.departureStationName).filter(Boolean)
                                )).sort() as string[];
                                const arrStations = Array.from(new Set(
                                    available.map(t => t.arrivalStationName).filter(Boolean)
                                )).sort() as string[];

                                const filtered = available
                                    .filter(t => {
                                        const matchDep = !depFilter || t.departureStationName === depFilter;
                                        const matchArr = !arrFilter || t.arrivalStationName === arrFilter;
                                        return matchDep && matchArr;
                                    })
                                    .sort((a, b) => {
                                        const ta = String(a.departureTime || "");
                                        const tb = String(b.departureTime || "");
                                        return ta < tb ? -1 : ta > tb ? 1 : 0;
                                    });

                                return (
                                    <>
                                        {(depStations.length > 0 || arrStations.length > 0) && (
                                            <div className="px-5 py-2.5 border-b border-gray-100 bg-white flex items-end gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 block">Bến xuất phát</label>
                                                    <Select value={depFilter || "__all__"} onValueChange={v => setDepFilter(v === "__all__" ? "" : v)}>
                                                        <SelectTrigger className="h-8 text-xs min-w-[120px] truncate">
                                                            <SelectValue placeholder="Tất cả" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="__all__">Tất cả</SelectItem>
                                                            {depStations.map(s => (
                                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <span className="text-gray-300 text-sm pb-1.5 shrink-0">→</span>
                                                <div className="flex-1 min-w-0">
                                                    <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1 block">Bến kết thúc</label>
                                                    <Select value={arrFilter || "__all__"} onValueChange={v => setArrFilter(v === "__all__" ? "" : v)}>
                                                        <SelectTrigger className="h-8 text-xs min-w-[120px] truncate">
                                                            <SelectValue placeholder="Tất cả" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="__all__">Tất cả</SelectItem>
                                                            {arrStations.map(s => (
                                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}
                                        <div className="max-h-[380px] overflow-y-auto px-5 py-3 space-y-3">
                                            {filtered.length === 0 ? (
                                                <p className="text-sm text-gray-400 text-center py-8">
                                                    {(depFilter || arrFilter)
                                                        ? "Không có chuyến nào khớp bộ lọc"
                                                        : "Không còn chuyến nào chưa gán trong ngày"}
                                                </p>
                                            ) : filtered.map(trip => {
                                                const benDi = trip.departureStationName || (trip.routeName || "").split(" - ")[0] || "—";
                                                const benDen = trip.arrivalStationName || (trip.routeName || "").split(" - ").slice(1).join(" - ") || "—";
                                                return (
                                                    <div
                                                        key={trip.id}
                                                        className="border border-gray-200 rounded-lg p-4 hover:border-brand-blue/30 hover:shadow-sm transition-all"
                                                    >
                                                        <div className="flex items-start gap-2 mb-3">
                                                            <MapPin className="h-4 w-4 text-brand-blue mt-0.5 shrink-0" />
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-medium text-sm text-gray-800">
                                                                    {benDi} – {benDen}
                                                                </div>
                                                                {trip.routeCode && (
                                                                    <span className="text-xs font-mono text-gray-400">{trip.routeCode}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4 mb-3">
                                                            <div className="text-center">
                                                                <div className="text-sm font-semibold text-gray-900 tabular-nums leading-none">
                                                                    {extractTime(trip.departureTime)}
                                                                </div>
                                                                <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Xuất bến</div>
                                                            </div>
                                                            <div className="flex-1 flex items-center">
                                                                <div className="h-px flex-1 bg-gray-200" />
                                                                <ArrowRight className="h-3.5 w-3.5 text-gray-300 mx-1 shrink-0" />
                                                                <div className="h-px flex-1 bg-gray-200" />
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-sm font-semibold text-gray-900 tabular-nums leading-none">
                                                                    {extractTime(trip.arrivalTime)}
                                                                </div>
                                                                <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Đến nơi</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                            <div className="flex items-center gap-1.5 text-xs">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500 font-medium">{benDi}</span>
                                                                <span className="text-gray-300">→</span>
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500 font-medium">{benDen}</span>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                className="shrink-0 bg-brand-blue hover:bg-brand-blue/90 text-white h-8 px-4 rounded-lg"
                                                                onClick={() => {
                                                                    // Check overlap với trips đang pending + trips đã gán của assignment này
                                                                    const currentTrips = [...pendingEditTrips, ...(assignTarget?.trips || [])] as Trip[];
                                                                    const overlapMsg = checkTripOverlap(trip, currentTrips);
                                                                    if (overlapMsg) { toast.error(overlapMsg, { duration: 4000 }); return; }
                                                                    setPendingEditTrips(prev => [...prev, trip]);
                                                                }}
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                                Chọn
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* RIGHT: chuyến đã gán + chờ lưu */}
                        <div className="w-[280px] shrink-0 flex flex-col bg-gray-50/30">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                    Đã gán ({(assignTarget?.trips?.length || 0) + pendingEditTrips.length})
                                    {pendingEditTrips.length > 0 && (
                                        <span className="ml-auto text-[10px] font-medium bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full border border-yellow-200">
                                            {pendingEditTrips.length} chờ lưu
                                        </span>
                                    )}
                                </h4>
                            </div>
                            <div className="flex-1 overflow-y-auto max-h-[420px] px-3 py-2 space-y-1.5">
                                {(!assignTarget?.trips || assignTarget.trips.length === 0) && pendingEditTrips.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                                        <Clock className="h-6 w-6 mb-2" />
                                        <p className="text-xs">Chưa có chuyến nào</p>
                                    </div>
                                ) : (
                                    <>
                                        {[...(assignTarget?.trips || [])]
                                            .sort((a, b) => String(a.departureTime || "").localeCompare(String(b.departureTime || "")))
                                            .map(trip => {
                                                const benDi = trip.departureStationName || (trip.routeName || "").split(" - ")[0] || "—";
                                                const benDen = trip.arrivalStationName || (trip.routeName || "").split(" - ").slice(1).join(" - ") || "—";
                                                return (
                                                    <div key={trip.id} className="bg-white border border-gray-200 rounded-lg p-2.5 group hover:border-red-200 shadow-sm transition-all">
                                                        <div className="flex items-center gap-1.5 text-sm">
                                                            <span className="font-semibold text-gray-900 tabular-nums">{extractTime(trip.departureTime)}</span>
                                                            <span className="text-gray-300">→</span>
                                                            <span className="font-semibold text-gray-900 tabular-nums">{extractTime(trip.arrivalTime)}</span>
                                                            {trip.routeCode && (
                                                                <span className="ml-auto text-[10px] font-mono text-gray-400 bg-gray-100 px-1 py-0.5 rounded">{trip.routeCode}</span>
                                                            )}
                                                            {trip.status === "SCHEDULED" && (
                                                                <button
                                                                    className="ml-1 p-0.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                    title="Gỡ chuyến"
                                                                    onClick={() => {
                                                                        if (!assignTarget) return;
                                                                        unassignTripMutation.mutate({ assignmentId: assignTarget.id, tripId: trip.id });
                                                                    }}
                                                                    disabled={unassignTripMutation.isPending}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="text-xs font-medium text-gray-500 mt-1 truncate">
                                                            {benDi} → {benDen}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        }
                                        {[...pendingEditTrips]
                                            .sort((a, b) => String(a.departureTime || "").localeCompare(String(b.departureTime || "")))
                                            .map(trip => {
                                                const benDi = trip.departureStationName || (trip.routeName || "").split(" - ")[0] || "—";
                                                const benDen = trip.arrivalStationName || (trip.routeName || "").split(" - ").slice(1).join(" - ") || "—";
                                                return (
                                                    <div key={`p-${trip.id}`} className="bg-yellow-50/60 border border-yellow-200 rounded-lg p-2.5 group hover:border-red-200 shadow-sm transition-all">
                                                        <div className="flex items-center gap-1.5 text-sm">
                                                            <span className="font-semibold text-gray-900 tabular-nums">{extractTime(trip.departureTime)}</span>
                                                            <span className="text-gray-300">→</span>
                                                            <span className="font-semibold text-gray-900 tabular-nums">{extractTime(trip.arrivalTime)}</span>
                                                            <span className="ml-auto text-[9px] bg-yellow-200 text-yellow-700 px-1 py-0.5 rounded font-medium shrink-0">Chờ lưu</span>
                                                            <button
                                                                className="p-0.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Bỏ chọn"
                                                                onClick={() => setPendingEditTrips(prev => prev.filter(t => t.id !== trip.id))}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                        <div className="text-xs font-medium text-gray-500 mt-1 truncate">
                                                            {benDi} → {benDen}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        }
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                        {editOverlapError && (
                            <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
                                <span className="font-semibold">⚠️ Trùng lịch:</span> {editOverlapError}
                            </p>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setAssignOpen(false)}>
                                Đóng
                            </Button>
                            {assignTarget?.status === "PENDING" && (
                                <Button
                                    size="sm"
                                    className="bg-brand-blue hover:bg-brand-blue/90"
                                    onClick={handleUpdate}
                                    disabled={updateMutation.isPending || !!editOverlapError || !!editTripsBoundError}
                                >
                                    {updateMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                                    Lưu thay đổi{pendingEditTrips.length > 0 ? ` (+${pendingEditTrips.length} chuyến)` : ""}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Check-in/out Dialog — Duyệt xuất bãi / Duyệt nhập bãi */}
            <Dialog open={checkDialogOpen} onOpenChange={setCheckDialogOpen}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden">
                    <DialogHeader className={checkType === "in" ? "px-5 py-4 border-b border-blue-100 bg-blue-50/40" : "px-5 py-4 border-b border-green-100 bg-green-50/40"}>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            {checkType === "in" ? (
                                <LogIn className="h-4 w-4 text-blue-600" />
                            ) : (
                                <LogOut className="h-4 w-4 text-green-600" />
                            )}
                            {checkType === "in" ? "Duyệt Xuất Bãi" : "Duyệt Nhập Bãi"}
                        </DialogTitle>
                        <DialogDescription className="text-xs mt-0.5">
                            Xe: <span className="font-mono font-medium text-gray-700">{checkTarget?.busLicensePlate}</span>
                            {checkType === "in"
                                ? " — Xác nhận xe xuất bãi, ghi nhận ODO và nhiên liệu"
                                : " — Xác nhận xe nhập bãi, ghi nhận ODO và nhiên liệu"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 px-5 py-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-gray-700">Số ODO (km)</Label>
                            <Input
                                type="number"
                                placeholder="Nhập số ODO..."
                                className="bg-white"
                                value={checkForm.odometer}
                                onChange={e => setCheckForm(f => ({ ...f, odometer: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-gray-700">Mức nhiên liệu (%)</Label>
                            <Input
                                type="number"
                                placeholder="0–100"
                                min={0}
                                max={100}
                                className="bg-white"
                                value={checkForm.fuelLevel}
                                onChange={e => setCheckForm(f => ({ ...f, fuelLevel: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-gray-700">Ghi chú <span className="text-gray-400 font-normal text-xs">(tùy chọn)</span></Label>
                            <Input
                                placeholder="Tình trạng xe, ghi chú..."
                                className="bg-white"
                                value={checkForm.notes}
                                onChange={e => setCheckForm(f => ({ ...f, notes: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-gray-700">
                                {checkType === "in" ? "Bãi xuất" : "Bãi nhập"} <span className="text-red-500">*</span>
                            </Label>
                            {(() => {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const depotOptions: SearchableSelectOption[] = depots.map((d: any) => ({
                                    value: String(d.id),
                                    label: d.name,
                                    searchText: `${d.name} ${d.address || ""}`,
                                    raw: d,
                                }));
                                return (
                                    <SearchableSelect
                                        options={depotOptions}
                                        value={checkForm.depotId}
                                        onChange={v => setCheckForm(f => ({ ...f, depotId: v }))}
                                        placeholder="-- Chọn bãi đỗ xe --"
                                        searchPlaceholder="Tìm bãi đỗ xe..."
                                        triggerClassName="w-full"
                                        renderOption={(opt) => (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-3.5 w-3.5 text-green-600" />
                                                <span className="font-medium">{opt.label}</span>
                                                {opt.raw?.address && (
                                                    <span className="text-gray-400 text-xs truncate max-w-[180px]">— {opt.raw.address}</span>
                                                )}
                                            </div>
                                        )}
                                    />
                                );
                            })()}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                        <Button variant="outline" onClick={() => setCheckDialogOpen(false)}>Hủy</Button>
                        <Button
                            onClick={handleCheckSubmit}
                            disabled={checkMutation.isPending}
                            className={checkType === "in" ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}
                        >
                            {checkMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                            {checkType === "in" ? "Xác nhận xuất bãi" : "Xác nhận nhập bãi"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={endEarlyConfirmOpen}
                onOpenChange={setEndEarlyConfirmOpen}
                title="Xác nhận thao tác ca xe"
                description={endEarlyConfirm?.message || "Bạn có chắc muốn tiếp tục thao tác này?"}
                confirmLabel="Xác nhận"
                variant="danger"
                isLoading={endEarlyMutation.isPending}
                onConfirm={() => {
                    if (!endEarlyConfirm) return;
                    endEarlyMutation.mutate(endEarlyConfirm.id, {
                        onSuccess: () => {
                            setEndEarlyConfirmOpen(false);
                            setEndEarlyConfirm(null);
                        },
                    });
                }}
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Ca Xe</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Lập ca xe, gán chuyến, CHECK-IN/OUT phương tiện
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-brand-blue/90 transition-colors shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Tạo Ca Xe
                    </button>
                    <button
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Tổng ca", value: stats.total, color: "text-gray-900" },
                    { label: "Chờ xuất", value: stats.scheduled, color: "text-yellow-600" },
                    { label: "Đang chạy", value: stats.checkedIn, color: "text-blue-600" },
                    { label: "Hoàn thành", value: stats.completed, color: "text-green-600" },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-lg border border-gray-100 p-3 text-center">
                        <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                        <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <AdminDatePicker
                        value={selectedDate ? new Date(selectedDate) : null}
                        onChange={(date) => setSelectedDate(date ? format(date, "yyyy-MM-dd") : "")}
                        className="w-[200px]"
                    />
                    <div className="flex items-center text-sm text-gray-500 ml-auto whitespace-nowrap">
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <span className="font-medium text-gray-900 mr-1">{assignments.length}</span>
                        )}
                        ca xe
                    </div>
                </div>
            </div>

            {/* Assignment Cards */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">Đang tải...</p>
                    </div>
                ) : assignments.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
                        <Bus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium text-gray-500">Chưa có ca xe nào trong ngày này</p>
                        <p className="text-xs text-gray-400 mt-1 mb-4">
                            Tạo ca xe → Gán chuyến vào ca → Check-in/out khi xuất/nhập bãi
                        </p>
                        <button
                            onClick={() => setCreateOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-brand-blue/90 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Tạo ca xe đầu tiên
                        </button>
                    </div>
                ) : (
                    assignments.map(assignment => {
                        const statusCfg = ASSIGNMENT_STATUS[assignment.status] || ASSIGNMENT_STATUS.PENDING;
                        const StatusIcon = statusCfg.icon;
                        const isExpanded = expandedId === assignment.id;
                        // bus_assignment default status = PENDING (SQL: DEFAULT 'PENDING')
                        // PENDING = chưa xuất bãi → có thể gán chuyến và giao xe
                        const canAssignTrip = ["PENDING", "SCHEDULED"].includes(assignment.status);
                        const canCheckIn = ["PENDING", "SCHEDULED"].includes(assignment.status);
                        const canCheckOut = ["CHECKED_IN", "ENDED_EARLY"].includes(assignment.status);
                        const canEndEarly = ["PENDING", "CHECKED_IN", "DEPARTED"].includes(assignment.status);

                        return (
                            <div key={assignment.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                {/* Header Row */}
                                <div
                                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                                    )}

                                    {/* Bus info */}
                                    <div className="flex items-center gap-2 min-w-[140px]">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs font-mono font-medium text-gray-700">
                                            <Bus className="h-3 w-3" />
                                            {assignment.busLicensePlate}
                                        </span>
                                    </div>

                                    {/* Type */}
                                    <span className="text-xs text-gray-500 hidden sm:block min-w-[80px]">
                                        {assignment.busTypeName || "—"}
                                    </span>

                                    {/* Time */}
                                    <div className="text-sm text-gray-700 flex items-center gap-1 min-w-[120px]">
                                        <Clock className="h-3 w-3 text-gray-400" />
                                        {extractTime(assignment.scheduledStart)}
                                        <ArrowRight className="h-3 w-3 text-gray-400" />
                                        {extractTime(assignment.scheduledEnd)}
                                    </div>

                                    {/* Trip count */}
                                    <span className="text-xs text-gray-500">
                                        {assignment.trips?.length || 0} chuyến
                                    </span>

                                    {/* Status */}
                                    <span className={cn(
                                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ml-auto",
                                        statusCfg.className
                                    )}>
                                        <StatusIcon className="h-3 w-3" />
                                        {statusCfg.label}
                                    </span>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                        {canAssignTrip && (
                                            <button
                                                onClick={() => openEditDialog(assignment)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 transition-colors"
                                            >
                                                <Pencil className="h-3 w-3" />
                                                Cập nhật
                                            </button>
                                        )}
                                        {canCheckIn && (
                                            <button
                                                onClick={() => handleCheckOpen(assignment, "in")}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                            >
                                                <LogIn className="h-3 w-3" />
                                                Duyệt xuất bãi
                                            </button>
                                        )}
                                        {canCheckOut && (
                                            <button
                                                onClick={() => handleCheckOpen(assignment, "out")}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                            >
                                                <LogOut className="h-3 w-3" />
                                                Duyệt nhập bãi
                                            </button>
                                        )}
                                        {canEndEarly && (
                                            <button
                                                onClick={() => {
                                                    const isPending = assignment.status === "PENDING";
                                                    const msg = isPending
                                                        ? `Hủy ca xe #${assignment.id}? Tất cả chuyến sẽ được giải phóng.`
                                                        : `Kết thúc sớm ca xe #${assignment.id}? Các chuyến chưa chạy sẽ được giải phóng. Bạn vẫn có thể nhập bãi sau.`;
                                                    setEndEarlyConfirm({ id: assignment.id, message: msg });
                                                    setEndEarlyConfirmOpen(true);
                                                }}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                            >
                                                <XCircle className="h-3 w-3" />
                                                {assignment.status === "PENDING" ? "Hủy ca xe" : "Kết thúc sớm"}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded: Trip List + Check details */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 bg-gray-50/30 px-4 py-3 space-y-3">
                                        {/* Check-in/out info */}
                                        {(assignment.checkInTime || assignment.checkOutTime) && (
                                            <div className="grid grid-cols-2 gap-4 text-xs">
                                                {assignment.checkInTime && (
                                                    <div className="bg-blue-50/50 rounded-lg p-2.5">
                                                        <p className="font-semibold text-blue-700 mb-1">↗️ Giao xe (xuất bãi)</p>
                                                        <p>Thời gian: {extractTime(assignment.checkInTime)}</p>
                                                        <p>ODO: {assignment.checkInOdometer} km</p>
                                                        <p>Nhiên liệu: {assignment.checkInFuel}%</p>
                                                        {assignment.checkInByName && <p>XN bởi: {assignment.checkInByName}</p>}
                                                        {assignment.checkInNotes && <p className="italic text-blue-600/80 mt-0.5">{assignment.checkInNotes}</p>}
                                                    </div>
                                                )}
                                                {assignment.checkOutTime && (
                                                    <div className="bg-green-50/50 rounded-lg p-2.5">
                                                        <p className="font-semibold text-green-700 mb-1">↘️ Lấy xe (nhập bãi)</p>
                                                        <p>Thời gian: {extractTime(assignment.checkOutTime)}</p>
                                                        <p>ODO: {assignment.checkOutOdometer} km</p>
                                                        <p>Nhiên liệu: {assignment.checkOutFuel}%</p>
                                                        {assignment.checkOutByName && <p>XN bởi: {assignment.checkOutByName}</p>}
                                                        {assignment.checkOutNotes && <p className="italic text-green-600/80 mt-0.5">{assignment.checkOutNotes}</p>}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Trips */}
                                        <div>
                                            <p className="text-xs font-semibold text-gray-600 mb-2">
                                                Các chuyến trong ca ({assignment.trips?.length || 0})
                                            </p>
                                            {!assignment.trips || assignment.trips.length === 0 ? (
                                                <p className="text-xs text-gray-400 italic">Chưa có chuyến nào được gán</p>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    {assignment.trips.map(trip => (
                                                        <div key={trip.id} className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 p-2.5">
                                                            <span className="text-xs font-mono text-gray-500">{trip.code}</span>
                                                            <span className="text-xs font-medium text-gray-900">
                                                                {extractTime(trip.departureTime)} → {extractTime(trip.arrivalTime)}
                                                            </span>
                                                            <span className="text-xs text-gray-600">{trip.routeName}</span>
                                                            <span className="text-xs text-gray-400 ml-auto">
                                                                {trip.driverName || "Chưa gán tài xế"}
                                                            </span>
                                                            <span className={cn(
                                                                "text-xs px-1.5 py-0.5 rounded",
                                                                trip.status === "APPROVED" ? "bg-green-50 text-green-700" :
                                                                    trip.status === "RUNNING" ? "bg-blue-50 text-blue-700" :
                                                                        trip.status === "COMPLETED" ? "bg-gray-100 text-gray-600" :
                                                                            "bg-yellow-50 text-yellow-700"
                                                            )}>
                                                                {trip.status}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Notes */}
                                        {assignment.notes && (
                                            <div className="text-xs text-gray-500 flex items-start gap-1">
                                                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                                {assignment.notes}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ==================== TimeSelectField ====================
// Component chọn giờ:phút bằng 2 Select dropdown, không dùng native <input type="time">
function TimeSelectField({
    label,
    value,
    onChange,
    required,
    compact,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    required?: boolean;
    compact?: boolean;
}) {
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

    const [hh, mm] = value ? value.split(":") : ["", ""];

    const handleChange = (type: "h" | "m", val: string) => {
        const newH = type === "h" ? val : (hh || "00");
        const newM = type === "m" ? val : (mm || "00");
        onChange(`${newH}:${newM}`);
    };

    const inner = (
        <div className="flex items-center gap-1.5">
            <Select value={hh || undefined} onValueChange={(v: string) => handleChange("h", v)}>
                <SelectTrigger className={compact ? "w-[72px] h-10 text-sm font-medium rounded-lg bg-white border-gray-200 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-brand-blue/20 transition-colors" : "flex-1 h-10 text-sm font-medium rounded-lg bg-white border-gray-200 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-brand-blue/20 transition-colors"}>
                    <SelectValue placeholder="Giờ" />
                </SelectTrigger>
                <SelectContent className="max-h-[220px] rounded-xl border-gray-200 shadow-xl z-[200]">
                    {hours.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <span className="text-gray-400 font-bold text-base leading-none">:</span>
            <Select value={mm || undefined} onValueChange={(v: string) => handleChange("m", v)}>
                <SelectTrigger className={compact ? "w-[72px] h-10 text-sm font-medium rounded-lg bg-white border-gray-200 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-brand-blue/20 transition-colors" : "flex-1 h-10 text-sm font-medium rounded-lg bg-white border-gray-200 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-brand-blue/20 transition-colors"}>
                    <SelectValue placeholder="Phút" />
                </SelectTrigger>
                <SelectContent className="max-h-[220px] rounded-xl border-gray-200 shadow-xl z-[200]">
                    {minutes.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    if (compact) return inner;

    return (
        <div className="space-y-1.5">
            {label && (
                <Label className="text-sm font-medium text-gray-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </Label>
            )}
            {inner}
        </div>
    );
}
