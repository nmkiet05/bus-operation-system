"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface RoundTripTabsProps {
    departureDate: Date;
    returnDate: Date;
    activeTab: "outbound" | "return";
    onTabChange: (tab: "outbound" | "return") => void;
    outboundSelected: boolean;
    returnSelected: boolean;
    returnEnabled: boolean;
    fromName?: string;
    toName?: string;
}

export function RoundTripTabs({
    departureDate,
    returnDate,
    activeTab,
    onTabChange,
    outboundSelected,
    returnSelected,
    returnEnabled,
    fromName,
    toName,
}: RoundTripTabsProps) {
    const formatTabDate = (date: Date) =>
        format(date, "EEEE, dd/MM", { locale: vi }).toUpperCase();

    const tabs = [
        {
            id: "outbound" as const,
            label: "CHUYẾN ĐI",
            date: formatTabDate(departureDate),
            selected: outboundSelected,
            enabled: true,
            direction: fromName && toName ? `${fromName} → ${toName}` : undefined,
        },
        {
            id: "return" as const,
            label: "CHUYẾN VỀ",
            date: formatTabDate(returnDate),
            selected: returnSelected,
            enabled: returnEnabled,
            direction: fromName && toName ? `${toName} → ${fromName}` : undefined,
        },
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-4">
            <div className="grid grid-cols-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        disabled={!tab.enabled}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "relative py-3.5 px-4 text-center transition-all",
                            activeTab === tab.id
                                ? "bg-white"
                                : "bg-gray-50 hover:bg-gray-100",
                            !tab.enabled && "opacity-40 cursor-not-allowed"
                        )}
                    >
                        {/* Active indicator */}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-4 right-4 h-[3px] bg-brand-blue rounded-t-full" />
                        )}

                        <div className="flex items-center justify-center gap-2">
                            <span
                                className={cn(
                                    "text-sm font-bold tracking-wide",
                                    activeTab === tab.id
                                        ? "text-brand-blue"
                                        : "text-gray-500"
                                )}
                            >
                                {tab.label}
                            </span>
                            {tab.selected && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                    <Check className="h-3 w-3" />
                                </span>
                            )}
                        </div>

                        <p
                            className={cn(
                                "text-xs mt-0.5",
                                activeTab === tab.id
                                    ? "text-gray-700 font-semibold"
                                    : "text-gray-400"
                            )}
                        >
                            {tab.date}
                        </p>

                        {tab.direction && (
                            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center justify-center gap-1">
                                {tab.direction}
                            </p>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
