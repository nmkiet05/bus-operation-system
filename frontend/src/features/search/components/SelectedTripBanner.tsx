"use client";

import { Trip } from "@/services/api/trips";
import { BusFront, X } from "lucide-react";

interface SelectedTripBannerProps {
    trip: Trip;
    label: string; // "Chuyến đi" or "Chuyến về"
    onClear: () => void;
}

export function SelectedTripBanner({ trip, label, onClear }: SelectedTripBannerProps) {
    const startTime = trip.departureTime?.substring(0, 5) || "--:--";
    const endTime = trip.arrivalTime?.substring(11, 16) || "--:--";
    const durationH = Math.floor(trip.duration / 60);
    const durationM = trip.duration % 60;

    return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <BusFront className="h-5 w-5 text-emerald-600" />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider mb-0.5">
                    {label} — Đã chọn ✓
                </p>
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-gray-900">{startTime}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-bold text-gray-900">{endTime}</span>
                    <span className="text-xs text-gray-400">
                        ({durationH}h{durationM > 0 ? `${durationM}p` : ""})
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs font-medium text-gray-600">{trip.busType}</span>
                    <span className="ml-auto text-sm font-bold text-emerald-700">
                        {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                        }).format(trip.price)}
                    </span>
                </div>
            </div>

            <button
                type="button"
                onClick={onClear}
                className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-500 transition-colors flex-shrink-0"
                title="Đổi chuyến"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
