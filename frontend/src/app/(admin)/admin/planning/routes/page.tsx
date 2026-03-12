"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { routeService } from "@/features/admin/services/route-service";
import { catalogService } from "@/services/api/catalog";
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
import { Plus, Search, Pencil, Trash2, Route as RouteIcon, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Route, RouteRequest } from "@/features/admin/types";
import { cn } from "@/lib/utils";
import { PickupPointsDialog } from "@/features/admin/components/PickupPointsDialog";

// Schema
const routeSchema = z.object({
    name: z.string().min(1, "Tên tuyến đường bắt buộc"),
    departureStationId: z.coerce.number().min(1, "Chọn bến đi"),
    arrivalStationId: z.coerce.number().min(1, "Chọn bến đến"),
    distance: z.coerce.number().min(0, "Khoảng cách phải >= 0"),
    durationHours: z.coerce.number().min(0, "Thời gian phải >= 0"),
    itineraryDetail: z.string().optional(),
    hotline: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]),
});

type RouteFormData = z.infer<typeof routeSchema>;

export default function RoutesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedRouteForPickup, setSelectedRouteForPickup] = useState<Route | null>(null);
    const [isPickupDialogOpen, setIsPickupDialogOpen] = useState(false);

    // Fetch Routes
    const { data: routes = [], isLoading } = useQuery({
        queryKey: ["routes"],
        queryFn: routeService.getAll,
    });

    // Fetch Stations for Dropdown
    const { data: stations = [] } = useQuery({
        queryKey: ["stations"],
        queryFn: catalogService.getAllStations,
    });

    const filteredRoutes = routes.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase())
    );

    // Mutations
    const createMutation = useMutation({
        mutationFn: routeService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["routes"] });
            toast.success("Tạo tuyến đường thành công");
            setIsDialogOpen(false);
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            const msg = err.response?.data?.message || "Lỗi khi tạo tuyến đường";
            toast.error(msg);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: RouteRequest }) =>
            routeService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["routes"] });
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
        mutationFn: routeService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["routes"] });
            toast.success("Xóa thành công");
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            const msg = err.response?.data?.message || "Lỗi khi xóa";
            toast.error(msg);
        },
    });

    // Form
    const form = useForm<RouteFormData>({
        resolver: zodResolver(routeSchema) as Resolver<RouteFormData>,
        defaultValues: {
            status: "ACTIVE",
            distance: 0,
            durationHours: 0,
        },
    });

    const onSubmit = (data: RouteFormData) => {
        if (data.departureStationId === data.arrivalStationId) {
            form.setError("arrivalStationId", {
                message: "Điểm đến không được trùng điểm đi",
            });
            return;
        }

        const payload: RouteRequest = {
            ...data,
            itineraryDetail: data.itineraryDetail || undefined,
            hotline: data.hotline || undefined,
        };

        if (selectedRoute) {
            updateMutation.mutate({ id: selectedRoute.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleEdit = (route: Route) => {
        setSelectedRoute(route);
        form.reset({
            name: route.name,
            departureStationId: route.departureStationId,
            arrivalStationId: route.arrivalStationId,
            distance: route.distance,
            durationHours: route.durationHours,
            itineraryDetail: route.itineraryDetail || "",
            hotline: route.hotline || "",
            status: route.status,
        });
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setSelectedRoute(null);
        form.reset({
            status: "ACTIVE",
            distance: 0,
            durationHours: 0,
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Tuyến đường</h1>
                    <p className="text-sm text-gray-500 mt-1">Thiết lập lộ trình di chuyển giữa các bến xe</p>
                </div>
                <Button onClick={handleCreate} className="bg-brand-blue hover:bg-brand-blue/90">
                    <Plus className="mr-2 h-4 w-4" /> Thêm tuyến mới
                </Button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm tên tuyến..."
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
                                {filteredRoutes.length}
                            </span>
                        )}
                        &nbsp;tuyến đường
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="font-medium text-slate-500 py-3 px-4 w-56">Tên tuyến</th>
                                <th className="font-medium text-slate-500 py-3 px-4 w-28">Mã tuyến</th>
                                <th className="font-medium text-slate-500 py-3 px-4 w-28">Khoảng cách</th>
                                <th className="font-medium text-slate-500 py-3 px-4 w-28">Thời gian</th>
                                <th className="font-medium text-slate-500 py-3 px-4 w-32 text-center">Trạng thái</th>
                                <th className="font-medium text-slate-500 py-3 px-4 w-32 text-center">Điểm đón/trả</th>
                                <th className="font-medium text-slate-500 py-3 px-4 w-24 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredRoutes.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-400">
                                        <RouteIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p>Không tìm thấy tuyến đường nào</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRoutes.map((route) => (
                                    <tr key={route.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="font-medium text-gray-900 py-3.5 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                                                    <RouteIcon className="h-4 w-4" />
                                                </div>
                                                {route.name}
                                            </div>
                                        </td>
                                        <td className="text-gray-600 py-3.5 px-4">
                                            <span className="font-mono text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 border border-gray-200">
                                                {route.code}
                                            </span>
                                        </td>
                                        <td className="text-gray-600 py-3.5 px-4">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                                {route.distance} km
                                            </span>
                                        </td>
                                        <td className="text-gray-600 py-3.5 px-4">{route.durationHours} giờ</td>
                                        <td className="py-3.5 px-4">
                                            <span
                                                className={cn(
                                                    "px-2.5 py-1 rounded-full text-xs font-medium border",
                                                    route.status === "ACTIVE"
                                                        ? "bg-green-50 text-green-700 border-green-200"
                                                        : "bg-gray-50 text-gray-700 border-gray-200"
                                                )}
                                            >
                                                {route.status === "ACTIVE" ? "Đang khai thác" : "Tạm ngưng"}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-brand-blue hover:text-brand-blue hover:bg-brand-blue/5 border-brand-blue/20"
                                                onClick={() => {
                                                    setSelectedRouteForPickup(route);
                                                    setIsPickupDialogOpen(true);
                                                }}
                                            >
                                                <MapPin className="h-4 w-4 mr-1.5" />
                                                Quản lý
                                            </Button>
                                        </td>
                                        <td className="text-right py-3.5 px-4">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-gray-500 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg"
                                                    onClick={() => handleEdit(route)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    onClick={() => {
                                                        if (confirm("Xóa tuyến đường này?")) {
                                                            deleteMutation.mutate(route.id);
                                                        }
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white">
                    <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <DialogTitle className="text-lg text-brand-blue">
                            {selectedRoute ? "Cập nhật tuyến đường" : "Thêm tuyến đường mới"}
                        </DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên tuyến đường</FormLabel>
                                        <FormControl>
                                            <Input placeholder="VD: Cần Thơ - Sài Gòn" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="departureStationId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bến đi</FormLabel>
                                            <Select
                                                onValueChange={(val) => field.onChange(Number(val))}
                                                value={field.value?.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn bến đi" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {stations.map((s) => (
                                                        <SelectItem key={s.id} value={s.id.toString()}>
                                                            {s.name} ({s.provinceName})
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
                                    name="arrivalStationId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bến đến</FormLabel>
                                            <Select
                                                onValueChange={(val) => field.onChange(Number(val))}
                                                value={field.value?.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn bến đến" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {stations.map((s) => (
                                                        <SelectItem key={s.id} value={s.id.toString()}>
                                                            {s.name} ({s.provinceName})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="distance"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Khoảng cách (km)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="durationHours"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Thời gian di chuyển (giờ)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.5" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Trạng thái</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ACTIVE">Đang khai thác</SelectItem>
                                                <SelectItem value="INACTIVE">Tạm ngưng</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-6 -mx-6 px-6 pb-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-brand-blue hover:bg-brand-blue/90">
                                    {selectedRoute ? "Lưu thay đổi" : "Tạo mới"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Pickup Points Dialog Component */}
            <PickupPointsDialog
                route={selectedRouteForPickup}
                open={isPickupDialogOpen}
                onOpenChange={setIsPickupDialogOpen}
            />
        </div>
    );
}
