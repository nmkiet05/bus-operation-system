"use client";

import { useState } from "react";
import { MapPin, ChevronDown, Clock } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PickupPoint } from "@/services/api/pickupPoint";
import { calculatePickupTime } from "@/lib/pickupTimeUtils";

interface PickupPointSelectorProps {
    label: string;
    pickupPoints: PickupPoint[];
    departureTime: string;
    selectedId: number | null;
    onSelect: (id: number | null) => void;
    /** Tên bến xe chính (hiển thị khi chọn đón/trả tại bến) */
    stationName?: string;
    placeholder?: string;
}

export function PickupPointSelector({
    label,
    pickupPoints,
    departureTime,
    selectedId,
    onSelect,
    stationName,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    placeholder: _placeholder = "Chọn điểm đón/trả",
}: PickupPointSelectorProps) {
    const [open, setOpen] = useState(false);

    const defaultText = stationName || "Tại bến xe";
    const selectedPoint = pickupPoints.find((p) => p.id === selectedId);
    const selectedText = selectedPoint ? selectedPoint.name : defaultText;

    return (
        <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                {label}
            </label>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "w-full flex items-center justify-between gap-2",
                            "px-4 py-3 rounded-lg border border-gray-200",
                            "hover:border-main hover:bg-gray-50 transition-colors",
                            "text-left focus:outline-none focus:ring-2 focus:ring-main/20"
                        )}
                    >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <MapPin className="h-4 w-4 text-main flex-shrink-0" />
                            <span className="font-medium text-sm truncate">
                                {selectedText}
                            </span>
                        </div>
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 text-gray-400 transition-transform flex-shrink-0",
                                open && "rotate-180"
                            )}
                        />
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0 bg-white rounded-xl shadow-xl border-0 ring-1 ring-black/5"
                    align="center"
                    sideOffset={8}
                >
                    <div className="max-h-[300px] overflow-y-auto">
                        {/* Default option: Terminal station */}
                        <button
                            type="button"
                            onClick={() => {
                                onSelect(null);
                                setOpen(false);
                            }}
                            className={cn(
                                "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100",
                                selectedId === null && "bg-blue-50"
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-main flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm text-gray-900">
                                        {defaultText}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        Điểm đi/đến chính
                                    </div>
                                </div>
                            </div>
                        </button>

                        {/* Pickup points list */}
                        {pickupPoints.map((point) => {
                            const estimatedTime = calculatePickupTime(
                                departureTime,
                                point.estimatedMinutesFromDeparture
                            );

                            return (
                                <button
                                    key={point.id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(point.id);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0",
                                        selectedId === point.id && "bg-blue-50"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm text-gray-900">
                                                {point.name}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                                {point.address}
                                            </div>
                                            <div className="flex items-center gap-1 mt-1.5 text-xs text-main font-medium">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>Dự kiến {estimatedTime}</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
