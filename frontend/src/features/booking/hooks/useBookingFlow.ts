"use client";

import { useState, useCallback } from "react";

/**
 * Booking data structure — supports both one-way and round-trip
 */
export interface BookingData {
    tripId: number;
    // Outbound
    selectedSeats: string[];
    pickupPointId: number | null;
    dropoffPointId: number | null;
    // Return (round-trip only)
    returnSelectedSeats: string[];
    returnPickupPointId: number | null;
    returnDropoffPointId: number | null;
    // Shared
    passengers: PassengerInfo[];
    contactInfo: ContactInfo | null;
    paymentMethod: string | null;
}

export interface PassengerInfo {
    id: string; // UUID for React keys
    fullName: string;
    idNumber: string; // CMND/CCCD
    phone: string;
    seatCode: string; // Assigned seat (A01, B05, etc.)
    returnSeatCode?: string; // Assigned return seat
}

export interface ContactInfo {
    fullName: string;
    email: string;
    phone: string;
    notes?: string;
}

export const useBookingFlow = (tripId: number) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [bookingData, setBookingData] = useState<BookingData>({
        tripId,
        selectedSeats: [],
        pickupPointId: null,
        dropoffPointId: null,
        returnSelectedSeats: [],
        returnPickupPointId: null,
        returnDropoffPointId: null,
        passengers: [],
        contactInfo: {
            fullName: "",
            email: "",
            phone: "",
        },
        paymentMethod: "COUNTER",
    });

    const goToNextStep = useCallback(() => {
        setCurrentStep((prev) => prev + 1);
    }, []);

    const goToPrevStep = useCallback(() => {
        setCurrentStep((prev) => prev - 1);
    }, []);

    const goToStep = useCallback((step: number) => {
        setCurrentStep(step);
    }, []);

    const updateSeats = useCallback((seats: string[]) => {
        setBookingData((prev) => ({ ...prev, selectedSeats: seats }));
    }, []);

    const updatePickupDropoff = useCallback(
        (pickupPointId: number | null, dropoffPointId: number | null) => {
            setBookingData((prev) => ({ ...prev, pickupPointId, dropoffPointId }));
        },
        []
    );

    const updateReturnSeats = useCallback((seats: string[]) => {
        setBookingData((prev) => ({ ...prev, returnSelectedSeats: seats }));
    }, []);

    const updateReturnPickupDropoff = useCallback(
        (returnPickupPointId: number | null, returnDropoffPointId: number | null) => {
            setBookingData((prev) => ({ ...prev, returnPickupPointId, returnDropoffPointId }));
        },
        []
    );

    const updatePassengers = useCallback((passengers: PassengerInfo[]) => {
        setBookingData((prev) => ({ ...prev, passengers }));
    }, []);

    const updateContactInfo = useCallback((contactInfo: ContactInfo) => {
        setBookingData((prev) => ({ ...prev, contactInfo }));
    }, []);

    const updatePaymentMethod = useCallback((method: string) => {
        setBookingData((prev) => ({ ...prev, paymentMethod: method }));
    }, []);

    // Validation helpers
    const canProceedFromStep = useCallback(
        (step: number, isRoundTrip = false) => {
            switch (step) {
                case 1: // Seat selection
                    if (isRoundTrip) {
                        return (
                            bookingData.selectedSeats.length > 0 &&
                            bookingData.returnSelectedSeats.length > 0
                        );
                    }
                    return bookingData.selectedSeats.length > 0;
                case 2: // Pickup/Dropoff (optional)
                    return true; // Always allow proceeding
                case 3: // Passenger info
                    // Calculate max passengers
                    const maxPax = Math.max(bookingData.selectedSeats.length, bookingData.returnSelectedSeats.length);
                    return (
                        bookingData.passengers.length === maxPax &&
                        bookingData.passengers.every(
                            (p) => p.fullName.trim() !== "" && p.idNumber.trim() !== "" && p.phone.trim() !== ""
                        ) &&
                        bookingData.contactInfo !== null &&
                        bookingData.contactInfo.fullName.trim() !== "" &&
                        bookingData.contactInfo.phone.trim() !== ""
                    );
                case 4: // Payment
                    return bookingData.paymentMethod !== null;
                default:
                    return false;
            }
        },
        [bookingData]
    );

    return {
        currentStep,
        bookingData,
        goToNextStep,
        goToPrevStep,
        goToStep,
        updateSeats,
        updatePickupDropoff,
        updateReturnSeats,
        updateReturnPickupDropoff,
        updatePassengers,
        updateContactInfo,
        updatePaymentMethod,
        canProceedFromStep,
    };
}
