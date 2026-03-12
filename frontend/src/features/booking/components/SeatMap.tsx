"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { User, Disc } from "lucide-react";

export type SeatStatus = "AVAILABLE" | "BOOKED" | "LOCKED" | "SELECTED" | "DISABLED";

export interface Seat {
    id: string; // "A01", "B05"
    type: "SEAT" | "AISLE" | "DRIVER" | "DOOR" | "EMPTY";
    status?: SeatStatus;
    price?: number;
    deck?: 1 | 2; // Floor 1 or 2
    row?: number;
    col?: number;
}

interface SeatMapProps {
    seats: Seat[];
    selectedSeats: string[];
    onSeatClick: (seat: Seat) => void;
    maxSelectable?: number;
}

/**
 * SeatMap Component
 * Render sơ đồ ghế xe khách (hỗ trợ 2 tầng)
 */
export function SeatMap({
    seats,
    selectedSeats,
    onSeatClick,
}: SeatMapProps) {
    // Separate seats by deck
    const deck1 = seats.filter((s) => s.deck === 1 || !s.deck);
    const deck2 = seats.filter((s) => s.deck === 2);

    // Calculate max rows/cols to build grid
    const getGridStyle = (deckSeats: Seat[]) => {
        const rows = Math.max(...deckSeats.map(s => s.row || 0), 0) + 1;
        const cols = Math.max(...deckSeats.map(s => s.col || 0), 0) + 1;
        return {
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        };
    };

    const renderDeck = (deckSeats: Seat[], deckName: string) => {
        if (deckSeats.length === 0) return null;

        // Custom renderer for Driver 
        const DriverSeat = () => (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                <Disc className="h-6 w-6 text-gray-500" />
            </div>
        );

        return (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex justify-center mb-2">
                    <h3 className="font-bold text-gray-700 bg-white border border-gray-200 px-6 py-1.5 rounded-full text-sm uppercase shadow-sm">
                        {deckName}
                    </h3>
                </div>

                {/* Driver Area */}
                <div className="flex w-full justify-between border-b border-dashed border-gray-200 pb-4 mb-2">
                    <div className="flex flex-col items-center gap-1">
                        <DriverSeat />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Tài xế</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="h-12 w-14 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400 bg-gray-50">
                            Cửa
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Lối lên</span>
                    </div>
                </div>

                {/* Seats Grid */}
                <div className="grid gap-3" style={getGridStyle(deckSeats)}>
                    {deckSeats.map((seat) => {
                        const style = {
                            gridRow: (seat.row || 0) + 1,
                            gridColumn: (seat.col || 0) + 1,
                        };

                        if (seat.type === "AISLE" || seat.type === "EMPTY") {
                            return <div key={seat.id} style={style} className="w-10 h-10" />;
                        }

                        if (seat.type === "DRIVER") return null; // Rendered separately

                        const selectionIndex = selectedSeats.indexOf(seat.id);
                        const isSelected = selectionIndex !== -1;
                        const isBooked = seat.status === "BOOKED";
                        const isLocked = seat.status === "LOCKED";
                        const isDisabled = seat.status === "DISABLED";
                        const isAvailable = !isBooked && !isLocked && !isDisabled;

                        return (
                            <button
                                key={seat.id}
                                style={style}
                                disabled={!isAvailable}
                                onClick={() => onSeatClick(seat)}
                                className={cn(
                                    "relative flex h-14 w-12 flex-col items-center justify-center rounded-lg border-2 transition-all duration-200",
                                    // Available
                                    isAvailable && !isSelected && "border-gray-200 bg-white hover:border-brand-blue hover:shadow-md active:scale-95",
                                    // Selected
                                    isSelected && "border-brand-blue bg-brand-blue text-white shadow-md scale-105 z-10",
                                    // Booked
                                    isBooked && "cursor-not-allowed border-transparent bg-gray-100 text-gray-400",
                                    // Locked
                                    isLocked && "cursor-not-allowed border-yellow-200 bg-yellow-50 text-yellow-500",
                                    // Disabled
                                    isDisabled && "invisible"
                                )}
                                title={`Ghế ${seat.id}`}
                            >
                                {/* Seat Icon Body */}
                                <div className={cn(
                                    "absolute top-1 h-8 w-8 rounded-t-md border-2",
                                    isSelected ? "border-white/30 bg-white/10" : "border-gray-300",
                                    isBooked && "border-gray-300 opacity-50",
                                )}></div>

                                {/* Selection Index Badge */}
                                {isSelected && (
                                    <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-white text-brand-blue border-2 border-brand-blue flex items-center justify-center text-[10px] font-bold z-20 shadow-sm">
                                        {selectionIndex + 1}
                                    </div>
                                )}

                                <span className={cn(
                                    "z-10 text-sm font-bold mt-4",
                                    isSelected ? "text-white" : "text-gray-900",
                                    isBooked && "text-gray-400"
                                )}>{seat.id}</span>

                                {/** User Icon if booked */}
                                {isBooked && (
                                    <User className="absolute -top-2 -right-2 h-4 w-4 text-gray-400 bg-white rounded-full p-0.5 shadow-sm" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-8 md:flex-row justify-center items-start">
            {renderDeck(deck1, "Tầng 1")}
            {renderDeck(deck2, "Tầng 2")}
        </div>
    );
}

/**
 * Helper component to show legend
 */
export function SeatLegend() {
    return (
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
                <div className="h-6 w-5 rounded border-2 border-gray-300 bg-white" />
                <span>Còn trống</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-6 w-5 rounded border-2 border-brand-blue bg-brand-blue shadow-md" />
                <span className="font-bold text-brand-blue">Đang chọn</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-6 w-5 rounded border border-gray-200 bg-gray-100 text-gray-400 flex items-center justify-center">
                    <User className="h-3 w-3" />
                </div>
                <span>Đã đặt</span>
            </div>
        </div>
    );
}
