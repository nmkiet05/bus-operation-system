"use client";

import { useState, useEffect } from "react";
import { PassengerInfo, ContactInfo } from "@/features/booking/hooks/useBookingFlow";
import { PassengerFormCard } from "./PassengerFormCard";
import { ContactInfoSection } from "./ContactInfoSection";
import { User } from "lucide-react";

interface StepPassengerInfoProps {
    user?: { id?: string | number; username?: string; fullName?: string; phone?: string; email?: string } | null;
    selectedSeats: string[];
    returnSelectedSeats: string[];
    passengers: PassengerInfo[];
    contactInfo: ContactInfo | null;
    onUpdate: (passengers: PassengerInfo[], contact: ContactInfo) => void;
}

export function StepPassengerInfo({
    user,
    selectedSeats,
    returnSelectedSeats,
    passengers: initialPassengers,
    contactInfo: initialContact,
    onUpdate,
}: StepPassengerInfoProps) {
    // Initialize passengers based on MAX of selected seats
    const maxPassengers = Math.max(selectedSeats.length, returnSelectedSeats.length);

    const [passengers, setPassengers] = useState<PassengerInfo[]>(() => {
        if (initialPassengers.length === maxPassengers) {
            return initialPassengers;
        }

        // Create empty passenger forms
        return Array.from({ length: maxPassengers }).map((_, index) => ({
            id: `passenger-${index}-${Date.now()}`,
            fullName: "",
            idNumber: "",
            phone: "",
            seatCode: selectedSeats[index], // Can be undefined
            returnSeatCode: returnSelectedSeats[index], // Can be undefined
        }));
    });

    const [contactInfo, setContactInfo] = useState<ContactInfo>(() => {
        return (
            initialContact || {
                fullName: user?.fullName || "",
                email: user?.email || "",
                phone: user?.phone || "",
                notes: "",
            }
        );
    });

    // Update parent when data changes
    useEffect(() => {
        onUpdate(passengers, contactInfo);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [passengers, contactInfo]);

    const updatePassenger = (index: number, field: keyof PassengerInfo, value: string) => {
        setPassengers((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleSwapPassengers = (index1: number, index2: number) => {
        setPassengers((prev) => {
            const updated = [...prev];
            // Swap all fields EXCEPT id, seatCode, returnSeatCode
            const p1 = updated[index1];
            const p2 = updated[index2];
            
            const tempFullName = p1.fullName;
            const tempIdNumber = p1.idNumber;
            const tempPhone = p1.phone;

            updated[index1] = {
                ...p1,
                fullName: p2.fullName,
                idNumber: p2.idNumber,
                phone: p2.phone
            };

            updated[index2] = {
                ...p2,
                fullName: tempFullName,
                idNumber: tempIdNumber,
                phone: tempPhone
            };
            
            return updated;
        });
    };

    return (
        <div className="space-y-6">
            {/* Passenger Forms Section */}
            <div>
                <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-brand-blue" />
                    </div>
                    <h2 className="text-base font-bold text-gray-800">
                        Thông tin hành khách
                        <span className="ml-2 text-sm font-normal text-gray-500">
                            ({passengers.length} hành khách)
                        </span>
                    </h2>
                </div>

                <div className="space-y-3">
                    {passengers.map((passenger, index) => (
                        <PassengerFormCard
                            key={passenger.id}
                            passenger={passenger}
                            index={index}
                            isFirst={index === 0}
                            isLast={index === passengers.length - 1}
                            onUpdate={updatePassenger}
                            onSwap={handleSwapPassengers}
                        />
                    ))}
                </div>
            </div>

            {/* Contact Info Section */}
            <ContactInfoSection 
                user={user}
                passengers={passengers}
                contactInfo={contactInfo} 
                onUpdate={setContactInfo} 
            />
        </div>
    );
}
