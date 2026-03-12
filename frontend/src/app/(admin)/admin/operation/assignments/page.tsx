"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    RefreshCw,
    Pencil,
    Bus,
    AlertCircle,
    Loader2,
    CheckCircle2,
    ArrowRight,
} from "lucide-react";
import { Trip } from "@/features/admin/types";
import { tripService } from "@/features/admin/services/trip-service";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AssignmentDialog } from "@/features/admin/components/AssignmentDialog";
import { AdminDatePicker } from "@/features/admin/components/AdminDatePicker";
import { format } from "date-fns";
import { extractTime } from "@/features/admin/utils/date-format";

export default function DispatchPage() {
    // Filter State
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0]; // yyyy-MM-dd
    });

    // Default: chỉ hiện chuyến cần điều phối
    const [filterType, setFilterType] = useState<"UNASSIGNED" | "ALL">("UNASSIGNED");

    // Assignment Dialog State
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [assignmentOpen, setAssignmentOpen] = useState(false);

    // Fetch Trips — chỉ SCHEDULED (chưa duyệt = còn điều phối được)
    const {
        data: trips = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["admin-dispatch", selectedDate],
        queryFn: async () => {
            try {
                return await tripService.getTrips({
                    fromDate: selectedDate,
                    toDate: selectedDate,
                    status: "SCHEDULED",
                });
            } catch {
                toast.error("Không thể tải danh sách chuyến xe");
                return [];
            }
        },
    });

    const handleAssign = (trip: Trip) => {
        setSelectedTrip(trip);
        setAssignmentOpen(true);
    };

    // Filter Logic
    const filteredTrips = trips.filter(trip => {
        if (filterType === "ALL") return true;
        return !trip.busLicensePlate || !trip.driverName;
    });

    const unassignedCount = trips.filter(t => !t.busLicensePlate || !t.driverName).length;
    const assignedCount = trips.length - unassignedCount;

    return (
        <div className="space-y-6">
            <AssignmentDialog
                trip={selectedTrip}
                open={assignmentOpen}
                onOpenChange={setAssignmentOpen}
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Điều Phối Tài Xế & Phương Tiện
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gán tài xế và xe cho các chuyến đang chờ điều phối
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    Làm mới
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
                    <p className="text-xl font-bold text-gray-900">{trips.length}</p>
                    <p className="text-xs text-gray-500">Tổng chuyến</p>
                </div>
                <div className="bg-white rounded-lg border border-red-100 p-3 text-center">
                    <p className="text-xl font-bold text-red-600">{unassignedCount}</p>
                    <p className="text-xs text-gray-500">Cần điều phối</p>
                </div>
                <div className="bg-white rounded-lg border border-green-100 p-3 text-center">
                    <p className="text-xl font-bold text-green-600">{assignedCount}</p>
                    <p className="text-xs text-gray-500">Đã gán đủ</p>
                </div>
            </div>

            {/* Filters — compact row */}
            <div className="flex items-center gap-3">
                {/* Date Picker */}
                <AdminDatePicker
                    value={selectedDate ? new Date(selectedDate) : null}
                    onChange={(date) => setSelectedDate(date ? format(date, "yyyy-MM-dd") : "")}
                    className="w-[200px]"
                />

                {/* Filter Tabs */}
                <div className="flex p-1 bg-gray-100 rounded-lg">
                    <button
                        onClick={() => setFilterType("UNASSIGNED")}
                        className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                            filterType === "UNASSIGNED"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Cần điều phối ({unassignedCount})
                    </button>
                    <button
                        onClick={() => setFilterType("ALL")}
                        className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                            filterType === "ALL"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Tất cả ({trips.length})
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Giờ</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Tuyến</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600 hidden md:table-cell">Loại xe</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Biển số</th>
                                <th className="text-left py-3.5 px-4 font-semibold text-gray-600">Tài xế</th>
                                <th className="text-center py-3.5 px-4 font-semibold text-gray-600">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredTrips.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-gray-400">
                                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                                        <p className="text-sm font-medium text-green-600">
                                            {filterType === "UNASSIGNED"
                                                ? "Tất cả chuyến đã được điều phối!"
                                                : "Không có chuyến nào trong ngày này"
                                            }
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTrips.map((trip) => {
                                    const needsAssignment = !trip.busLicensePlate || !trip.driverName;

                                    return (
                                        <tr
                                            key={trip.id}
                                            className={cn(
                                                "hover:bg-gray-50/50 transition-colors",
                                                needsAssignment ? "bg-amber-50/30" : ""
                                            )}
                                        >
                                            {/* Giờ */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-gray-900">
                                                    {extractTime(trip.departureTime)}
                                                </div>
                                                <div className="text-xs text-gray-400 flex items-center gap-0.5">
                                                    <ArrowRight className="h-3 w-3" />
                                                    {extractTime(trip.arrivalTime)}
                                                </div>
                                            </td>

                                            {/* Tuyến */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-medium text-gray-900">{trip.routeName}</div>
                                                <div className="text-xs text-gray-400">{trip.routeCode}</div>
                                            </td>

                                            {/* Loại xe */}
                                            <td className="py-3.5 px-4 hidden md:table-cell">
                                                <span className="text-gray-600">{trip.busTypeName || trip.busType || "—"}</span>
                                            </td>

                                            {/* Biển số */}
                                            <td className="py-3.5 px-4">
                                                {trip.busLicensePlate ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs font-mono font-medium text-gray-700">
                                                        <Bus className="h-3 w-3" />
                                                        {trip.busLicensePlate}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded">
                                                        <AlertCircle className="h-3 w-3" />
                                                        Chưa gán
                                                    </span>
                                                )}
                                            </td>

                                            {/* Tài xế */}
                                            <td className="py-3.5 px-4">
                                                {trip.driverName ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-brand-blue/10 flex items-center justify-center text-[10px] font-bold text-brand-blue">
                                                            {trip.driverName[0]}
                                                        </div>
                                                        <span className="text-gray-700 font-medium text-xs">
                                                            {trip.driverName}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded">
                                                        <AlertCircle className="h-3 w-3" />
                                                        Chưa gán
                                                    </span>
                                                )}
                                            </td>

                                            {/* Thao tác */}
                                            <td className="py-3.5 px-4 text-center">
                                                <button
                                                    onClick={() => handleAssign(trip)}
                                                    className={cn(
                                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                                        needsAssignment
                                                            ? "bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20"
                                                            : "text-gray-600 hover:bg-gray-100"
                                                    )}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                    {needsAssignment ? "Điều phối" : "Sửa"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
