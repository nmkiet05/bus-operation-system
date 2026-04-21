"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    isSameMonth, isSameDay, isToday, addMonths, subMonths,
} from "date-fns";
import { vi } from "date-fns/locale";
import {
    ChevronLeft, ChevronRight, MapPin, Bus, Loader2,
    Users, UserCircle2, Phone, Armchair, ChevronDown, ChevronUp,
    CalendarDays,
} from "lucide-react";
import { driverService, DriverTrip, CrewMember, PassengerInfo } from "@/features/driver/services/driver-service";
import { cn } from "@/lib/utils";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; dot: string; badge: string }> = {
    SCHEDULED: { label: "Chờ duyệt",   dot: "bg-amber-400",   badge: "text-amber-300  border-amber-400/30  bg-amber-400/10"  },
    APPROVED:  { label: "Đã duyệt",    dot: "bg-blue-400",    badge: "text-blue-300   border-blue-400/30   bg-blue-400/10"   },
    RUNNING:   { label: "Đang chạy",   dot: "bg-emerald-400", badge: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10" },
    COMPLETED: { label: "Hoàn thành",  dot: "bg-slate-500",   badge: "text-slate-400  border-slate-500/30  bg-slate-500/10"  },
    CANCELLED: { label: "Đã hủy",      dot: "bg-red-400",     badge: "text-red-400    border-red-400/30    bg-red-400/10"    },
};

const ROLE_LABEL: Record<string, string> = {
    MAIN_DRIVER: "Tài xế chính",
    CO_DRIVER:   "Phụ lái",
    ATTENDANT:   "Tiếp viên",
};

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

// ─── TripCard ─────────────────────────────────────────────────────────────────

function TripCard({ trip }: { trip: DriverTrip }) {
    const [tab, setTab] = useState<"crew" | "passengers" | null>(null);

    const { data: crew = [], isLoading: crewLoading } = useQuery({
        queryKey: ["driver-crew", trip.id],
        queryFn: () => driverService.getTripCrew(trip.id),
        enabled: tab === "crew",
        staleTime: 5 * 60 * 1000,
    });

    const { data: passengers = [], isLoading: passengerLoading } = useQuery({
        queryKey: ["driver-passengers", trip.id],
        queryFn: () => driverService.getTripPassengers(trip.id),
        enabled: tab === "passengers",
        staleTime: 5 * 60 * 1000,
    });

    const cfg = STATUS_CFG[trip.status] ?? STATUS_CFG.SCHEDULED;
    const bookedSeats = (trip.totalSeats ?? 0) - (trip.availableSeats ?? 0);

    const toggle = (t: "crew" | "passengers") =>
        setTab(prev => prev === t ? null : t);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* ── Header: Tuyến + Badge ─────────────────────────────── */}
            <div className="px-4 pt-4 pb-3 space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{trip.routeName}</p>
                        {trip.routeCode && (
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{trip.routeCode}</p>
                        )}
                    </div>
                    <span className={cn(
                        "shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
                        cfg.badge
                    )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                        {cfg.label}
                    </span>
                </div>

                {/* ── Giờ đi / Giờ đến — cùng 1 style ────────────── */}
                <div className="flex items-center gap-3">
                    {/* Giờ khởi hành */}
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Khởi hành</span>
                        <span className="text-blue-400 font-bold text-base tabular-nums leading-none">
                            {trip.departureTime ? String(trip.departureTime).slice(0, 5) : "--:--"}
                        </span>
                    </div>

                    {/* Đường kết nối */}
                    <div className="flex-1 flex items-center gap-1.5">
                        <div className="flex-1 h-px bg-slate-700" />
                        <div className="w-1.5 h-1.5 rounded-full border border-slate-600 bg-slate-800" />
                        <div className="flex-1 h-px bg-slate-700" />
                    </div>

                    {/* Giờ đến */}
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Dự kiến đến</span>
                        <span className="text-slate-300 font-bold text-base tabular-nums leading-none">
                            {trip.arrivalTime
                                ? String(trip.arrivalTime).includes("T")
                                    ? String(trip.arrivalTime).slice(11, 16)
                                    : String(trip.arrivalTime).slice(0, 5)
                                : "--:--"}
                        </span>
                    </div>
                </div>

                {/* ── Dòng 1: Bến đi (trái) ←→ Bến đến (phải) ────────── */}
                {(trip.departureStationName || trip.arrivalStationName) && (
                    <div className="flex items-center justify-between gap-2">
                        {/* Bến đi — căn trái */}
                        {trip.departureStationName ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[13px] font-medium text-slate-200">
                                <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                {trip.departureStationName}
                            </span>
                        ) : <span />}

                        {/* Dấu phân cách */}
                        {trip.departureStationName && trip.arrivalStationName && (
                            <span className="text-slate-600 text-xs">→</span>
                        )}

                        {/* Bến đến — căn phải */}
                        {trip.arrivalStationName ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[13px] font-medium text-slate-200">
                                <MapPin className="h-3.5 w-3.5 text-red-400 shrink-0" />
                                {trip.arrivalStationName}
                            </span>
                        ) : <span />}
                    </div>
                )}

                {/* ── Dòng 2: Grid 3 cột đều — Biển số | Loại xe | Khách ─ */}
                <div className="grid grid-cols-3 gap-1.5">
                    {/* Biển số xe */}
                    <span className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-mono font-medium text-slate-300">
                        <Bus className="h-3 w-3 text-slate-500 shrink-0" />
                        {trip.busLicensePlate ?? "—"}
                    </span>

                    {/* Loại xe */}
                    <span className="inline-flex items-center justify-center px-2 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] text-slate-400 text-center">
                        {trip.busTypeName || trip.busType || "—"}
                    </span>

                    {/* Số khách */}
                    <span className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] text-slate-400">
                        <Armchair className="h-3 w-3 shrink-0" />
                        <span className="font-medium text-white">{bookedSeats}</span>
                        <span>/ {trip.totalSeats ?? "?"}</span>
                    </span>
                </div>
            </div>

            {/* ── Tab buttons ───────────────────────────────────────────── */}
            <div className="border-t border-slate-800 flex">
                <button
                    onClick={() => toggle("crew")}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
                        tab === "crew"
                            ? "bg-slate-800 text-white"
                            : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                    )}
                >
                    <Users className="h-3.5 w-3.5" />
                    Đội ngũ
                    {tab === "crew" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                <div className="w-px bg-slate-800" />
                <button
                    onClick={() => toggle("passengers")}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
                        tab === "passengers"
                            ? "bg-slate-800 text-white"
                            : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                    )}
                >
                    <UserCircle2 className="h-3.5 w-3.5" />
                    Hành khách ({bookedSeats})
                    {tab === "passengers" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
            </div>

            {/* ── Panel Crew ────────────────────────────────────────────── */}
            {tab === "crew" && (
                <div className="border-t border-slate-800 bg-slate-950/50">
                    {crewLoading ? (
                        <div className="flex items-center justify-center gap-2 py-4 text-slate-500 text-xs">
                            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                        </div>
                    ) : crew.length === 0 ? (
                        <p className="text-center text-slate-500 text-xs py-4">Chưa có nhân sự phân công</p>
                    ) : (
                        <div className="divide-y divide-slate-800/50">
                            {crew.map((m: CrewMember) => (
                                <div key={m.assignmentId} className="flex items-center gap-3 px-4 py-2.5">
                                    <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-[11px] shrink-0">
                                        {m.fullName?.charAt(0) ?? "?"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-sm font-medium text-white truncate">{m.fullName}</p>
                                            {m.employeeCode && (
                                                <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 border border-slate-600">
                                                    {m.employeeCode}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-500">{ROLE_LABEL[m.role] ?? m.role}</p>
                                    </div>
                                    {m.phone && (
                                        <a href={`tel:${m.phone}`}
                                            className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300">
                                            <Phone className="h-3 w-3" />
                                            {m.phone}
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Panel Passengers ──────────────────────────────────────── */}
            {tab === "passengers" && (
                <div className="border-t border-slate-800 bg-slate-950/50">
                    {passengerLoading ? (
                        <div className="flex items-center justify-center gap-2 py-4 text-slate-500 text-xs">
                            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                        </div>
                    ) : passengers.length === 0 ? (
                        <p className="text-center text-slate-500 text-xs py-4">Chưa có hành khách đặt vé</p>
                    ) : (
                        <div className="divide-y divide-slate-800/50 max-h-72 overflow-y-auto">
                            {passengers.map((p: PassengerInfo) => (
                                <div key={p.ticketId} className="flex items-center gap-3 px-4 py-2.5">
                                    {/* Avatar chữ cái — giống crew */}
                                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-[11px] shrink-0">
                                        {p.passengerName ? p.passengerName.charAt(0).toUpperCase() : "?"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-sm font-medium text-white truncate">
                                                {p.passengerName ?? <span className="text-slate-500 italic font-normal">Chưa điền tên</span>}
                                            </p>
                                            {/* Badge số ghế */}
                                            <span className="shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 border border-slate-600">
                                                {p.seatNumber}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                            {p.pickupPoint && (
                                                <span className="flex items-center gap-0.5">
                                                    <MapPin className="h-3 w-3 text-amber-400" />{p.pickupPoint}
                                                </span>
                                            )}
                                            {p.isCheckedIn && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-[10px]">
                                                    ✓ Check-in
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Phone clickable — giống crew */}
                                    {p.passengerPhone && (
                                        <a href={`tel:${p.passengerPhone}`}
                                            className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 shrink-0">
                                            <Phone className="h-3 w-3" />
                                            {p.passengerPhone}
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DriverSchedulePage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const fromDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const toDate   = format(endOfMonth(currentMonth),   "yyyy-MM-dd");

    const { data: trips = [], isLoading } = useQuery({
        queryKey: ["driver-schedule", fromDate, toDate],
        queryFn: () => driverService.getMySchedule(fromDate, toDate),
        staleTime: 5 * 60 * 1000,
    });

    // tripsByDate map
    const tripsByDate = useMemo(() => {
        const map = new Map<string, DriverTrip[]>();
        for (const trip of trips) {
            const key = trip.departureDate;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(trip);
        }
        return map;
    }, [trips]);

    const selectedKey   = format(selectedDate, "yyyy-MM-dd");
    const selectedTrips = tripsByDate.get(selectedKey) ?? [];

    const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
    const firstDayIndex = (startOfMonth(currentMonth).getDay() + 6) % 7;

    return (
        <div className="space-y-5">
            {/* Tiêu đề */}
            <div>
                <h1 className="text-lg font-bold text-white">Lịch chuyến của tôi</h1>
                <p className="text-xs text-slate-500 mt-0.5">Xem lịch và thông tin chuyến được phân công</p>
            </div>

            {/* ── Layout 2 cột ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 items-start">

                {/* ── CỘT TRÁI: Compact Calendar ───────────────────────── */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden sticky top-20">
                    {/* Nav tháng */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-sm font-semibold text-white capitalize">
                                {format(currentMonth, "MMMM yyyy", { locale: vi })}
                            </span>
                        </div>
                        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 border-b border-slate-800/50">
                        {WEEKDAYS.map(d => (
                            <div key={d} className="py-1.5 text-center text-[10px] font-semibold text-slate-600 uppercase">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Days grid */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10 text-slate-500 gap-2 text-xs">
                            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                        </div>
                    ) : (
                        <div className="grid grid-cols-7">
                            {Array.from({ length: firstDayIndex }).map((_, i) => (
                                <div key={`pad-${i}`} className="aspect-square" />
                            ))}
                            {days.map(day => {
                                const key      = format(day, "yyyy-MM-dd");
                                const dayTrips = tripsByDate.get(key) ?? [];
                                const isSelected  = isSameDay(day, selectedDate);
                                const isCurrent   = isToday(day);
                                const inMonth     = isSameMonth(day, currentMonth);
                                const hasActive   = dayTrips.some(t => ["RUNNING","APPROVED","SCHEDULED"].includes(t.status));
                                const hasDone     = dayTrips.some(t => t.status === "COMPLETED");

                                return (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedDate(day)}
                                        className={cn(
                                            "aspect-square flex flex-col items-center justify-center gap-0.5 rounded-lg mx-0.5 my-0.5 transition-all",
                                            !inMonth && "opacity-25",
                                            isSelected
                                                ? "bg-blue-500/20 ring-1 ring-blue-500/50"
                                                : "hover:bg-slate-800"
                                        )}
                                    >
                                        <span className={cn(
                                            "w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-medium",
                                            isCurrent
                                                ? "bg-blue-500 text-white font-bold"
                                                : isSelected
                                                    ? "text-blue-300"
                                                    : "text-slate-300"
                                        )}>
                                            {format(day, "d")}
                                        </span>
                                        {dayTrips.length > 0 && (
                                            <div className="flex gap-0.5">
                                                {hasActive && <span className="w-1 h-1 rounded-full bg-blue-400" />}
                                                {hasDone   && <span className="w-1 h-1 rounded-full bg-emerald-400" />}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Legend */}
                    <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-800/50 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />Sắp tới</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Hoàn thành</span>
                    </div>

                </div>

                {/* ── CỘT PHẢI: Trip list cho ngày được chọn ───────────── */}
                <div className="space-y-3">
                    {/* Header ngày */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-300 capitalize">
                            {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}
                        </h2>
                        {selectedTrips.length > 0 && (
                            <span className="text-xs text-slate-500">
                                {selectedTrips.length} chuyến
                            </span>
                        )}
                    </div>

                    {selectedTrips.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                            <Bus className="h-8 w-8 mb-2 opacity-30" />
                            <p className="text-sm">Không có chuyến được phân công</p>
                        </div>
                    ) : (
                        selectedTrips.map(trip => (
                            <TripCard key={trip.id} trip={trip} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
