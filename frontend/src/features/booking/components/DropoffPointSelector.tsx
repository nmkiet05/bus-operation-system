"use client";

import { PickupPointSelector } from "./PickupPointSelector";
import { PickupPoint } from "@/services/api/pickupPoint";

interface DropoffPointSelectorProps {
    pickupPoints: PickupPoint[];
    arrivalTime: string;
    selectedId: number | null;
    onSelect: (id: number | null) => void;
    stationName?: string;
}

export function DropoffPointSelector({
    pickupPoints,
    arrivalTime,
    selectedId,
    onSelect,
    stationName,
}: DropoffPointSelectorProps) {
    return (
        <PickupPointSelector
            label="Điểm trả"
            pickupPoints={pickupPoints}
            departureTime={arrivalTime}
            selectedId={selectedId}
            onSelect={onSelect}
            stationName={stationName}
            placeholder="Chọn điểm trả khách"
        />
    );
}
