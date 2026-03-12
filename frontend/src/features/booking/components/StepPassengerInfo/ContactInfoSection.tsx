"use client";

import { useState } from "react";
import { ContactInfo } from "@/features/booking/hooks/useBookingFlow";
import { Mail, Phone, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactInfoSectionProps {
    contactInfo: ContactInfo;
    onUpdate: (contact: ContactInfo) => void;
}

export function ContactInfoSection({ contactInfo, onUpdate }: ContactInfoSectionProps) {
    const [errors, setErrors] = useState({
        email: "",
        phone: "",
    });

    const handleChange = (field: keyof ContactInfo, value: string) => {
        onUpdate({ ...contactInfo, [field]: value });
    };

    const validateEmail = (email: string) => {
        if (!email) return "Vui lòng nhập email";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email không hợp lệ";
        return "";
    };

    const validatePhone = (phone: string) => {
        if (!phone) return "Vui lòng nhập số điện thoại";
        if (!/^(0|\+84)[0-9]{9}$/.test(phone)) return "Số điện thoại không hợp lệ";
        return "";
    };

    const handleBlur = (field: keyof ContactInfo) => {
        let error = "";
        if (field === "email") error = validateEmail(contactInfo.email);
        if (field === "phone") error = validatePhone(contactInfo.phone);

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
        <div className="rounded-xl border border-gray-200 p-6 bg-gray-50/30">
            <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-brand-blue" />
                </div>
                <h2 className="text-base font-bold text-gray-800">Thông tin liên hệ</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="email"
                            value={contactInfo.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            onBlur={() => handleBlur("email")}
                            placeholder="example@email.com"
                            className={cn(inputClasses(!!errors.email), "pl-10")}
                        />
                    </div>
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    <p className="text-[11px] text-gray-400 mt-1">
                        Vé điện tử sẽ được gửi tới email này
                    </p>
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                        Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="tel"
                            value={contactInfo.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            onBlur={() => handleBlur("phone")}
                            placeholder="0901234567"
                            className={cn(inputClasses(!!errors.phone), "pl-10")}
                        />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                    <p className="text-[11px] text-gray-400 mt-1">
                        Dùng để nhận thông báo về chuyến đi
                    </p>
                </div>

                {/* Notes (Optional) - Full width */}
                <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                        Ghi chú (không bắt buộc)
                    </label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <textarea
                            value={contactInfo.notes || ""}
                            onChange={(e) => handleChange("notes", e.target.value)}
                            placeholder="Yêu cầu đặc biệt, ghi chú..."
                            rows={2}
                            maxLength={500}
                            className="w-full pl-10 pr-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue resize-none placeholder:text-gray-400 bg-white hover:border-gray-400 transition-colors"
                        />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 text-right">
                        {contactInfo.notes?.length || 0}/500
                    </p>
                </div>
            </div>
        </div>
    );
}
