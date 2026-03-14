"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { busService } from "@/features/admin/services/bus-service";
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
import { Plus, Search, Pencil, Trash2, Bus as BusIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BusFleetResponse, BusRequest } from "@/features/admin/types";
import { busTypeService } from "@/features/admin/services/bus-type-service";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Schema Validation
const busSchema = z.object({
    licensePlate: z.string().min(1, "Biển số xe bắt buộc"),
    busTypeId: z.coerce.number().min(1, "Phải chọn loại xe"),
    transportBadgeNumber: z.string().optional(),
    badgeExpiryDate: z.string().optional(),
    gpsDeviceId: z.string().optional(),
    vinNumber: z.string().min(1, "Số khung bắt buộc"),
    engineNumber: z.string().min(1, "Số máy bắt buộc"),
    manufacturingYear: z.coerce.number().min(1900).optional(),
    insuranceExpiryDate: z.string().min(1, "Ngày hết hạn bảo hiểm bắt buộc"),
    registrationExpiryDate: z.string().min(1, "Ngày hết hạn đăng kiểm bắt buộc"),
    status: z.enum(["ACTIVE", "MAINTENANCE", "RETIRED", "BUSY"]).optional(),
});

type BusFormData = z.infer<typeof busSchema>;

export default function BusesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [selectedBus, setSelectedBus] = useState<BusFleetResponse | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetBus, setDeleteTargetBus] = useState<BusFleetResponse | null>(null);

    // Fetch Buses
    const { data: buses = [], isLoading } = useQuery({
        queryKey: ["buses"],
        queryFn: busService.getAll,
    });

    // Fetch Bus Types for Dropdown
    const { data: busTypes = [] } = useQuery({
        queryKey: ["bus-types"],
        queryFn: busTypeService.getAll,
    });

    const filteredBuses = buses.filter((bus) =>
        bus.licensePlate.toLowerCase().includes(search.toLowerCase())
    );

    // Mutations
    const createMutation = useMutation({
        mutationFn: busService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["buses"] });
            toast.success("Thêm xe thành công");
            setIsDialogOpen(false);
        },
        onError: () => toast.error("Lỗi khi thêm xe"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: BusRequest }) =>
            busService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["buses"] });
            toast.success("Cập nhật xe thành công");
            setIsDialogOpen(false);
        },
        onError: () => toast.error("Lỗi khi cập nhật xe"),
    });

    const deleteMutation = useMutation({
        mutationFn: busService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["buses"] });
            toast.success("Xóa xe thành công");
        },
        onError: () => toast.error("Lỗi khi xóa xe"),
    });

    // Form
    const form = useForm<BusFormData>({
        resolver: zodResolver(busSchema) as Resolver<BusFormData>,
        defaultValues: {
            status: "ACTIVE",
            manufacturingYear: new Date().getFullYear(),
            insuranceExpiryDate: "",
            registrationExpiryDate: "",
        },
    });

    const onSubmit = (data: BusFormData) => {
        const payload: BusRequest = {
            ...data,
            badgeExpiryDate: data.badgeExpiryDate || undefined,
            insuranceExpiryDate: data.insuranceExpiryDate,
            registrationExpiryDate: data.registrationExpiryDate,
        };

        if (selectedBus) {
            updateMutation.mutate({ id: selectedBus.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleEdit = (bus: BusFleetResponse) => {
        setSelectedBus(bus);
        form.reset({
            licensePlate: bus.licensePlate,
            busTypeId: 0,
            vinNumber: bus.vinNumber,
            engineNumber: bus.engineNumber,
            manufacturingYear: bus.manufacturingYear,
            insuranceExpiryDate: bus.insuranceExpiryDate || "",
            registrationExpiryDate: bus.registrationExpiryDate || "",
            status: bus.status as "ACTIVE" | "MAINTENANCE" | "RETIRED" | "BUSY" | undefined,
        });

        const type = busTypes.find(t => t.name === bus.busTypeName);
        if (type) {
            form.setValue("busTypeId", type.id);
        }

        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setSelectedBus(null);
        form.reset({
            status: "ACTIVE",
            manufacturingYear: new Date().getFullYear(),
            insuranceExpiryDate: "",
            registrationExpiryDate: "",
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Đội xe</h1>
                    <p className="text-sm text-gray-500 mt-1">Danh sách phương tiện và tình trạng hoạt động</p>
                </div>
                <Button onClick={handleCreate} className="bg-brand-blue hover:bg-brand-blue/90">
                    <Plus className="mr-2 h-4 w-4" /> Thêm xe mới
                </Button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm theo biển số..."
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
                                {filteredBuses.length}
                            </span>
                        )}
                        &nbsp;phương tiện
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Biển số</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Loại xe</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Số ghế</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Thông tin kỹ thuật</th>
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
                            ) : filteredBuses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-400">
                                        <BusIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p>Không tìm thấy xe nào</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredBuses.map((bus) => (
                                    <tr key={bus.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="font-medium text-gray-900 py-3.5 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <BusIcon className="h-4 w-4" />
                                                </div>
                                                {bus.licensePlate}
                                            </div>
                                        </td>
                                        <td className="text-gray-600 py-3.5 px-4">{bus.busTypeName}</td>
                                        <td className="text-gray-600 py-3.5 px-4">{bus.totalSeats}</td>
                                        <td className="py-3.5 px-4">
                                            <div className="text-xs text-gray-500 space-y-0.5">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium text-gray-600 w-8">VIN:</span>
                                                    <span className="font-mono">{bus.vinNumber}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium text-gray-600 w-8">Eng:</span>
                                                    <span className="font-mono">{bus.engineNumber}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span
                                                className={cn(
                                                    "px-2.5 py-1 rounded-full text-xs font-medium border",
                                                    bus.status === "ACTIVE"
                                                        ? "bg-green-50 text-green-700 border-green-200"
                                                        : bus.status === "MAINTENANCE"
                                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                                            : "bg-gray-50 text-gray-700 border-gray-200"
                                                )}
                                            >
                                                {bus.status === "ACTIVE" ? "Đang hoạt động" :
                                                    bus.status === "MAINTENANCE" ? "Bảo trì" :
                                                        bus.status === "BUSY" ? "Đang chạy" : "Ngưng hoạt động"}
                                            </span>
                                        </td>
                                        <td className="text-right py-3.5 px-4">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-gray-500 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg"
                                                    onClick={() => handleEdit(bus)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    onClick={() => {
                                                        setDeleteTargetBus(bus);
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white max-h-[90vh] overflow-y-auto w-11/12">
                    <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <DialogTitle className="text-lg text-brand-blue">
                            {selectedBus ? "Cập nhật thông tin xe" : "Thêm xe mới"}
                        </DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="licensePlate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Biển số xe</FormLabel>
                                            <FormControl>
                                                <Input placeholder="65B-123.45" {...field} />
                                            </FormControl>
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
                                                onValueChange={(val) => field.onChange(Number(val))}
                                                value={field.value?.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn loại xe" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {busTypes.map((type) => (
                                                        <SelectItem
                                                            key={type.id}
                                                            value={type.id.toString()}
                                                        >
                                                            {type.name} ({type.totalSeats} ghế)
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
                                    name="vinNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Số khung (VIN)</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="engineNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Số máy</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="insuranceExpiryDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ngày hết hạn bảo hiểm <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="registrationExpiryDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ngày hết hạn đăng kiểm <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

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
                                                    <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                                                    <SelectItem value="MAINTENANCE">Bảo trì</SelectItem>
                                                    <SelectItem value="BUSY">Đang chạy</SelectItem>
                                                    <SelectItem value="RETIRED">Ngưng hoạt động</SelectItem>
                                                </SelectContent>
                                            </Select>
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
                                    {selectedBus ? "Lưu thay đổi" : "Thêm mới"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Xác nhận xóa xe"
                description={deleteTargetBus ? `Bạn có chắc chắn muốn xóa xe "${deleteTargetBus.licensePlate}"?` : "Bạn có chắc chắn muốn xóa xe này?"}
                confirmLabel="Xóa"
                variant="danger"
                isLoading={deleteMutation.isPending}
                onConfirm={() => {
                    if (!deleteTargetBus) return;
                    deleteMutation.mutate(deleteTargetBus.id, {
                        onSuccess: () => {
                            setDeleteConfirmOpen(false);
                            setDeleteTargetBus(null);
                        },
                    });
                }}
            />
        </div>
    );
}
