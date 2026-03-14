"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scheduleService } from "@/features/admin/services/schedule-service";
import { routeService } from "@/features/admin/services/route-service";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useForm, Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, CalendarClock, Play, Route as RouteIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TripSchedule, TripScheduleRequest } from "@/features/admin/types";
import { cn } from "@/lib/utils";
import { AdminDatePicker } from "@/features/admin/components/AdminDatePicker";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Schema
const scheduleSchema = z.object({
    routeId: z.coerce.number().min(1, "Chọn tuyến đường"),
    departureTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Giờ không hợp lệ (HH:mm)"),
    daysOfWeek: z.array(z.number()).min(1, "Chọn ít nhất 1 ngày chạy"),
    effectiveFrom: z.string().min(1, "Ngày bắt đầu bắt buộc"),
    effectiveTo: z.string().min(1, "Ngày kết thúc bắt buộc"),
    status: z.enum(["ACTIVE", "INACTIVE"]),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

const DAYS_OF_WEEK = [
    { value: 2, label: "Thứ 2" },
    { value: 3, label: "Thứ 3" },
    { value: 4, label: "Thứ 4" },
    { value: 5, label: "Thứ 5" },
    { value: 6, label: "Thứ 6" },
    { value: 7, label: "Thứ 7" },
    { value: 8, label: "CN" },
];

export default function SchedulesPage() {
    const queryClient = useQueryClient();
    const [selectedRouteId, setSelectedRouteId] = useState<string>("");
    const [selectedSchedule, setSelectedSchedule] = useState<TripSchedule | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [genFromDate, setGenFromDate] = useState<Date | null>(null);
    const [genToDate, setGenToDate] = useState<Date | null>(null);

    // Fetch Routes (to filter schedules)
    const { data: routes = [] } = useQuery({
        queryKey: ["routes"],
        queryFn: routeService.getAll,
    });

    // Fetch Schedules (Dependent on selectedRouteId)
    const { data: schedules = [], isLoading } = useQuery({
        queryKey: ["schedules", selectedRouteId],
        queryFn: () => scheduleService.getByRoute(Number(selectedRouteId)),
        enabled: !!selectedRouteId,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: scheduleService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["schedules"] });
            toast.success("Tạo lịch trình thành công");
            setIsDialogOpen(false);
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            const msg = err.response?.data?.message || "Lỗi khi tạo lịch trình";
            toast.error(msg);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: TripScheduleRequest }) =>
            scheduleService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["schedules"] });
            toast.success("Cập nhật thành công");
            setIsDialogOpen(false);
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            const msg = err.response?.data?.message || "Lỗi khi cập nhật";
            toast.error(msg);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: scheduleService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["schedules"] });
            toast.success("Xóa thành công");
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            const msg = err.response?.data?.message || "Lỗi khi xóa";
            toast.error(msg);
        },
    });

    const generateMutation = useMutation({
        mutationFn: ({ from, to }: { from: string; to: string }) =>
            scheduleService.generate(from, to),
        onSuccess: () => {
            toast.success("Sinh chuyến xe thành công! Hãy kiểm tra màn hình Quản lý chuyến.");
            setIsGenerateDialogOpen(false);
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            toast.error(err?.response?.data?.message || "Lỗi khi sinh chuyến");
        }
    });

    // Form
    const form = useForm<ScheduleFormData>({
        resolver: zodResolver(scheduleSchema) as Resolver<ScheduleFormData>,
        defaultValues: {
            status: "ACTIVE",
            daysOfWeek: [2, 3, 4, 5, 6, 7, 8], // Default run every day
        },
    });

    const onSubmit = (data: ScheduleFormData) => {
        const payload: TripScheduleRequest = data;
        if (selectedSchedule) {
            updateMutation.mutate({ id: selectedSchedule.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleEdit = (schedule: TripSchedule) => {
        setSelectedSchedule(schedule);
        form.reset({
            routeId: schedule.routeId,
            departureTime: schedule.departureTime.slice(0, 5), // Ensure HH:mm
            daysOfWeek: schedule.daysOfWeek,
            effectiveFrom: schedule.effectiveFrom,
            effectiveTo: schedule.effectiveTo,
            status: schedule.status,
        });
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        if (!selectedRouteId) {
            toast.warning("Vui lòng chọn tuyến đường ở bộ lọc trước khi thêm lịch trình");
            return;
        }
        setSelectedSchedule(null);
        form.reset({
            routeId: Number(selectedRouteId),
            daysOfWeek: [2, 3, 4, 5, 6, 7, 8],
            status: "ACTIVE",
            effectiveFrom: new Date().toISOString().split('T')[0],
            effectiveTo: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0], // End of year
        });
        setIsDialogOpen(true);
    };

    const handleGenerate = () => {
        if (!genFromDate || !genToDate) {
            toast.warning("Vui lòng chọn ngày bắt đầu và kết thúc");
            return;
        }
        const fromStr = format(genFromDate, "yyyy-MM-dd");
        const toStr = format(genToDate, "yyyy-MM-dd");
        generateMutation.mutate({ from: fromStr, to: toStr });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Lịch chạy</h1>
                    <p className="text-sm text-gray-500 mt-1">Cấu hình khung giờ chạy cố định cho các tuyến</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsGenerateDialogOpen(true)}
                        className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                    >
                        <Play className="mr-2 h-4 w-4 text-brand-blue" /> Sinh chuyến tự động
                    </Button>
                    <Button onClick={handleCreate} disabled={!selectedRouteId} className="bg-brand-blue hover:bg-brand-blue/90">
                        <Plus className="mr-2 h-4 w-4" /> Thêm lịch trình
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <RouteIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                            <SelectTrigger className="w-[300px] pl-10 h-10 bg-gray-50 border-gray-200 focus:ring-brand-blue/20">
                                <SelectValue placeholder="-- Chọn tuyến đường --" />
                            </SelectTrigger>
                            <SelectContent>
                                {routes.map(r => (
                                    <SelectItem key={r.id} value={r.id.toString()}>
                                        {r.name} ({r.distance} km)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center text-sm text-gray-500 sm:ml-auto">
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <span className="font-medium text-gray-900">
                                {schedules.length}
                            </span>
                        )}
                        &nbsp;khung giờ
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Giờ xuất bến</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Ngày chạy trong tuần</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Hiệu lực từ</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Hiệu lực đến</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Trạng thái</th>
                                <th className="text-right py-3.5 px-4 font-semibold text-gray-600">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {!selectedRouteId ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-16 text-gray-500">
                                        <RouteIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p>Vui lòng chọn tuyến đường để xem lịch trình</p>
                                    </td>
                                </tr>
                            ) : isLoading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-blue" />
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : schedules.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-16 text-gray-500">
                                        <CalendarClock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p>Chưa có lịch trình nào cho tuyến này</p>
                                    </td>
                                </tr>
                            ) : (
                                schedules.map((schedule) => (
                                    <tr key={schedule.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <CalendarClock className="h-4 w-4" />
                                                </div>
                                                <span className="font-bold text-gray-900">{schedule.departureTime.slice(0, 5)}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex gap-1">
                                                {DAYS_OF_WEEK.map(d => (
                                                    <span
                                                        key={d.value}
                                                        className={cn(
                                                            "w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold",
                                                            schedule.daysOfWeek.includes(d.value)
                                                                ? "bg-brand-blue/10 text-brand-blue"
                                                                : "bg-gray-100 text-gray-300"
                                                        )}
                                                    >
                                                        {d.value === 8 ? "CN" : "T" + d.value}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-600">{schedule.effectiveFrom}</td>
                                        <td className="py-3.5 px-4 text-gray-600">{schedule.effectiveTo}</td>
                                        <td className="py-3.5 px-4">
                                            <span
                                                className={cn(
                                                    "px-2.5 py-1 rounded-full text-xs font-medium border",
                                                    schedule.status === "ACTIVE"
                                                        ? "bg-green-50 text-green-700 border-green-200"
                                                        : "bg-gray-50 text-gray-700 border-gray-200"
                                                )}
                                            >
                                                {schedule.status}
                                            </span>
                                        </td>
                                        <td className="text-right py-3.5 px-4">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-gray-500 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg"
                                                    onClick={() => handleEdit(schedule)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    onClick={() => {
                                                        setDeleteTargetId(schedule.id);
                                                        setDeleteConfirmOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Xác nhận xóa lịch trình"
                description="Bạn có chắc muốn xóa lịch trình này?"
                confirmLabel="Xóa"
                variant="danger"
                isLoading={deleteMutation.isPending}
                onConfirm={() => {
                    if (deleteTargetId == null) return;
                    deleteMutation.mutate(deleteTargetId, {
                        onSuccess: () => {
                            setDeleteConfirmOpen(false);
                            setDeleteTargetId(null);
                        },
                    });
                }}
            />

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white">
                    <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <DialogTitle className="text-lg text-brand-blue">
                            {selectedSchedule ? "Cập nhật lịch trình" : "Thêm lịch trình"}
                        </DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
                            <FormField
                                control={form.control}
                                name="routeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tuyến đường</FormLabel>
                                        <Select
                                            onValueChange={(val) => field.onChange(Number(val))}
                                            value={field.value.toString()}
                                            disabled={true} // Lock route selection in edit or create (auto-selected)
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn tuyến đường" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {routes.map((r) => (
                                                    <SelectItem key={r.id} value={r.id.toString()}>
                                                        {r.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="departureTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Giờ xuất bến (HH:mm)</FormLabel>
                                        <FormControl>
                                            <div className="h-10 border border-gray-200 rounded-md overflow-hidden bg-white hover:border-brand-blue focus-within:border-brand-blue transition-colors px-3 flex items-center">
                                                <input
                                                    type="time"
                                                    className="w-full h-full bg-transparent border-none outline-none focus:ring-0 text-sm"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="daysOfWeek"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ngày chạy trong tuần</FormLabel>
                                        <div className="flex gap-2 flex-wrap">
                                            {DAYS_OF_WEEK.map((day) => (
                                                <Button
                                                    key={day.value}
                                                    type="button"
                                                    variant={field.value.includes(day.value) ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => {
                                                        const current = field.value;
                                                        if (current.includes(day.value)) {
                                                            field.onChange(current.filter(d => d !== day.value));
                                                        } else {
                                                            field.onChange([...current, day.value].sort());
                                                        }
                                                    }}
                                                >
                                                    {day.label}
                                                </Button>
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="effectiveFrom"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Hiệu lực từ</FormLabel>
                                            <FormControl>
                                                <AdminDatePicker
                                                    value={field.value ? new Date(field.value) : null}
                                                    onChange={(date) => {
                                                        if (date) {
                                                            // Convert to local YYYY-MM-DD
                                                            const offset = date.getTimezoneOffset();
                                                            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                                                            field.onChange(localDate.toISOString().split('T')[0]);
                                                        } else {
                                                            field.onChange("");
                                                        }
                                                    }}
                                                    placeholder="Chọn ngày bắt đầu"
                                                    className="w-full"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="effectiveTo"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Hiệu lực đến</FormLabel>
                                            <FormControl>
                                                <AdminDatePicker
                                                    value={field.value ? new Date(field.value) : null}
                                                    onChange={(date) => {
                                                        if (date) {
                                                            // Convert to local YYYY-MM-DD
                                                            const offset = date.getTimezoneOffset();
                                                            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                                                            field.onChange(localDate.toISOString().split('T')[0]);
                                                        } else {
                                                            field.onChange("");
                                                        }
                                                    }}
                                                    placeholder="Chọn ngày kết thúc"
                                                    className="w-full"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-6 -mx-6 px-6 pb-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-brand-blue hover:bg-brand-blue/90">
                                    {selectedSchedule ? "Lưu thay đổi" : "Thêm mới"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Generate Dialog */}
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white">
                    <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <DialogTitle className="text-lg text-brand-blue">Sinh chuyến chạy tự động</DialogTitle>
                    </DialogHeader>
                    <div className="px-6 py-4 space-y-4">
                        <p className="text-sm text-gray-500">
                            Hệ thống sẽ dựa trên các Lịch trình mẫu (Active) để sinh ra các Chuyến xe (Trips) cho khoảng thời gian bạn chọn.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 flex flex-col">
                                <label className="text-sm font-medium">Từ ngày</label>
                                <AdminDatePicker
                                    value={genFromDate}
                                    onChange={(d) => setGenFromDate(d || null)}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <label className="text-sm font-medium">Đến ngày</label>
                                <AdminDatePicker
                                    value={genToDate}
                                    onChange={(d) => setGenToDate(d || null)}
                                    className="w-full"
                                    minDate={genFromDate || undefined}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                        <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleGenerate} disabled={generateMutation.isPending} className="bg-brand-blue hover:bg-brand-blue/90">
                            {generateMutation.isPending ? "Đang xử lý..." : "Bắt đầu sinh chuyến"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
