"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval,
         isSameMonth, isSameDay, isToday, addMonths, subMonths, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, MapPin, Bus, AlertCircle, Loader2, Calendar } from "lucide-react";
import { driverService, DriverTrip } from "@/features/driver/services/driver-service";
import { cn } from "@/lib/utils";

// ────────────────────────────────────────────────────────────
// Status config
// ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
    SCHEDULED: { label: "Chờ xuất bến", dot: "bg-amber-400",  badge: "bg-amber-400/10 text-amber-300 border-amber-400/20" },
    APPROVED:  { label: "Đã duyệt",     dot: "bg-blue-400",   badge: "bg-blue-400/10  text-blue-300  border-blue-400/20"  },
    RUNNING:   { label: "Đang chạy",    dot: "bg-emerald-400",badge: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20" },
    COMPLETED: { label: "Hoàn thành",   dot: "bg-slate-500",  badge: "bg-slate-500/10 text-slate-400  border-slate-500/20" },
    CANCELLED: { label: "Đã hủy",       dot: "bg-red-400",    badge: "bg-red-400/10   text-red-400    border-red-400/20"   },
};

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function DriverSchedulePage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    // Fetch toàn tháng
    const fromDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const toDate   = format(endOfMonth(currentMonth),   "yyyy-MM-dd");

    const { data: trips = [], isLoading, isError } = useQuery({
        queryKey: ["driver-schedule", fromDate, toDate],
        queryFn: () => driverService.getMySchedule(fromDate, toDate),
        staleTime: 5 * 60 * 1000,
    });

    // Map ngày → danh sách chuyến
    const tripsByDate = useMemo(() => {
        const map = new Map<string, DriverTrip[]>();
        for (const trip of trips) {
            const key = trip.departureDate;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(trip);
        }
        return map;
    }, [trips]);

    // Ngày được chọn
    const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
    const selectedTrips   = selectedDateStr ? (tripsByDate.get(selectedDateStr) ?? []) : [];

    // Tháng: grid
    const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
    const firstDayIndex = (startOfMonth(currentMonth).getDay() + 6) % 7; // Mon=0

    const totalTrips    = trips.length;
    const completedTrips = trips.filter(t => t.status === "COMPLETED").length;
    const upcomingTrips  = trips.filter(t => ["SCHEDULED","APPROVED"].includes(t.status)).length;

    return (
        <div className="space-y-6">
            {/* ─── Tiêu đề ─── */}
            <div>
                <h1 className="text-xl font-bold text-white">Lịch chuyến của tôi</h1>
                <p className="text-sm text-slate-400 mt-0.5">Xem các chuyến được phân công trong tháng</p>
            </div>

            {/* ─── Stats nhỏ ─── */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Chuyến tháng này", value: totalTrips,     color: "text-white" },
                    { label: "Sắp tới",          value: upcomingTrips,  color: "text-blue-400" },
                    { label: "Hoàn thành",        value: completedTrips, color: "text-emerald-400" },
                ].map(s => (
                    <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                        <div className={cn("text-2xl font-bold tabular-nums", s.color)}>{s.value}</div>
                        <div className="text-[11px] text-slate-500 mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* ─── Calendar card ─── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                {/* Header điều hướng tháng */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                    <button
                        onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        <span className="font-semibold text-white capitalize">
                            {format(currentMonth, "MMMM yyyy", { locale: vi })}
                        </span>
                    </div>
                    <button
                        onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Grid weekday headers */}
                <div className="grid grid-cols-7 border-b border-slate-800">
                    {WEEKDAYS.map(d => (
                        <div key={d} className="py-2 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Grid days */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm">Đang tải lịch...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-7">
                        {/* Padding trống đầu tháng */}
                        {Array.from({ length: firstDayIndex }).map((_, i) => (
                            <div key={`pad-${i}`} className="aspect-square border-b border-r border-slate-800/50" />
                        ))}

                        {days.map((day) => {
                            const key        = format(day, "yyyy-MM-dd");
                            const dayTrips   = tripsByDate.get(key) ?? [];
                            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                            const isCurrentDay = isToday(day);
                            const inMonth    = isSameMonth(day, currentMonth);
                            const hasActive  = dayTrips.some(t => ["RUNNING","APPROVED","SCHEDULED"].includes(t.status));
                            const hasDone    = dayTrips.some(t => t.status === "COMPLETED");

                            return (
                                <button
                                    key={key}
                                    onClick={() => setSelectedDate(day)}
                                    className={cn(
                                        "aspect-square border-b border-r border-slate-800/50 flex flex-col items-center justify-start pt-2 px-1 gap-1 transition-colors relative",
                                        inMonth ? "" : "opacity-30",
                                        isSelected
                                            ? "bg-blue-500/15 border-blue-500/30"
                                            : "hover:bg-slate-800/60"
                                    )}
                                >
                                    {/* Số ngày */}
                                    <span className={cn(
                                        "w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-medium",
                                        isCurrentDay
                                            ? "bg-blue-500 text-white font-bold"
                                            : isSelected
                                                ? "text-blue-300"
                                                : "text-slate-300"
                                    )}>
                                        {format(day, "d")}
                                    </span>

                                    {/* Dot chỉ trạng thái */}
                                    {dayTrips.length > 0 && (
                                        <div className="flex gap-0.5 flex-wrap justify-center">
                                            {hasActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                                            {hasDone   && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ─── Panel chuyến của ngày được chọn ─── */}
            {selectedDate && (
                <div>
                    <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                        {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}
                    </h2>

                    {isError ? (
                        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            Không thể tải dữ liệu. Vui lòng thử lại.
                        </div>
                    ) : selectedTrips.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
                            <Bus className="h-8 w-8 mb-2 opacity-30" />
                            <p className="text-sm">Không có chuyến nào ngày này</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {selectedTrips.map(trip => {
                                const cfg = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG.SCHEDULED;
                                return (
                                    <div
                                        key={trip.id}
                                        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
                                    >
                                        {/* Row 1: Tuyến + Badge */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-semibold text-white text-sm">{trip.routeName}</p>
                                                {trip.routeCode && (
                                                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{trip.routeCode}</p>
                                                )}
                                            </div>
                                            <span className={cn(
                                                "shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
                                                cfg.badge
                                            )}>
                                                <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                                                {cfg.label}
                                            </span>
                                        </div>

                                        {/* Row 2: Giờ + Điểm đi/đến */}
                                        <div className="flex items-center gap-4 text-sm">
                                            {/* Departure time */}
                                            <div className="flex items-center gap-1.5 text-blue-400 font-bold tabular-nums text-lg">
                                                <Clock className="h-4 w-4" />
                                                {trip.departureTime}
                                            </div>
                                            <div className="h-px flex-1 bg-slate-700" />
                                            <div className="text-slate-400 text-sm tabular-nums">
                                                {trip.arrivalTime}
                                            </div>
                                        </div>

                                        {/* Row 3: Điểm xuất phát → đến */}
                                        {(trip.originProvinceName || trip.destinationProvinceName) && (
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                                <span className="truncate">
                                                    {trip.originProvinceName}
                                                    {trip.destinationProvinceName && ` → ${trip.destinationProvinceName}`}
                                                </span>
                                            </div>
                                        )}

                                        {/* Row 4: Biển số xe */}
                                        {trip.busLicensePlate && (
                                            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                                                <Bus className="h-3.5 w-3.5 text-slate-500" />
                                                <span className="font-mono text-xs font-medium text-slate-300">
                                                    {trip.busLicensePlate}
                                                </span>
                                                {trip.busType && (
                                                    <span className="text-[11px] text-slate-500">· {trip.busType}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
