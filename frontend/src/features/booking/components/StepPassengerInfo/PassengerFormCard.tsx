"use client";

import { useState } from "react";
import { PassengerInfo } from "@/features/booking/hooks/useBookingFlow";
import { cn } from "@/lib/utils";

interface PassengerFormCardProps {
    passenger: PassengerInfo;
    index: number;
    onUpdate: (index: number, field: keyof PassengerInfo, value: string) => void;
}

export function PassengerFormCard({ passenger, index, onUpdate }: PassengerFormCardProps) {
    const handleChange = (field: keyof PassengerInfo, value: string) => {
        onUpdate(index, field, value);
    };

    // Simple validation helpers
    const validateName = (name: string) => {
        if (!name) return "Vui lòng nhập họ tên";
        if (name.length < 3) return "Tên phải có ít nhất 3 ký tự";
        if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(name)) return "Tên chỉ được chứa chữ cái";
        return "";
    };

    const validateIdNumber = (idNumber: string) => {
        if (!idNumber) return "Vui lòng nhập CMND/CCCD";
        if (!/^\d{9}$|^\d{12}$/.test(idNumber)) return "CMND 9 số hoặc CCCD 12 số";
        return "";
    };

    const validatePhone = (phone: string) => {
        if (!phone) return "Vui lòng nhập số điện thoại";
        if (!/^(0|\+84)[0-9]{9}$/.test(phone)) return "Số điện thoại không hợp lệ";
        return "";
    };

    const [errors, setErrors] = useState({
        fullName: "",
        idNumber: "",
        phone: "",
    });

    const handleBlur = (field: keyof PassengerInfo) => {
        let error = "";
        if (field === "fullName") error = validateName(passenger.fullName);
        if (field === "idNumber") error = validateIdNumber(passenger.idNumber);
        if (field === "phone") error = validatePhone(passenger.phone);

        setErrors((prev) => ({ ...prev, [field]: error }));
    };

    const inputClasses = (hasError: boolean) =>
        cn(
            "w-full px-3.5 py-2.5 border rounded-lg text-sm transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue",
            "placeholder:text-gray-400",
            hasError ? "border-red-400 bg-red-50/50" : "border-gray-300 bg-white hover:border-gray-400"
        );

    return (
        <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-brand-blue/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-brand-blue">{index + 1}</span>
                    </div>
                    <span className="font-semibold text-gray-800">Hành khách {index + 1}</span>
                </div>
                <div className="flex gap-2">
                    {passenger.seatCode && (
                        <span className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg">
                            Ghế đi {passenger.seatCode}
                        </span>
                    )}
                    {passenger.returnSeatCode && (
                        <span className="px-2.5 py-1 text-xs font-bold bg-orange-500 text-white rounded-lg">
                            Ghế về {passenger.returnSeatCode}
                        </span>
                    )}
                </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Full Name */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                        Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={passenger.fullName}
                        onChange={(e) => handleChange("fullName", e.target.value)}
                        onBlur={() => handleBlur("fullName")}
                        placeholder="Nguyễn Văn A"
                        className={inputClasses(!!errors.fullName)}
                    />
                    {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                </div>

                {/* ID Number */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                        CMND/CCCD <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={passenger.idNumber}
                        onChange={(e) => handleChange("idNumber", e.target.value)}
                        onBlur={() => handleBlur("idNumber")}
                        placeholder="001234567890"
                        maxLength={12}
                        className={inputClasses(!!errors.idNumber)}
                    />
                    {errors.idNumber && <p className="text-xs text-red-500 mt-1">{errors.idNumber}</p>}
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                        Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="tel"
                        value={passenger.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        onBlur={() => handleBlur("phone")}
                        placeholder="0901234567"
                        className={inputClasses(!!errors.phone)}
                    />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
            </div>
        </div>
    );
}
