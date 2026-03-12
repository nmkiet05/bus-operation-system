"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { busTypeService, BusTypeRequest } from "@/features/admin/services/bus-type-service";
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
import { useForm, Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Armchair, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { BusType, SeatMapItem } from "@/features/admin/types";
import { SeatMap } from "@/features/booking/components/SeatMap";

// Schema Validation
const busTypeSchema = z.object({
    name: z.string().min(1, "Tên loại xe bắt buộc"),
    totalSeats: z.coerce.number().min(1, "Số ghế phải lớn hơn 0"),
    seatType: z.enum(["NORMAL", "VIP", "BED"]).default("NORMAL"),
    floorConfig: z.enum(["KEEP_ORIGINAL", "1_FLOOR", "2_FLOORS_SAME"]).default("1_FLOOR"),
});

type BusTypeFormData = z.infer<typeof busTypeSchema>;

export default function BusTypesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [selectedType, setSelectedType] = useState<BusType | null>(null);
    const [previewType, setPreviewType] = useState<BusType | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Fetch
    const { data: busTypes = [], isLoading } = useQuery({
        queryKey: ["bus-types"],
        queryFn: busTypeService.getAll,
    });

    const filteredTypes = busTypes.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
    );

    // Mutation
    const createMutation = useMutation({
        mutationFn: busTypeService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bus-types"] });
            toast.success("Tạo loại xe thành công");
            setIsDialogOpen(false);
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            const msg = err.response?.data?.message || "Lỗi khi tạo loại xe";
            toast.error(msg);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: BusTypeRequest }) =>
            busTypeService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bus-types"] });
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
        mutationFn: busTypeService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bus-types"] });
            toast.success("Xóa thành công");
        },
        onError: (error: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const err = error as any;
            const msg = err.response?.data?.message || "Lỗi khi xóa";
            toast.error(msg);
        },
    });

    const form = useForm<BusTypeFormData>({
        resolver: zodResolver(busTypeSchema) as Resolver<BusTypeFormData>,
        defaultValues: {
            name: "",
            totalSeats: 34,
            seatType: "NORMAL",
            floorConfig: "1_FLOOR",
        },
    });

    const onSubmit = (data: BusTypeFormData) => {
        try {
            const generateSeatMap = (seats: number, type: string, floorConfig: string, originalMap?: SeatMapItem[]): SeatMapItem[] => {
                if (floorConfig === "KEEP_ORIGINAL" && originalMap) return originalMap;

                const isTwoFloors = floorConfig === "2_FLOORS_SAME";
                const totalFloors = isTwoFloors ? 2 : 1;
                const seatsPerFloor = Math.ceil(seats / totalFloors);
                const cols = (type === "BED" || type === "VIP") ? ['A', 'B'] : ['A', 'B', 'C', 'D'];
                const rowsPerFloor = Math.ceil(seatsPerFloor / cols.length);
                const map: SeatMapItem[] = [];
                let seatCount = 0;

                for (let f = 1; f <= totalFloors; f++) {
                    let seatsOnThisFloor = 0;
                    for (let r = 1; r <= rowsPerFloor; r++) {
                        for (const c of cols) {
                            if (seatCount < seats && seatsOnThisFloor < seatsPerFloor) {
                                map.push({ row: r, col: c, type: type, floor: f });
                                seatCount++;
                                seatsOnThisFloor++;
                            }
                        }
                    }
                }
                return map;
            };

            const payload: BusTypeRequest = {
                name: data.name,
                totalSeats: data.totalSeats,
                seatMap: generateSeatMap(data.totalSeats, data.seatType, data.floorConfig, selectedType?.seatMap as SeatMapItem[]),
            };

            if (selectedType) {
                updateMutation.mutate({ id: selectedType.id, data: payload });
            } else {
                createMutation.mutate(payload);
            }
        } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : "Lỗi khi lưu loại xe";
            toast.error(errMessage);
        }
    };

    const handleEdit = (type: BusType) => {
        setSelectedType(type);
        // Guess the seat type from the first seat in the map, default to NORMAL
        const guessedSeatType = type.seatMap?.[0]?.type || "NORMAL";
        form.reset({
            name: type.name,
            totalSeats: type.totalSeats,
            seatType: guessedSeatType as "NORMAL" | "VIP" | "BED",
            floorConfig: "KEEP_ORIGINAL",
        });
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setSelectedType(null);
        form.reset({
            name: "",
            totalSeats: 34,
            seatType: "NORMAL",
            floorConfig: "1_FLOOR",
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Loại xe</h1>
                    <p className="text-sm text-gray-500 mt-1">Định nghĩa các loại phương tiện và sơ đồ ghế</p>
                </div>
                <Button onClick={handleCreate} className="bg-brand-blue hover:bg-brand-blue/90">
                    <Plus className="mr-2 h-4 w-4" /> Tạo loại mới
                </Button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm tên loại xe..."
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
                                {filteredTypes.length}
                            </span>
                        )}
                        &nbsp;loại xe
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Tên loại xe</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Số ghế</th>
                                <th className="text-right py-3.5 px-4 font-semibold text-gray-600">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="text-center py-10 text-gray-500">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredTypes.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="text-center py-12 text-gray-400">
                                        <Armchair className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p>Không tìm thấy loại xe nào</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTypes.map((type) => (
                                    <tr key={type.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3.5 px-4 text-gray-900 font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <Armchair className="h-4 w-4" />
                                                </div>
                                                {type.name}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-600">{type.totalSeats} chỗ</td>
                                        <td className="text-right py-3.5 px-4">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                    onClick={() => setPreviewType(type)}
                                                    title="Xem sơ đồ ghế"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-gray-500 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg"
                                                    onClick={() => handleEdit(type)}
                                                    title="Chỉnh sửa"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    onClick={() => {
                                                        if (confirm("Xóa loại xe này?")) {
                                                            deleteMutation.mutate(type.id);
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
                            {selectedType ? "Chỉnh sửa loại xe" : "Tạo loại xe mới"}
                        </DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên loại xe</FormLabel>
                                        <FormControl>
                                            <Input placeholder="VD: Limousine 34 phòng" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="totalSeats"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số ghế</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="seatType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Loại ghế</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white border-0 shadow-none ring-1 ring-gray-100 focus-visible:ring-brand-blue/30 focus-visible:ring-[2px]">
                                                    <SelectValue placeholder="Chọn loại ghế" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="NORMAL">Ghế ngồi (Normal)</SelectItem>
                                                <SelectItem value="VIP">Ghế VIP (Limousine)</SelectItem>
                                                <SelectItem value="BED">Giường nằm (Bed)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-brand-blue pt-1">
                                            Sơ đồ ghế được hệ thống sinh tự động dựa trên cấu hình tầng.
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="floorConfig"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cấu hình Tầng</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white border-0 shadow-none ring-1 ring-gray-100 focus-visible:ring-brand-blue/30 focus-visible:ring-[2px]">
                                                    <SelectValue placeholder="Chọn cấu hình tầng" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {selectedType && <SelectItem value="KEEP_ORIGINAL">Giữ nguyên sơ đồ hiện tại</SelectItem>}
                                                <SelectItem value="1_FLOOR">1 tầng</SelectItem>
                                                <SelectItem value="2_FLOORS_SAME">2 tầng (cùng sơ đồ)</SelectItem>
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
                                    {selectedType ? "Lưu thay đổi" : "Tạo mới"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!previewType} onOpenChange={(open) => !open && setPreviewType(null)}>
                <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-xl">
                    <DialogHeader className="px-6 py-5 bg-white border-0">
                        <DialogTitle className="text-xl font-bold text-brand-blue flex items-center gap-2">
                            Sơ đồ ghế: {previewType?.name} ({previewType?.totalSeats} chỗ)
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 bg-gray-50 max-h-[70vh] overflow-y-auto">
                        {previewType && (
                            <SeatMap
                                seats={(() => {
                                    const mapHasCoords = previewType.seatMap?.some(s => s.row !== undefined && s.col !== undefined);
                                    if (mapHasCoords) {
                                        let floor1Count = 0;
                                        let floor2Count = 0;
                                        return previewType.seatMap.map((s, idx) => {
                                            const colStr = String(s.col || 'A');
                                            const colNum = isNaN(Number(colStr)) ? colStr.toUpperCase().charCodeAt(0) - 64 : Number(colStr);

                                            let typeType = "SEAT";
                                            if (s.type === "DOOR" || s.type === "DRIVER" || s.type === "EMPTY" || s.type === "AISLE") {
                                                typeType = s.type;
                                            } else if (s.type === "STAIRS" || s.type === "WC") {
                                                typeType = "EMPTY";
                                            }

                                            const deck = (s.floor && s.floor === 2) ? 2 : 1;
                                            let id = `${s.col || 'X'}${s.row || idx}-${idx}`;
                                            if (typeType === "SEAT") {
                                                const prefix = deck === 1 ? 'A' : 'B';
                                                const deckIndex = deck === 1 ? floor1Count++ : floor2Count++;
                                                id = `${prefix}${String(deckIndex + 1).padStart(2, '0')}`;
                                            }

                                            return {
                                                id,
                                                type: typeType as "SEAT" | "AISLE" | "EMPTY" | "DOOR" | "DRIVER",
                                                price: 0,
                                                status: "AVAILABLE",
                                                row: s.row || Math.floor(idx / 4) + 1,
                                                col: colNum,
                                                deck: deck as 1 | 2,
                                            };
                                        });
                                    } else {
                                        // Fallback generation for older empty or uncoordinated JSON
                                        const seats = previewType.totalSeats;
                                        const isBed = previewType.name.toLowerCase().includes('giường') || previewType.name.toLowerCase().includes('phòng');
                                        const cols = isBed ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];
                                        const totalFloors = seats >= 34 ? 2 : 1;
                                        const seatsPerFloor = Math.ceil(seats / totalFloors);
                                        const rowsPerFloor = Math.ceil(seatsPerFloor / cols.length);
                                        const map = [];
                                        let seatCount = 0;

                                        for (let f = 1; f <= totalFloors; f++) {
                                            let seatsOnThisFloor = 0;
                                            for (let r = 1; r <= rowsPerFloor; r++) {
                                                for (const c of cols) {
                                                    if (seatCount < seats && seatsOnThisFloor < seatsPerFloor) {
                                                        const prefix = f === 1 ? 'A' : 'B';
                                                        const numId = String(seatsOnThisFloor + 1).padStart(2, '0');
                                                        map.push({
                                                            id: `${prefix}${numId}`,
                                                            type: "SEAT" as const,
                                                            price: 0,
                                                            status: "AVAILABLE" as const,
                                                            row: r,
                                                            col: c.charCodeAt(0) - 64,
                                                            deck: f as 1 | 2
                                                        });
                                                        seatCount++;
                                                        seatsOnThisFloor++;
                                                    }
                                                }
                                            }
                                        }
                                        return map;
                                    }
                                })()}
                                onSeatClick={() => { }}
                                selectedSeats={[]}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
