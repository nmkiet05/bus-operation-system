"use client";

import { useState, useMemo } from "react";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Bus as BusIcon, User, Search, Check, ChevronDown, Clock, CalendarDays, Route as RouteIcon, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Filter } from "lucide-react";

import { Trip } from "@/features/admin/types";
import { tripService } from "@/features/admin/services/trip-service";
import { extractTime, formatDateVN } from "@/features/admin/utils/date-format";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Schema Validation
const assignmentSchema = z.object({
    driverId: z.string().min(1, "Vui lòng chọn tài xế"),
    busId: z.string().min(1, "Vui lòng chọn xe"),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

interface AssignmentFormProps {
    trip: Trip;
    onSuccess: () => void;
    onCancel: () => void;
}

export function AssignmentForm({ trip, onSuccess, onCancel }: AssignmentFormProps) {
    const queryClient = useQueryClient();
    const [openDriver, setOpenDriver] = useState(false);
    const [openBus, setOpenBus] = useState(false);
    const [openBusTypeFilter, setOpenBusTypeFilter] = useState(false);
    const [driverSearch, setDriverSearch] = useState("");
    const [busSearch, setBusSearch] = useState("");
    const [busTypeFilter, setBusTypeFilter] = useState<string | null>(null);
    const [busyConfirmOpen, setBusyConfirmOpen] = useState(false);
    const [pendingAssignmentValues, setPendingAssignmentValues] = useState<AssignmentFormValues | null>(null);

    // 1. Fetch Available Resources — dùng API thông minh (có scoring + route registration filter)
    const { data: drivers = [], isLoading: loadingDrivers } = useQuery({
        queryKey: ["available-drivers-for-trip", trip.id],
        queryFn: () => tripService.getAvailableDriversForTrip(trip.id),
        enabled: !!trip,
    });

    const { data: buses = [], isLoading: loadingBuses } = useQuery({
        queryKey: ["available-buses-for-trip", trip.id],
        queryFn: () => tripService.getAvailableBusesForTrip(trip.id),
        enabled: !!trip,
    });

    // Compute unique bus types from available buses
    const busTypes = useMemo(() => {
        const types = new Map<string, number>();
        buses.forEach(b => {
            const name = b.busType?.name;
            if (name) types.set(name, (types.get(name) || 0) + 1);
        });
        return Array.from(types.entries()).map(([name, count]) => ({ name, count }));
    }, [buses]);

    // 2. Setup Form
    const form = useForm<AssignmentFormValues>({
        resolver: zodResolver(assignmentSchema) as Resolver<AssignmentFormValues>,
        defaultValues: {
            driverId: trip.driverId ? trip.driverId.toString() : "",
            busId: trip.busId ? trip.busId.toString() : "",
        },
    });

    const selectedDriverId = form.watch("driverId");
    const selectedBusId = form.watch("busId");

    const selectedDriver = drivers.find(d => d.id.toString() === selectedDriverId);
    const selectedBus = buses.find(b => b.id.toString() === selectedBusId);

    // Fallback display khi xe/tài xế đã gán nhưng không nằm trong danh sách available
    const busDisplayText = selectedBus
        ? `${selectedBus.licensePlate} — ${selectedBus.busType?.name}`
        : (selectedBusId && trip.busLicensePlate)
            ? `${trip.busLicensePlate} — ${trip.busTypeName || trip.busType || ''}`
            : null;
    const driverDisplayText = selectedDriver
        ? `${selectedDriver.fullName} — ${selectedDriver.driverDetail?.licenseNumber}`
        : (selectedDriverId && trip.driverName)
            ? trip.driverName
            : null;

    // Filter logic
    const filteredDrivers = drivers.filter(d => {
        if (!driverSearch) return true;
        const query = driverSearch.toLowerCase();
        const license = d.driverDetail?.licenseNumber ?? "";
        return d.fullName.toLowerCase().includes(query) || license.toLowerCase().includes(query);
    });

    const filteredBuses = buses.filter(b => {
        // Filter by bus type first
        if (busTypeFilter && b.busType?.name !== busTypeFilter) return false;
        // Then filter by search text
        if (!busSearch) return true;
        const query = busSearch.toLowerCase();
        return b.licensePlate.toLowerCase().includes(query) || (b.busType?.name ?? "").toLowerCase().includes(query);
    });

    // 3. Mutation
    const { mutate, isPending } = useMutation({
        mutationFn: async (values: AssignmentFormValues) => {
            await tripService.assignResources(trip.id, {
                driverId: parseInt(values.driverId),
                busId: parseInt(values.busId),
            });
        },
        onSuccess: () => {
            toast.success("Điều phối thành công!");
            queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
            queryClient.invalidateQueries({ queryKey: ["admin-dispatch"] });
            onSuccess();
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { message?: string } } };
            const message = err?.response?.data?.message || "Lỗi điều phối";
            toast.error(message);
        },
    });

    function onSubmit(values: AssignmentFormValues) {
        if (selectedDriver?.status === "BUSY") {
            setPendingAssignmentValues(values);
            setBusyConfirmOpen(true);
            return;
        }
        mutate(values);
    }

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Trip Details Summary Card */}
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-3">Thông tin chuyến xe</h4>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                            <RouteIcon className="w-4 h-4 text-brand-blue mt-0.5" />
                            <div>
                                <p className="text-slate-500 text-xs">Tuyến đường</p>
                                <p className="font-medium text-slate-900">{trip.routeName}</p>
                                <p className="text-xs text-slate-500">Mã: {trip.routeCode}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <CalendarDays className="w-4 h-4 text-brand-blue mt-0.5" />
                            <div>
                                <p className="text-slate-500 text-xs">Ngày khởi hành</p>
                                <p className="font-medium text-slate-900">{formatDateVN(trip.departureDate)}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-brand-blue mt-0.5" />
                            <div>
                                <p className="text-slate-500 text-xs">Lịch trình</p>
                                <p className="font-medium text-slate-900">{extractTime(trip.departureTime)} - {extractTime(trip.arrivalTime)}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <BusIcon className="w-4 h-4 text-brand-blue mt-0.5 shrink-0" />
                            <div>
                                <p className="text-slate-500 text-xs">Loại xe yêu cầu</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {(trip.busTypeName || trip.busType || "Chưa xác định")
                                        .split(",")
                                        .map((type, i) => (
                                            <span
                                                key={i}
                                                className="inline-block px-2 py-0.5 text-xs font-medium bg-brand-blue/10 text-brand-blue rounded-full whitespace-nowrap"
                                            >
                                                {type.trim()}
                                            </span>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {trip.dispatchNote && !trip.busId && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-blue-50 rounded-md">
                            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-700">{trip.dispatchNote}</p>
                        </div>
                    )}
                </div>

                {/* === 2 Cột Song Song: Xe + Tài xế === */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* ====== CỘT TRÁI: Chọn Xe ====== */}
                    <FormField
                        control={form.control}
                        name="busId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="flex items-center gap-2 text-slate-700 font-semibold">
                                    <BusIcon className="h-4 w-4 text-brand-blue" /> Phương tiện
                                </FormLabel>

                                {/* Bus Type Filter Dropdown — Popover style */}
                                {busTypes.length > 1 && (
                                    <Popover open={openBusTypeFilter} onOpenChange={setOpenBusTypeFilter}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "w-full justify-between bg-white text-left font-normal text-sm",
                                                    !busTypeFilter && "text-muted-foreground"
                                                )}
                                            >
                                                <span className="flex items-center gap-1.5 truncate">
                                                    <Filter className="h-3.5 w-3.5 shrink-0 opacity-60" />
                                                    {busTypeFilter
                                                        ? busTypes.find(bt => bt.name === busTypeFilter)?.name
                                                        : "Tất cả loại xe phù hợp"}
                                                </span>
                                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[280px] p-0 z-[200]" align="start">
                                            <div className="max-h-[200px] overflow-y-auto py-1">
                                                <div
                                                    className={cn(
                                                        "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none hover:bg-slate-100",
                                                        !busTypeFilter ? "bg-slate-50 text-brand-blue" : ""
                                                    )}
                                                    onClick={() => {
                                                        setBusTypeFilter(null);
                                                        setOpenBusTypeFilter(false);
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", !busTypeFilter ? "opacity-100" : "opacity-0")} />
                                                    Tất cả loại xe phù hợp
                                                </div>
                                                {busTypes.map(bt => {
                                                    const isRecommended = bt.name === trip.busTypeName || bt.name === trip.busType;
                                                    const isSelected = busTypeFilter === bt.name;
                                                    return (
                                                        <div
                                                            key={bt.name}
                                                            className={cn(
                                                                "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none hover:bg-slate-100",
                                                                isSelected ? "bg-slate-50 text-brand-blue" : ""
                                                            )}
                                                            onClick={() => {
                                                                setBusTypeFilter(bt.name);
                                                                setOpenBusTypeFilter(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                                            <span className="flex-1">{bt.name}</span>
                                                            {isRecommended && <span className="text-amber-500 text-xs ml-1">★</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}


                                <Popover open={openBus} onOpenChange={setOpenBus} modal={true}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "w-full justify-between bg-white text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {busDisplayText ? (
                                                    <span className="truncate">
                                                        {busDisplayText}
                                                    </span>
                                                ) : (
                                                    "Chọn xe..."
                                                )}
                                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[320px] p-0 z-[200]" align="start">
                                        <div className="flex items-center border-b border-gray-100 px-3 py-2">
                                            <Search className="h-4 w-4 text-gray-400 mr-2" />
                                            <input
                                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-900"
                                                placeholder="Tìm biển số..."
                                                value={busSearch}
                                                onChange={(e) => setBusSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="max-h-[220px] overflow-y-auto py-1">
                                            {loadingBuses ? (
                                                <div className="p-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                                                </div>
                                            ) : filteredBuses.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-gray-500">
                                                    Không tìm thấy xe phù hợp
                                                </div>
                                            ) : (
                                                filteredBuses.map((bus, idx) => (
                                                    <div
                                                        key={bus.id}
                                                        className={cn(
                                                            "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none hover:bg-slate-100",
                                                            field.value === bus.id.toString() ? "bg-slate-50 text-brand-blue" : ""
                                                        )}
                                                        onClick={() => {
                                                            field.onChange(bus.id.toString());
                                                            setOpenBus(false);
                                                            setBusSearch("");
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                field.value === bus.id.toString() ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col flex-1">
                                                            <span className="font-medium text-slate-900">{bus.licensePlate}</span>
                                                            <span className="text-xs text-slate-500">
                                                                {bus.busType?.name}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-slate-400 ml-2">#{idx + 1}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* ====== CỘT PHẢI: Chọn Tài Xế ====== */}
                    <FormField
                        control={form.control}
                        name="driverId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="flex items-center gap-2 text-slate-700 font-semibold">
                                    <User className="h-4 w-4 text-brand-blue" /> Tài xế
                                </FormLabel>
                                {!selectedBusId && (
                                    <p className="text-xs text-slate-400 italic">Vui lòng chọn phương tiện trước</p>
                                )}
                                <Popover open={openDriver} onOpenChange={(open) => { if (selectedBusId) setOpenDriver(open); }} modal={true}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                disabled={!selectedBusId}
                                                className={cn(
                                                    "w-full justify-between text-left font-normal",
                                                    !selectedBusId && "opacity-50 cursor-not-allowed bg-slate-50",
                                                    selectedBusId && "bg-white",
                                                    !field.value && selectedBusId && "text-muted-foreground"
                                                )}
                                            >
                                                {driverDisplayText ? (
                                                    <span className="truncate">
                                                        {driverDisplayText}
                                                    </span>
                                                ) : (
                                                    selectedBusId ? "Chọn tài xế..." : "Chọn phương tiện trước"
                                                )}
                                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[320px] p-0 z-[200]" align="start">
                                        <div className="flex items-center border-b border-gray-100 px-3 py-2">
                                            <Search className="h-4 w-4 text-gray-400 mr-2" />
                                            <input
                                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-900"
                                                placeholder="Tìm tên hoặc GPLX..."
                                                value={driverSearch}
                                                onChange={(e) => setDriverSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="max-h-[220px] overflow-y-auto py-1">
                                            {loadingDrivers ? (
                                                <div className="p-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                                                </div>
                                            ) : filteredDrivers.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-gray-500">
                                                    Không tìm thấy tài xế
                                                </div>
                                            ) : (
                                                filteredDrivers.map((driver) => (
                                                    <div
                                                        key={driver.id}
                                                        className={cn(
                                                            "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none hover:bg-slate-100",
                                                            field.value === driver.id.toString() ? "bg-slate-50 text-brand-blue" : ""
                                                        )}
                                                        onClick={() => {
                                                            field.onChange(driver.id.toString());
                                                            setOpenDriver(false);
                                                            setDriverSearch("");
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                field.value === driver.id.toString() ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{driver.fullName}</span>
                                                            <span className="text-xs text-slate-500">
                                                                GPLX: {driver.driverDetail?.licenseNumber}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />

                                {/* Compliance Warning */}
                                {selectedDriver && selectedDriver.totalHoursThisWeek && selectedDriver.totalHoursThisWeek > 40 && (
                                    <Alert variant="destructive" className="mt-2 py-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle className="text-sm font-semibold ml-2">Cảnh báo Luật Lao Động</AlertTitle>
                                        <AlertDescription className="text-xs ml-6">
                                            Tài xế đã chạy {selectedDriver.totalHoursThisWeek}h/48h tuần này.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </FormItem>
                        )}
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                        Hủy bỏ
                    </Button>
                    <Button type="submit" disabled={isPending || !selectedBusId || !selectedDriverId} className="bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-50">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Xác nhận Điều phối
                    </Button>
                </div>
                </form>
            </Form>

            <ConfirmDialog
                open={busyConfirmOpen}
                onOpenChange={setBusyConfirmOpen}
                title="Tài xế đang bận"
                description="Tài xế này đang bận. Bạn có chắc muốn ép gán?"
                confirmLabel="Vẫn gán"
                variant="warning"
                isLoading={isPending}
                onConfirm={() => {
                    if (!pendingAssignmentValues) return;
                    mutate(pendingAssignmentValues);
                    setBusyConfirmOpen(false);
                    setPendingAssignmentValues(null);
                }}
            />
        </>
    );
}
