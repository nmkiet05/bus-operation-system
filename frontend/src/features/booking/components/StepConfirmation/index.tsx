"use client";

import { TripDetail } from "@/services/api/trips";
import {
    BookingData,
} from "@/features/booking/hooks/useBookingFlow";
import { usePickupPoints } from "@/hooks/usePickupPoints";
import { calculatePickupTime } from "@/lib/pickupTimeUtils";
import { PriceBreakdown } from "./PriceBreakdown";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import {
    MapPin,
    Clock,
    Users,
    Phone,
    Mail,
    Armchair,
    ArrowLeftRight,
    Bus,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface StepConfirmationProps {
    trip: TripDetail;
    returnTrip?: TripDetail | null;
    bookingData: BookingData;
    onPaymentMethodChange: (method: string) => void;
    onSubmit: () => Promise<void> | void;
    isSubmitting?: boolean;
}

export function StepConfirmation({
    trip,
    returnTrip,
    bookingData,
    onPaymentMethodChange,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSubmit,
}: StepConfirmationProps) {
    const isRoundTrip = !!returnTrip;

    // Fallback: If parent doesn't handle verify, we assume onSubmit handles everything.
    // But usually StepConfirmation is just UI. 
    // Wait, the page.tsx handles the logic. Let's see how page.tsx uses this.


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Booking Summary */}
            <div className="lg:col-span-2 space-y-4">
                {/* Outbound Trip Info */}
                <TripSummaryCard
                    trip={trip}
                    bookingData={bookingData}
                    label={isRoundTrip ? "Chuyến đi" : undefined}
                    color="emerald"
                    seatKey="selectedSeats"
                    pickupKey="pickupPointId"
                    dropoffKey="dropoffPointId"
                />

                {/* Return Trip Info */}
                {isRoundTrip && returnTrip && (
                    <TripSummaryCard
                        trip={returnTrip}
                        bookingData={bookingData}
                        label="Chuyến về"
                        color="orange"
                        seatKey="returnSelectedSeats"
                        pickupKey="returnPickupPointId"
                        dropoffKey="returnDropoffPointId"
                    />
                )}

                {/* Passengers */}
                <SummaryCard
                    icon={<Users className="h-5 w-5 text-brand-blue" />}
                    title={`Hành khách (${bookingData.passengers.length})`}
                >
                    <div className="divide-y divide-gray-100">
                        {bookingData.passengers.map((passenger, idx) => (
                            <div
                                key={passenger.id}
                                className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {passenger.fullName}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            CCCD: {passenger.idNumber} · SĐT: {passenger.phone}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {passenger.seatCode && (
                                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-mono font-bold">
                                            Đi: {passenger.seatCode}
                                        </span>
                                    )}
                                    {passenger.returnSeatCode && (
                                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-mono font-bold">
                                            Về: {passenger.returnSeatCode}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </SummaryCard>

                {/* Contact Info */}
                {bookingData.contactInfo && (
                    <SummaryCard
                        icon={<Phone className="h-5 w-5 text-brand-blue" />}
                        title="Thông tin liên hệ"
                    >
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-700 font-medium">
                                    {bookingData.contactInfo.phone}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-700 font-medium">
                                    {bookingData.contactInfo.email}
                                </span>
                            </div>
                            {bookingData.contactInfo.notes && (
                                <p className="w-full text-xs text-gray-500 mt-1">
                                    Ghi chú: {bookingData.contactInfo.notes}
                                </p>
                            )}
                        </div>
                    </SummaryCard>
                )}
            </div>

            {/* Right: Price + Payment */}
            <div className="space-y-4">
                <PriceBreakdown
                    outboundPrice={trip.price}
                    outboundSeatCount={bookingData.selectedSeats.length}
                    returnPrice={returnTrip?.price}
                    returnSeatCount={bookingData.returnSelectedSeats.length}
                    isRoundTrip={isRoundTrip}
                />
                <PaymentMethodSelector
                    selectedMethod={bookingData.paymentMethod}
                    onSelect={onPaymentMethodChange}
                />
            </div>
        </div>
    );
}

/* ─────── Trip Summary Card (Outbound or Return) ─────── */

interface TripSummaryCardProps {
    trip: TripDetail;
    bookingData: BookingData;
    label?: string;
    color: "emerald" | "orange";
    seatKey: "selectedSeats" | "returnSelectedSeats";
    pickupKey: "pickupPointId" | "returnPickupPointId";
    dropoffKey: "dropoffPointId" | "returnDropoffPointId";
}

function TripSummaryCard({
    trip,
    bookingData,
    label,
    color,
    seatKey,
    pickupKey,
    dropoffKey,
}: TripSummaryCardProps) {
    const { data: pickupPoints = [] } = usePickupPoints(trip.routeId);

    const departureTime = format(new Date(trip.departureTime), "HH:mm");
    const arrivalTime = format(new Date(trip.arrivalTime), "HH:mm");
    const departureDate = format(new Date(trip.departureTime), "EEEE, dd/MM/yyyy", { locale: vi });

    const seats = bookingData[seatKey] as string[];
    const pickupId = bookingData[pickupKey] as number | null;
    const dropoffId = bookingData[dropoffKey] as number | null;

    const pickupPoint = pickupPoints.find((p) => p.id === pickupId);
    const dropoffPoint = pickupPoints.find((p) => p.id === dropoffId);

    const pickupName = pickupPoint?.name ?? trip.fromStation.name;
    const dropoffName = dropoffPoint?.name ?? trip.toStation.name;

    const pickupTimeStr = pickupPoint
        ? calculatePickupTime(departureTime, pickupPoint.estimatedMinutesFromDeparture)
        : departureTime;
    const dropoffTimeStr = dropoffPoint
        ? calculatePickupTime(departureTime, dropoffPoint.estimatedMinutesFromDeparture)
        : arrivalTime;

    const colorMap = {
        emerald: {
            badge: "bg-emerald-100 text-emerald-700",
            dot: "bg-emerald-500",
            border: "border-emerald-200",
            bg: "bg-emerald-50",
        },
        orange: {
            badge: "bg-orange-100 text-orange-700",
            dot: "bg-orange-500",
            border: "border-orange-200",
            bg: "bg-orange-50",
        },
    };
    const c = colorMap[color];

    return (
        <div className={`bg-white rounded-xl border ${label ? c.border : "border-gray-200"} shadow-sm overflow-hidden`}>
            {/* Label header */}
            {label && (
                <div className={`${c.bg} px-5 py-2.5 flex items-center gap-2 border-b ${c.border}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                    <span className="text-sm font-bold text-gray-700">{label}</span>
                    {color === "orange" && <ArrowLeftRight className="h-3.5 w-3.5 text-gray-400" />}
                </div>
            )}

            <div className="p-5 space-y-4">
                {/* Trip route & time */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">
                            {trip.routeName}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm bg-blue-50 text-brand-blue px-2.5 py-1 rounded-full font-semibold">
                                {trip.busType}
                            </span>
                            {trip.busLicensePlate && (
                                <span className="text-sm bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                                    <Bus className="h-3.5 w-3.5" />
                                    {trip.busLicensePlate}
                                </span>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">{departureDate}</p>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="text-center">
                            <p className="text-xl font-bold text-gray-900">{departureTime}</p>
                            <p className="text-gray-500 text-xs">{trip.fromStation.name}</p>
                        </div>
                        <div className="flex-1 flex items-center gap-2 px-2">
                            <div className="flex-1 h-px bg-gray-300" />
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                {Math.floor(trip.duration / 60)}h{trip.duration % 60 > 0 ? `${trip.duration % 60}p` : ""}
                            </span>
                            <div className="flex-1 h-px bg-gray-300" />
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-bold text-gray-900">{arrivalTime}</p>
                            <p className="text-gray-500 text-xs">{trip.toStation.name}</p>
                        </div>
                    </div>
                </div>

                {/* Seats */}
                <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Armchair className="h-4 w-4 text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Ghế đã chọn ({seats.length})
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {seats.map((seat) => (
                            <div
                                key={seat}
                                className={`${c.badge} font-bold px-3 py-1.5 rounded-lg text-sm`}
                            >
                                {seat}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pickup/Dropoff */}
                <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Điểm đón & trả
                        </span>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-1 pt-1">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <div className="w-0.5 h-6 bg-gray-300" />
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                        </div>
                        <div className="flex-1 space-y-3">
                            <div>
                                <span className="text-sm font-bold text-gray-900">{pickupName}</span>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                    <Clock className="h-3 w-3" />
                                    {pickupTimeStr}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-bold text-gray-900">{dropoffName}</span>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                    <Clock className="h-3 w-3" />
                                    {dropoffTimeStr}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────── Reusable Summary Card ─────── */

function SummaryCard({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                    {title}
                </h3>
            </div>
            {children}
        </div>
    );
}
