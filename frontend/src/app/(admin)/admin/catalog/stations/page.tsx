"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stationService, StationRequest } from "@/features/admin/services/station-service";
import { getProvinces, Province } from "@/services/api/catalog";
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
import { Plus, Search, Loader2, MapPin, Ban } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Schema Validation
const stationSchema = z.object({
    govCode: z.string().min(1, "Mã bến xe bắt buộc"),
    name: z.string().min(1, "Tên bến xe bắt buộc"),
    address: z.string().min(1, "Địa chỉ bắt buộc"),
    provinceId: z.coerce.number().min(1, "Chọn tỉnh/thành phố"),
});

type StationFormData = z.infer<typeof stationSchema>;

const statusBadge: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "Hoạt động", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
    INACTIVE: { label: "Tạm dừng", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
    CLOSED: { label: "Đã đóng", className: "bg-red-50 text-red-700 ring-red-600/20" },
};

export default function StationsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
    const [deactivateTarget, setDeactivateTarget] = useState<{ id: number; name: string } | null>(null);

    // Fetch stations
    const { data: stations = [], isLoading } = useQuery({
        queryKey: ["admin-stations"],
        queryFn: stationService.getAll,
    });

    // Fetch provinces for dropdown
    const { data: provinces = [] } = useQuery<Province[]>({
        queryKey: ["provinces"],
        queryFn: getProvinces,
    });

    const statusOrder: Record<string, number> = { ACTIVE: 0, INACTIVE: 1, CLOSED: 2 };
    const filteredStations = stations
        .filter(
            (s) =>
                s.name.toLowerCase().includes(search.toLowerCase()) ||
                s.address?.toLowerCase().includes(search.toLowerCase()) ||
                s.govCode?.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

    // Create mutation
    const createMutation = useMutation({
        mutationFn: stationService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-stations"] });
            toast.success("Tạo bến xe thành công");
            setIsDialogOpen(false);
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            const msg = err.response?.data?.message || "Lỗi khi tạo bến xe";
            toast.error(msg);
        },
    });

    // Deactivate mutation
    const deactivateMutation = useMutation({
        mutationFn: stationService.deactivate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-stations"] });
            toast.success("Đã vô hiệu hóa bến xe");
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            const msg = err.response?.data?.message || "Lỗi khi vô hiệu hóa";
            toast.error(msg);
        },
    });

    const form = useForm<StationFormData>({
        resolver: zodResolver(stationSchema) as Resolver<StationFormData>,
        defaultValues: {
            govCode: "",
            name: "",
            address: "",
            provinceId: 0,
        },
    });

    const onSubmit = (data: StationFormData) => {
        const request: StationRequest = {
            govCode: data.govCode,
            name: data.name,
            address: data.address,
            provinceId: data.provinceId,
            status: "ACTIVE",
        };
        createMutation.mutate(request);
    };

    const handleCreate = () => {
        form.reset({ govCode: "", name: "", address: "", provinceId: 0 });
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Bến xe</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Danh mục bến xe pháp lý (Master Data) — Không có chức năng sửa
                    </p>
                </div>
                <Button onClick={handleCreate} className="bg-brand-blue hover:bg-brand-blue/90">
                    <Plus className="mr-2 h-4 w-4" /> Thêm bến xe
                </Button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm tên, mã bến, địa chỉ..."
                            className="pl-10 h-10 w-full sm:w-[300px] bg-gray-50 border-gray-200 focus:ring-brand-blue/20 focus:border-brand-blue"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center text-sm text-gray-500 sm:ml-auto">
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <span className="font-medium text-gray-900">{filteredStations.length}</span>
                        )}
                        &nbsp;bến xe
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Mã bến</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Tên bến xe</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Địa chỉ</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Tỉnh/TP</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Trạng thái</th>
                                <th className="text-right py-3.5 px-4 font-semibold text-gray-600">Thao tác</th>
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
                            ) : filteredStations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-400">
                                        <MapPin className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p>Không tìm thấy bến xe nào</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredStations.map((station) => {
                                    const badge = statusBadge[station.status] || statusBadge.ACTIVE;
                                    return (
                                        <tr key={station.id} className={`transition-colors ${station.status !== "ACTIVE" ? "opacity-50 bg-gray-50/30" : "hover:bg-gray-50/50"}`}>
                                            <td className="py-3.5 px-4 text-gray-500 font-mono text-xs">
                                                {station.govCode}
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-900 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${station.status === "ACTIVE" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                                                        <MapPin className="h-4 w-4" />
                                                    </div>
                                                    {station.name}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-600 max-w-[250px] truncate">
                                                {station.address}
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-600">
                                                {station.provinceName}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.className}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="text-right py-3.5 px-4">
                                                {station.status === "ACTIVE" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                        onClick={() => {
                                                            setDeactivateTarget({ id: station.id, name: station.name });
                                                            setDeactivateConfirmOpen(true);
                                                        }}
                                                        title="Vô hiệu hóa"
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                    </Button>
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

            {/* Create Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white">
                    <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <DialogTitle className="text-lg text-brand-blue">
                            Thêm Bến xe mới
                        </DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
                            <FormField
                                control={form.control}
                                name="govCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mã bến (Gov Code)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="VD: BX_MD" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên bến xe</FormLabel>
                                        <FormControl>
                                            <Input placeholder="VD: BX Miền Đông" {...field} />
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
                                            <Input placeholder="VD: 292 Đinh Bộ Lĩnh, HCM" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="provinceId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tỉnh/Thành phố</FormLabel>
                                        <Select
                                            onValueChange={(val) => field.onChange(Number(val))}
                                            value={field.value ? String(field.value) : ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn tỉnh/thành phố" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-[200px]">
                                                {provinces.map((p) => (
                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
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
                                    disabled={createMutation.isPending}
                                    className="bg-brand-blue hover:bg-brand-blue/90"
                                >
                                    {createMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : null}
                                    Tạo bến xe
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deactivateConfirmOpen}
                onOpenChange={setDeactivateConfirmOpen}
                title="Xác nhận vô hiệu hóa bến"
                description={deactivateTarget ? `Vô hiệu hóa bến "${deactivateTarget.name}"?` : "Vô hiệu hóa bến này?"}
                confirmLabel="Vô hiệu hóa"
                variant="warning"
                isLoading={deactivateMutation.isPending}
                onConfirm={() => {
                    if (!deactivateTarget) return;
                    deactivateMutation.mutate(deactivateTarget.id, {
                        onSuccess: () => {
                            setDeactivateConfirmOpen(false);
                            setDeactivateTarget(null);
                        },
                    });
                }}
            />
        </div>
    );
}
