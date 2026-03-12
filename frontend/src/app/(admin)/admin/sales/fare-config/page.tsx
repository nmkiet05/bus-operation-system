"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fareConfigService } from "@/features/admin/services/fare-config-service";
import { routeService } from "@/features/admin/services/route-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Search, Loader2, DollarSign, Route as RouteIcon, Bus } from "lucide-react";
import { toast } from "sonner";
import { FareConfig, FareConfigRequest, BusType } from "@/features/admin/types";
import { cn } from "@/lib/utils";
import axiosClient from "@/services/http/axios";
import { AdminDatePicker } from "@/features/admin/components/AdminDatePicker";

// Schema
const fareConfigSchema = z.object({
    routeId: z.coerce.number().min(1, "Chọn tuyến đường"),
    busTypeId: z.coerce.number().min(1, "Chọn loại xe"),
    price: z.coerce.number().min(1000, "Giá vé phải >= 1,000đ"),
    effectiveFrom: z.string().min(1, "Ngày bắt đầu bắt buộc"),
    effectiveTo: z.string().optional(),
    isHolidaySurcharge: z.boolean().optional(),
});

type FareConfigFormData = z.infer<typeof fareConfigSchema>;

// Format number to VND
function formatVND(amount: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
}

export default function FareConfigPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Fetch fare configs
    const { data: fares = [], isLoading } = useQuery({
        queryKey: ["fare-configs"],
        queryFn: fareConfigService.getAll,
    });

    // Fetch routes for dropdown
    const { data: routes = [] } = useQuery({
        queryKey: ["routes"],
        queryFn: routeService.getAll,
    });

    // Fetch bus types for dropdown
    const { data: busTypes = [] } = useQuery({
        queryKey: ["bus-types"],
        queryFn: async (): Promise<BusType[]> => {
            const { data } = await axiosClient.get<{
                code: number;
                result: BusType[];
            }>("/fleet/bus-types");
            return data.result;
        },
    });

    // Filter
    const filteredFares = fares.filter((f) => {
        const q = search.toLowerCase();
        return (
            f.routeName?.toLowerCase().includes(q) ||
            f.busTypeName?.toLowerCase().includes(q)
        );
    });

    // Group by route
    const faresByRoute = filteredFares.reduce(
        (acc, fare) => {
            const key = fare.routeName || `Route ${fare.routeId}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(fare);
            return acc;
        },
        {} as Record<string, FareConfig[]>
    );

    // Stats
    const totalConfigs = fares.length;
    const avgPrice =
        fares.length > 0
            ? fares.reduce((sum, f) => sum + f.price, 0) / fares.length
            : 0;
    const routesCovered = new Set(fares.map((f) => f.routeId)).size;

    // Mutation
    const upsertMutation = useMutation({
        mutationFn: fareConfigService.upsert,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fare-configs"] });
            toast.success("Cấu hình giá thành công!");
            setIsDialogOpen(false);
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            const msg =
                err.response?.data?.message || "Lỗi khi cấu hình giá vé";
            toast.error(msg);
        },
    });

    // Form
    const form = useForm<FareConfigFormData>({
        resolver: zodResolver(fareConfigSchema) as Resolver<FareConfigFormData>,
        defaultValues: {
            price: 0,
            isHolidaySurcharge: false,
        },
    });

    const onSubmit = (data: FareConfigFormData) => {
        const payload: FareConfigRequest = {
            routeId: data.routeId,
            busTypeId: data.busTypeId,
            price: data.price,
            effectiveFrom: data.effectiveFrom,
            effectiveTo: data.effectiveTo || undefined,
            isHolidaySurcharge: data.isHolidaySurcharge,
        };
        upsertMutation.mutate(payload);
    };

    const handleCreate = () => {
        form.reset({
            price: 0,
            effectiveFrom: new Date().toISOString().split("T")[0],
            isHolidaySurcharge: false,
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quản Lý Giá Vé
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Cấu hình bảng giá vé theo tuyến đường và loại xe
                    </p>
                </div>
                <Button
                    onClick={handleCreate}
                    className="bg-brand-blue hover:bg-brand-blue/90"
                >
                    <Plus className="mr-2 h-4 w-4" /> Thêm giá vé mới
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                    {
                        label: "Tổng cấu hình",
                        value: totalConfigs,
                        icon: DollarSign,
                        color: "text-blue-600",
                        bg: "bg-blue-50",
                    },
                    {
                        label: "Giá trung bình",
                        value: formatVND(avgPrice),
                        icon: DollarSign,
                        color: "text-emerald-600",
                        bg: "bg-emerald-50",
                    },
                    {
                        label: "Tuyến có giá",
                        value: routesCovered,
                        icon: RouteIcon,
                        color: "text-purple-600",
                        bg: "bg-purple-50",
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3"
                    >
                        <div
                            className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                s.bg
                            )}
                        >
                            <s.icon className={cn("h-5 w-5", s.color)} />
                        </div>
                        <div>
                            <p
                                className={cn(
                                    "text-lg font-bold",
                                    s.color
                                )}
                            >
                                {s.value}
                            </p>
                            <p className="text-xs text-gray-500">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm theo tuyến hoặc loại xe..."
                            className="pl-10 h-10 w-full sm:w-[300px] bg-gray-50 border-gray-200 focus:ring-brand-blue/20 focus:border-brand-blue"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center text-sm text-gray-500 sm:ml-auto">
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <span className="font-medium text-gray-900">
                                {filteredFares.length}
                            </span>
                        )}
                        &nbsp;cấu hình giá
                    </div>
                </div>
            </div>

            {/* Table - Group by Route */}
            {isLoading ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">
                        Đang tải dữ liệu...
                    </p>
                </div>
            ) : Object.keys(faresByRoute).length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-400">
                        Chưa có cấu hình giá vé nào
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(faresByRoute).map(
                        ([routeName, routeFares]) => (
                            <div
                                key={routeName}
                                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                            >
                                {/* Route Header */}
                                <div className="bg-gradient-to-r from-gray-50 to-white px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center">
                                        <RouteIcon className="h-3.5 w-3.5 text-teal-600" />
                                    </div>
                                    <span className="font-semibold text-gray-800 text-sm">
                                        {routeName}
                                    </span>
                                    <span className="ml-auto text-xs text-gray-400">
                                        {routeFares.length} loại giá
                                    </span>
                                </div>

                                {/* Fare Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-50">
                                                <th className="font-medium text-slate-500 py-2.5 px-5 text-left">
                                                    Loại xe
                                                </th>
                                                <th className="font-medium text-slate-500 py-2.5 px-5 text-right">
                                                    Giá vé
                                                </th>
                                                <th className="font-medium text-slate-500 py-2.5 px-5 text-center">
                                                    Áp dụng từ
                                                </th>
                                                <th className="font-medium text-slate-500 py-2.5 px-5 text-center">
                                                    Đến ngày
                                                </th>
                                                <th className="font-medium text-slate-500 py-2.5 px-5 text-center">
                                                    Trạng thái
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {routeFares.map((fare) => (
                                                <tr
                                                    key={fare.id}
                                                    className="hover:bg-gray-50/50 transition-colors"
                                                >
                                                    <td className="py-3 px-5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                                                                <Bus className="h-3.5 w-3.5 text-blue-600" />
                                                            </div>
                                                            <span className="font-medium text-gray-800">
                                                                {fare.busTypeName}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-5 text-right">
                                                        <span className="font-bold text-emerald-600 text-base">
                                                            {formatVND(
                                                                fare.price
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-5 text-center text-gray-600">
                                                        {fare.effectiveFrom
                                                            ? new Date(
                                                                fare.effectiveFrom
                                                            ).toLocaleDateString(
                                                                "vi-VN"
                                                            )
                                                            : "—"}
                                                    </td>
                                                    <td className="py-3 px-5 text-center text-gray-600">
                                                        {fare.effectiveTo
                                                            ? new Date(
                                                                fare.effectiveTo
                                                            ).toLocaleDateString(
                                                                "vi-VN"
                                                            )
                                                            : (
                                                                <span className="text-xs text-gray-400 italic">
                                                                    Vô thời hạn
                                                                </span>
                                                            )}
                                                    </td>
                                                    <td className="py-3 px-5 text-center">
                                                        <span
                                                            className={cn(
                                                                "px-2.5 py-1 rounded-full text-xs font-medium border",
                                                                fare.status ===
                                                                    "ACTIVE"
                                                                    ? "bg-green-50 text-green-700 border-green-200"
                                                                    : "bg-gray-50 text-gray-600 border-gray-200"
                                                            )}
                                                        >
                                                            {fare.status ===
                                                                "ACTIVE"
                                                                ? "Đang áp dụng"
                                                                : fare.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-white">
                    <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <DialogTitle className="text-lg text-brand-blue">
                            Thêm giá vé mới
                        </DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="px-6 py-4 space-y-4"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="routeId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tuyến đường</FormLabel>
                                            <Select
                                                onValueChange={(val) =>
                                                    field.onChange(Number(val))
                                                }
                                                value={field.value?.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn tuyến" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {routes.map((r) => (
                                                        <SelectItem
                                                            key={r.id}
                                                            value={r.id.toString()}
                                                        >
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
                                    name="busTypeId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Loại xe</FormLabel>
                                            <Select
                                                onValueChange={(val) =>
                                                    field.onChange(Number(val))
                                                }
                                                value={field.value?.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn loại xe" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {busTypes.map((bt) => (
                                                        <SelectItem
                                                            key={bt.id}
                                                            value={bt.id.toString()}
                                                        >
                                                            {bt.name} (
                                                            {bt.totalSeats}{" "}
                                                            chỗ)
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Giá vé (VNĐ)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="1000"
                                                placeholder="VD: 350000"
                                                {...field}
                                            />
                                        </FormControl>
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
                                            <FormLabel>
                                                Ngày bắt đầu áp dụng
                                            </FormLabel>
                                            <FormControl>
                                                <AdminDatePicker
                                                    value={field.value ? new Date(field.value) : null}
                                                    onChange={(date) => {
                                                        if (date) {
                                                            const offset = date.getTimezoneOffset();
                                                            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                                                            field.onChange(localDate.toISOString().split('T')[0]);
                                                        } else {
                                                            field.onChange("");
                                                        }
                                                    }}
                                                    placeholder="Chọn ngày bắt đầu"
                                                    allowPastDates
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
                                            <FormLabel>
                                                Ngày kết thúc{" "}
                                                <span className="text-gray-400 text-xs">
                                                    (tùy chọn)
                                                </span>
                                            </FormLabel>
                                            <FormControl>
                                                <AdminDatePicker
                                                    value={field.value ? new Date(field.value) : null}
                                                    onChange={(date) => {
                                                        if (date) {
                                                            const offset = date.getTimezoneOffset();
                                                            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                                                            field.onChange(localDate.toISOString().split('T')[0]);
                                                        } else {
                                                            field.onChange("");
                                                        }
                                                    }}
                                                    placeholder="Chọn ngày kết thúc"
                                                    allowPastDates
                                                    clearable
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
                                <Button
                                    type="submit"
                                    disabled={upsertMutation.isPending}
                                    className="bg-brand-blue hover:bg-brand-blue/90"
                                >
                                    {upsertMutation.isPending && (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    )}
                                    Lưu giá vé
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
