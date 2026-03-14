"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { depotService, DepotRequest } from "@/features/admin/services/depot-service";
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
import { Plus, Search, Pencil, Trash2, Loader2, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Schema Validation
const depotSchema = z.object({
    name: z.string().min(1, "Tên bãi xe bắt buộc"),
    address: z.string().optional(),
    capacity: z.coerce.number().min(0, "Sức chứa phải >= 0").optional().or(z.literal("")),
    latitude: z.coerce.number().optional().or(z.literal("")),
    longitude: z.coerce.number().optional().or(z.literal("")),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

type DepotFormData = z.infer<typeof depotSchema>;

interface DepotItem {
    id: number;
    name: string;
    address: string;
    capacity: number | null;
    latitude: number | null;
    longitude: number | null;
    status: "ACTIVE" | "INACTIVE";
}

const statusBadge: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "Hoạt động", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
    INACTIVE: { label: "Ngừng hoạt động", className: "bg-gray-50 text-gray-600 ring-gray-500/20" },
};

export default function DepotsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [selectedDepot, setSelectedDepot] = useState<DepotItem | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetDepot, setDeleteTargetDepot] = useState<DepotItem | null>(null);

    // Fetch depots
    const { data: depots = [], isLoading } = useQuery<DepotItem[]>({
        queryKey: ["admin-depots"],
        queryFn: depotService.getAll,
    });

    const filteredDepots = depots.filter(
        (d) =>
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.address?.toLowerCase().includes(search.toLowerCase())
    );

    // Mutations
    const createMutation = useMutation({
        mutationFn: depotService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-depots"] });
            toast.success("Tạo bãi xe thành công");
            setIsDialogOpen(false);
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            toast.error(err.response?.data?.message || "Lỗi khi tạo bãi xe");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: DepotRequest }) =>
            depotService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-depots"] });
            toast.success("Cập nhật thành công");
            setIsDialogOpen(false);
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            toast.error(err.response?.data?.message || "Lỗi khi cập nhật");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: depotService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-depots"] });
            toast.success("Xóa bãi xe thành công");
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            toast.error(err.response?.data?.message || "Lỗi khi xóa");
        },
    });

    const form = useForm<DepotFormData>({
        resolver: zodResolver(depotSchema) as Resolver<DepotFormData>,
        defaultValues: {
            name: "",
            address: "",
            capacity: "",
            latitude: "",
            longitude: "",
            status: "ACTIVE",
        },
    });

    const onSubmit = (data: DepotFormData) => {
        const request: DepotRequest = {
            name: data.name,
            address: data.address || undefined,
            capacity: typeof data.capacity === "number" ? data.capacity : undefined,
            latitude: typeof data.latitude === "number" ? data.latitude : undefined,
            longitude: typeof data.longitude === "number" ? data.longitude : undefined,
            status: data.status,
        };
        if (selectedDepot) {
            updateMutation.mutate({ id: selectedDepot.id, data: request });
        } else {
            createMutation.mutate(request);
        }
    };

    const handleCreate = () => {
        setSelectedDepot(null);
        form.reset({
            name: "",
            address: "",
            capacity: "",
            latitude: "",
            longitude: "",
            status: "ACTIVE",
        });
        setIsDialogOpen(true);
    };

    const handleEdit = (depot: DepotItem) => {
        setSelectedDepot(depot);
        form.reset({
            name: depot.name,
            address: depot.address || "",
            capacity: depot.capacity ?? "",
            latitude: depot.latitude ?? "",
            longitude: depot.longitude ?? "",
            status: depot.status,
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Bãi xe</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Bãi đỗ xe do công ty quản lý — Hỗ trợ đầy đủ thêm/sửa/xóa
                    </p>
                </div>
                <Button onClick={handleCreate} className="bg-brand-blue hover:bg-brand-blue/90">
                    <Plus className="mr-2 h-4 w-4" /> Thêm bãi xe
                </Button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm tên bãi xe, địa chỉ..."
                            className="pl-10 h-10 w-full sm:w-[300px] bg-gray-50 border-gray-200 focus:ring-brand-blue/20 focus:border-brand-blue"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center text-sm text-gray-500 sm:ml-auto">
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <span className="font-medium text-gray-900">{filteredDepots.length}</span>
                        )}
                        &nbsp;bãi xe
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Tên bãi xe</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Địa chỉ</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Sức chứa</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Trạng thái</th>
                                <th className="text-right py-3.5 px-4 font-semibold text-gray-600">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-500">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredDepots.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-400">
                                        <Warehouse className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p>Không tìm thấy bãi xe nào</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredDepots.map((depot) => {
                                    const badge = statusBadge[depot.status] || statusBadge.ACTIVE;
                                    return (
                                        <tr key={depot.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-3.5 px-4 text-gray-900 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                                        <Warehouse className="h-4 w-4" />
                                                    </div>
                                                    {depot.name}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-600 max-w-[250px] truncate">
                                                {depot.address || "—"}
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-600">
                                                {depot.capacity != null ? `${depot.capacity} xe` : "—"}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.className}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="text-right py-3.5 px-4">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-gray-500 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg"
                                                        onClick={() => handleEdit(depot)}
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                        onClick={() => {
                                                            setDeleteTargetDepot(depot);
                                                            setDeleteConfirmOpen(true);
                                                        }}
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white">
                    <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <DialogTitle className="text-lg text-brand-blue">
                            {selectedDepot ? "Chỉnh sửa Bãi xe" : "Thêm Bãi xe mới"}
                        </DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên bãi xe *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="VD: Bãi xe Thủ Đức" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Địa chỉ</FormLabel>
                                        <FormControl>
                                            <Input placeholder="VD: Xa lộ Hà Nội, Thủ Đức, HCM" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="capacity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sức chứa (số xe)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="VD: 50"
                                                {...field}
                                                value={field.value === "" ? "" : field.value}
                                                onChange={(e) =>
                                                    field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="latitude"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vĩ độ (Lat)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.00000001"
                                                    placeholder="VD: 10.858"
                                                    {...field}
                                                    value={field.value === "" ? "" : field.value}
                                                    onChange={(e) =>
                                                        field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="longitude"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kinh độ (Lng)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.00000001"
                                                    placeholder="VD: 106.771"
                                                    {...field}
                                                    value={field.value === "" ? "" : field.value}
                                                    onChange={(e) =>
                                                        field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)
                                                    }
                                                />
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
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn trạng thái" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                                                <SelectItem value="INACTIVE">Ngừng hoạt động</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-6 -mx-6 px-6 pb-2">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Hủy
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="bg-brand-blue hover:bg-brand-blue/90"
                                >
                                    {(createMutation.isPending || updateMutation.isPending) && (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    )}
                                    {selectedDepot ? "Lưu thay đổi" : "Tạo bãi xe"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Xác nhận xóa bãi xe"
                description={deleteTargetDepot ? `Xóa bãi xe "${deleteTargetDepot.name}"?` : "Xóa bãi xe này?"}
                confirmLabel="Xóa"
                variant="danger"
                isLoading={deleteMutation.isPending}
                onConfirm={() => {
                    if (!deleteTargetDepot) return;
                    deleteMutation.mutate(deleteTargetDepot.id, {
                        onSuccess: () => {
                            setDeleteConfirmOpen(false);
                            setDeleteTargetDepot(null);
                        },
                    });
                }}
            />
        </div>
    );
}
