"use client";

import { PickupPointSelector } from "./PickupPointSelector";
import { DropoffPointSelector } from "./DropoffPointSelector";
import { usePickupPoints } from "@/hooks/usePickupPoints";
import { calculatePickupTime } from "@/lib/pickupTimeUtils";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepPickupDropoffProps {
    routeId: number;
    departureTime: string;
    arrivalTime: string;
    fromStationName?: string;
    toStationName?: string;
    pickupPointId: number | null;
    dropoffPointId: number | null;
    onPickupChange: (id: number | null) => void;
    onDropoffChange: (id: number | null) => void;
}

export function StepPickupDropoff({
    routeId,
    departureTime,
    arrivalTime,
    fromStationName = "Bến xe đi",
    toStationName = "Bến xe đến",
    pickupPointId,
    dropoffPointId,
    onPickupChange,
    onDropoffChange,
}: StepPickupDropoffProps) {
    const { data: pickupPoints = [], isLoading } = usePickupPoints(routeId);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
                <p className="text-gray-500">Đang tải điểm đón/trả...</p>
            </div>
        );
    }

    if (pickupPoints.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 font-medium">
                    Tuyến này không có điểm đón/trả dọc đường
                </p>
                <p className="text-sm text-gray-400 mt-1">
                    Bạn sẽ lên/xuống tại bến xe chính
                </p>
            </div>
        );
    }

    // Get sequence order of selected points for validation
    const getOrder = (id: number | null, fallback: number) =>
        id === null ? fallback : pickupPoints.find((p) => p.id === id)?.sequenceOrder ?? fallback;

    const pickupOrder = getOrder(pickupPointId, -1);
    const dropoffOrder = getOrder(dropoffPointId, Infinity);

    // Validated handlers: pickup < dropoff, no same point
    const handlePickup = (id: number | null) => {
        const newOrder = getOrder(id, -1);
        if (newOrder >= dropoffOrder && dropoffPointId !== null) {
            onDropoffChange(null);
        }
        onPickupChange(id);
    };

    const handleDropoff = (id: number | null) => {
        const newOrder = getOrder(id, Infinity);
        if (newOrder <= pickupOrder && pickupPointId !== null) {
            onPickupChange(null);
        }
        onDropoffChange(id);
    };

    return (
        <div className="space-y-5">
            {/* Main: Dropdown Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PickupPointSelector
                    label="Điểm đón"
                    pickupPoints={pickupPoints}
                    departureTime={departureTime}
                    selectedId={pickupPointId}
                    onSelect={handlePickup}
                    stationName={fromStationName}
                />
                <DropoffPointSelector
                    pickupPoints={pickupPoints}
                    arrivalTime={arrivalTime}
                    selectedId={dropoffPointId}
                    onSelect={handleDropoff}
                    stationName={toStationName}
                />
            </div>

            {/* Visual: Route Timeline */}
            <div className="bg-gray-50/80 rounded-xl border border-gray-200 px-5 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Lộ trình
                </p>

                {/* Departure */}
                <TimelineNode
                    time={departureTime}
                    name={fromStationName}
                    type="departure"
                    isPickup={pickupPointId === null}
                    canPickup={true}
                    canDropoff={false}
                    onClickPickup={() => handlePickup(null)}
                />

                {/* Intermediate Stops */}
                {pickupPoints.map((point) => {
                    const time = calculatePickupTime(
                        departureTime,
                        point.estimatedMinutesFromDeparture
                    );
                    const order = point.sequenceOrder;

                    return (
                        <TimelineNode
                            key={point.id}
                            time={time}
                            name={point.name}
                            address={point.address}
                            type="stop"
                            isPickup={pickupPointId === point.id}
                            isDropoff={dropoffPointId === point.id}
                            canPickup={order < dropoffOrder && dropoffPointId !== point.id}
                            canDropoff={order > pickupOrder && pickupPointId !== point.id}
                            onClickPickup={() => handlePickup(point.id)}
                            onClickDropoff={() => handleDropoff(point.id)}
                        />
                    );
                })}

                {/* Arrival */}
                <TimelineNode
                    time={arrivalTime}
                    name={toStationName}
                    type="arrival"
                    isDropoff={dropoffPointId === null}
                    canPickup={false}
                    canDropoff={true}
                    onClickDropoff={() => handleDropoff(null)}
                />
            </div>
        </div>
    );
}

/* ─────────────── Timeline Node ─────────────── */

interface TimelineNodeProps {
    time: string;
    name: string;
    address?: string;
    type: "departure" | "stop" | "arrival";
    isPickup?: boolean;
    isDropoff?: boolean;
    canPickup: boolean;
    canDropoff: boolean;
    onClickPickup?: () => void;
    onClickDropoff?: () => void;
}

function TimelineNode({
    time,
    name,
    address,
    type,
    isPickup,
    isDropoff,
    canPickup,
    canDropoff,
    onClickPickup,
    onClickDropoff,
}: TimelineNodeProps) {
    const isTerminal = type === "departure" || type === "arrival";
    const hasSelection = isPickup || isDropoff;

    const showPickupBtn = canPickup && !isPickup && onClickPickup;
    const showDropoffBtn = canDropoff && !isDropoff && onClickDropoff;
    const hasAnyAction = showPickupBtn || showDropoffBtn;

    return (
        <div className="flex items-start gap-4 group">
            {/* Timeline column */}
            <div className="flex flex-col items-center w-5 flex-shrink-0">
                {type !== "departure" && (
                    <div
                        className={cn(
                            "w-0.5 h-3",
                            hasSelection ? "bg-brand-blue" : "bg-gray-300"
                        )}
                    />
                )}
                <div
                    className={cn(
                        "rounded-full z-10 flex-shrink-0 transition-all",
                        isTerminal && "w-4 h-4 bg-brand-blue",
                        !isTerminal && !hasSelection && "w-3 h-3 bg-gray-300 group-hover:bg-gray-400",
                        isPickup && "w-4 h-4 bg-emerald-500 ring-3 ring-emerald-100",
                        isDropoff && "w-4 h-4 bg-orange-500 ring-3 ring-orange-100"
                    )}
                />
                {type !== "arrival" && (
                    <div className="w-0.5 flex-1 bg-gray-300 min-h-[20px]" />
                )}
            </div>

            {/* Content row */}
            <div className="flex-1 pb-4 -mt-0.5 flex items-center gap-3 min-w-0">
                <span
                    className={cn(
                        "text-sm font-bold tabular-nums w-14 flex-shrink-0",
                        isTerminal ? "text-gray-900" : "text-gray-400",
                        isPickup && "text-emerald-600",
                        isDropoff && "text-orange-600"
                    )}
                >
                    {time}
                </span>

                <span
                    className={cn(
                        "text-sm flex-1 min-w-0 truncate",
                        isTerminal ? "font-bold text-gray-900" : "text-gray-600",
                        isPickup && "font-semibold text-emerald-700",
                        isDropoff && "font-semibold text-orange-700"
                    )}
                    title={address || name}
                >
                    {name}
                </span>

                {/* Selected badges */}
                {isPickup && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-white flex-shrink-0">
                        Đón ✓
                    </span>
                )}
                {isDropoff && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-500 text-white flex-shrink-0">
                        Trả ✓
                    </span>
                )}

                {/* Action buttons (hover) */}
                {hasAnyAction && !hasSelection && (
                    <div className="flex gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {showPickupBtn && (
                            <button
                                type="button"
                                onClick={onClickPickup}
                                className="text-xs px-2.5 py-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 font-semibold transition-colors shadow-sm"
                            >
                                Đón
                            </button>
                        )}
                        {showDropoffBtn && (
                            <button
                                type="button"
                                onClick={onClickDropoff}
                                className="text-xs px-2.5 py-1 rounded-full bg-orange-500 text-white hover:bg-orange-600 font-semibold transition-colors shadow-sm"
                            >
                                Trả
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
