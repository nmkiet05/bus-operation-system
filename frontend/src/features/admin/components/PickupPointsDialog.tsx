"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2, Plus, Trash2, MapPin, Pencil, Ban, CheckCircle2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { pickupPointService } from "@/features/admin/services/pickup-point-service";
import { Route, PickupPoint, PickupPointRequest } from "@/features/admin/types";

const pickupSchema = z.object({
    name: z.string().min(1, "Tên điểm không được để trống"),
    address: z.string().min(1, "Địa chỉ không được để trống"),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    sequenceOrder: z.coerce.number().min(1),
    estimatedMinutesFromDeparture: z.coerce.number().min(0),
    status: z.enum(["ACTIVE", "INACTIVE"]),
});

type PickupFormData = z.infer<typeof pickupSchema>;

interface PickupPointsDialogProps {
    route: Route | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PickupPointsDialog({ route, open, onOpenChange }: PickupPointsDialogProps) {
    const queryClient = useQueryClient();
    const [editingPoint, setEditingPoint] = useState<PickupPoint | null>(null);

    const { data: pickupPoints = [], isLoading } = useQuery({
        queryKey: ["pickup-points", route?.id],
        queryFn: () => pickupPointService.getByRoute(route!.id),
        enabled: !!route && open,
    });

    const form = useForm<PickupFormData>({
        resolver: zodResolver(pickupSchema) as Resolver<PickupFormData>,
        defaultValues: {
            name: "",
            address: "",
            status: "ACTIVE",
            latitude: 10.762622, // Default HCM
            longitude: 106.660172,
            sequenceOrder: 1,
            estimatedMinutesFromDeparture: 0,
        },
    });

    const resetToAddMode = () => {
        setEditingPoint(null);
        form.reset({
            name: "",
            address: "",
            status: "ACTIVE",
            latitude: 10.762622,
            longitude: 106.660172,
            sequenceOrder: pickupPoints.length + 1,
            estimatedMinutesFromDeparture: 0,
        });
    };

    const createMutation = useMutation({
        mutationFn: (data: PickupPointRequest) => pickupPointService.create(route!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pickup-points", route?.id] });
            toast.success("Thêm điểm đón/trả thành công");
            resetToAddMode();
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            toast.error(err.response?.data?.message || "Lỗi khi thêm điểm");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => pickupPointService.delete(route!.id, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pickup-points", route?.id] });
            toast.success("Xóa thành công");
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            toast.error(err.response?.data?.message || "Lỗi khi xóa");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: PickupPointRequest }) => pickupPointService.update(route!.id, id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pickup-points", route?.id] });
            toast.success("Cập nhật thành công");
            resetToAddMode();
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            toast.error(err.response?.data?.message || "Lỗi khi cập nhật");
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: PickupPointRequest }) => pickupPointService.update(route!.id, id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["pickup-points", route?.id] });
            toast.success(`Đã ${data.status === "ACTIVE" ? "kích hoạt" : "vô hiệu hóa"} điểm đón/trả`);
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            toast.error(err.response?.data?.message || "Lỗi khi chuyển đổi trạng thái");
        },
    });

    const handleEdit = (point: PickupPoint) => {
        setEditingPoint(point);
        form.reset({
            name: point.name,
            address: point.address,
            latitude: point.latitude,
            longitude: point.longitude,
            sequenceOrder: point.sequenceOrder,
            estimatedMinutesFromDeparture: point.estimatedMinutesFromDeparture,
            status: point.status,
        });
    };

    const handleToggleStatus = (point: PickupPoint) => {
        const newStatus = point.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        toggleStatusMutation.mutate({
            id: point.id,
            data: {
                name: point.name,
                address: point.address,
                latitude: point.latitude,
                longitude: point.longitude,
                sequenceOrder: point.sequenceOrder,
                estimatedMinutesFromDeparture: point.estimatedMinutesFromDeparture,
                status: newStatus,
            },
        });
    };

    if (!route) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[1024px] max-w-[95vw] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-xl">
                <DialogHeader className="px-6 py-5 bg-white border-b border-gray-100">
                    <DialogTitle className="text-xl font-bold text-brand-blue flex items-center gap-2">
                        <MapPin className="h-6 w-6 text-brand-blue" />
                        Điểm đón/trả: Tuyến {route.name}
                    </DialogTitle>
                </DialogHeader>

                {/* Layout 2 cột: Bảng bên trái, Form bên phải */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] max-h-[80vh]">

                    {/* ===== CỘT TRÁI: BẢNG DANH SÁCH ===== */}
                    <div className="p-5 overflow-y-auto">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-800 text-sm">
                                Danh sách điểm đón/trả
                            </h4>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full bg-white border">
                                {pickupPoints.length} điểm
                            </span>
                        </div>
                        <div className="rounded-xl border border-gray-200 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="py-2.5 px-3 text-xs">Tên / Địa chỉ</th>
                                        <th className="py-2.5 px-3 text-center text-xs w-[60px]">TT</th>
                                        <th className="py-2.5 px-3 text-center text-xs w-[60px]">Phút</th>
                                        <th className="py-2.5 px-3 text-right text-xs w-[110px]">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-6 text-slate-500">
                                                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Đang tải...
                                            </td>
                                        </tr>
                                    ) : pickupPoints.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-10 text-slate-400">
                                                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                                <p className="text-sm">Chưa có điểm đón/trả</p>
                                                <p className="text-xs mt-1 text-slate-400">Dùng form bên phải để thêm mới</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        pickupPoints.map((p) => (
                                            <tr
                                                key={p.id}
                                                className={cn(
                                                    "border-b last:border-0 border-gray-100 hover:bg-slate-50 transition-colors",
                                                    editingPoint?.id === p.id && "bg-brand-blue/5 ring-1 ring-inset ring-brand-blue/20"
                                                )}
                                            >
                                                <td className="py-2.5 px-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                        <span className="font-medium text-slate-900 text-sm">{p.name}</span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 ml-3 truncate max-w-[200px]" title={p.address}>{p.address}</div>
                                                </td>
                                                <td className="py-2.5 px-3 text-center text-slate-600 text-sm">{p.sequenceOrder}</td>
                                                <td className="py-2.5 px-3 text-center text-slate-600 text-sm">
                                                    +{p.estimatedMinutesFromDeparture}
                                                </td>
                                                <td className="py-2.5 px-3 text-right">
                                                    <div className="flex justify-end gap-0.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleToggleStatus(p)}
                                                            className={cn(
                                                                "h-7 w-7 p-0 transition-all",
                                                                toggleStatusMutation.isPending
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : p.status === 'ACTIVE'
                                                                        ? 'text-green-500 hover:text-amber-600 hover:bg-amber-50'
                                                                        : 'text-amber-500 hover:text-green-600 hover:bg-green-50'
                                                            )}
                                                            disabled={toggleStatusMutation.isPending}
                                                            title={p.status === 'ACTIVE' ? "Vô hiệu hóa" : "Kích hoạt"}
                                                        >
                                                            {toggleStatusMutation.isPending
                                                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                : p.status === 'ACTIVE'
                                                                    ? <CheckCircle2 className="h-3.5 w-3.5" />
                                                                    : <Ban className="h-3.5 w-3.5" />
                                                            }
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(p)}
                                                            className={cn(
                                                                "h-7 w-7 p-0 transition-all",
                                                                editingPoint?.id === p.id
                                                                    ? "text-white bg-brand-blue hover:bg-brand-blue/90"
                                                                    : "text-brand-blue hover:text-brand-blue/80 hover:bg-brand-blue/10"
                                                            )}
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                if (confirm("Chắc chắn xóa điểm đón/trả này?")) {
                                                                    deleteMutation.mutate(p.id);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "h-7 w-7 p-0 transition-all",
                                                                deleteMutation.isPending
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : "text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            )}
                                                            disabled={deleteMutation.isPending}
                                                            title="Xóa"
                                                        >
                                                            {deleteMutation.isPending
                                                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                : <Trash2 className="h-3.5 w-3.5" />
                                                            }
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

                    {/* ===== CỘT PHẢI: FORM ===== */}
                    <div className="border-l border-gray-100 p-5 overflow-y-auto bg-gray-50/50 min-h-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-4 flex-shrink-0">
                            <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                {editingPoint ? (
                                    <>
                                        <Pencil className="h-4 w-4 text-brand-blue" />
                                        Chỉnh sửa điểm
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 text-brand-blue" />
                                        Thêm mới điểm
                                    </>
                                )}
                            </h4>
                            {editingPoint && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetToAddMode}
                                    className="text-xs text-brand-blue hover:text-brand-blue/80 hover:bg-brand-blue/10 h-7 px-2 flex-shrink-0"
                                >
                                    <ArrowLeft className="h-3 w-3 mr-1" />
                                    Hủy sửa
                                </Button>
                            )}
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit((d) => {
                                if (editingPoint) {
                                    updateMutation.mutate({ id: editingPoint.id, data: d });
                                } else {
                                    createMutation.mutate(d);
                                }
                            })} className="flex flex-col flex-1">
                                <div className="space-y-4 flex-1">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold text-gray-600">Tên điểm *</FormLabel>
                                                <FormControl><Input placeholder="VD: Trạm thu phí Định Quán" className="h-9 text-sm rounded bg-white" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold text-gray-600">Địa chỉ *</FormLabel>
                                                <FormControl><Input placeholder="Địa chỉ cụ thể" className="h-9 text-sm rounded bg-white" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField
                                            control={form.control}
                                            name="latitude"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-semibold text-gray-600">Vĩ độ (Lat)</FormLabel>
                                                    <FormControl><Input type="number" step="any" className="h-9 text-sm rounded bg-white text-center font-mono" {...field} /></FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="longitude"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-semibold text-gray-600">Kinh độ (Lng)</FormLabel>
                                                    <FormControl><Input type="number" step="any" className="h-9 text-sm rounded bg-white text-center font-mono" {...field} /></FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField
                                            control={form.control}
                                            name="sequenceOrder"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-semibold text-gray-600">Thứ tự (Order)</FormLabel>
                                                    <FormControl><Input type="number" className="h-9 text-sm rounded bg-white text-center font-mono" {...field} /></FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="estimatedMinutesFromDeparture"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-semibold text-gray-600">Sau xuất bến (Phút)</FormLabel>
                                                    <FormControl><Input type="number" className="h-9 text-sm rounded bg-white text-center font-mono" {...field} /></FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold text-gray-600">Trạng thái</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-9 text-sm rounded bg-white text-gray-800 font-medium"><SelectValue /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                                                        <SelectItem value="INACTIVE">Vô hiệu hóa</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="pt-4 mt-4 border-t border-gray-200/60 mt-auto flex-shrink-0">
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                        className="h-10 text-sm font-semibold bg-brand-blue hover:bg-brand-blue/90 w-full"
                                    >
                                        {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {editingPoint ? "Cập nhật điểm" : "Lưu điểm đón"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
