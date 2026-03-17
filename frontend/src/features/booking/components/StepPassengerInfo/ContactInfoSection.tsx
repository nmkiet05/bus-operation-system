"use client";

import { useState, useEffect, useRef } from "react";
import { ContactInfo, PassengerInfo } from "@/features/booking/hooks/useBookingFlow";
import { Mail, Phone, FileText, UserCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { authService } from "@/features/auth/services/auth-service";

interface ContactInfoSectionProps {
    user?: { id?: string | number; username?: string; fullName?: string; phone?: string; email?: string } | null;
    passengers: PassengerInfo[];
    contactInfo: ContactInfo;
    onUpdate: (contact: ContactInfo) => void;
}

type ContactMode = "ACCOUNT" | number | "OTHER";

export function ContactInfoSection({ user, passengers, contactInfo, onUpdate }: ContactInfoSectionProps) {
    // Automatically locate the most logical default option
    const initialMode: ContactMode = (user && (user.fullName || user.phone))
        ? "ACCOUNT"
        : (passengers.findIndex(p => p.fullName?.trim()) !== -1 
            ? passengers.findIndex(p => p.fullName?.trim()) 
            : "OTHER");

    const [mode, setMode] = useState<ContactMode>(initialMode);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Xử lý click ra ngoài để đóng dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const [errors, setErrors] = useState({
        fullName: "",
        email: "",
        phone: "",
    });
    const [isFetchingProfile, setIsFetchingProfile] = useState(false);

    // Auto-sync data when mode changes
    useEffect(() => {
        if (mode === "ACCOUNT") {
            // Fetch fresh profile từ API thay vì dùng cache localStorage
            setIsFetchingProfile(true);
            authService.getProfile()
                .then(profile => {
                    onUpdate({
                        ...contactInfo,
                        fullName: profile.fullName || profile.username || user?.fullName || user?.username || "",
                        phone: profile.phone || "",
                        email: profile.email || user?.email || "",
                    });
                    setErrors({ fullName: "", email: "", phone: "" });
                })
                .catch(() => {
                    // Fallback về data trong context nếu API lỗi
                    if (user) {
                        onUpdate({
                            ...contactInfo,
                            fullName: user.fullName || user.username || "",
                            phone: user.phone || "",
                            email: user.email || "",
                        });
                    }
                })
                .finally(() => setIsFetchingProfile(false));
        } else if (typeof mode === "number") {
            const p = passengers[mode];
            if (p) {
                onUpdate({
                    ...contactInfo,
                    fullName: p.fullName || "",
                    phone: p.phone || "",
                    email: "",
                });
                setErrors({ fullName: "", email: "", phone: "" });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, user, passengers]);

    const isNameReadOnly = mode !== "OTHER";
    // Phone: readonly khi đồng bộ từ tài khoản hoặc hành khách
    const isPhoneReadOnly = mode !== "OTHER";
    const isEmailReadOnly = mode === "ACCOUNT";

    const handleChange = (field: keyof ContactInfo, value: string) => {
        onUpdate({ ...contactInfo, [field]: value });
    };

    const validateName = (name: string) => {
        if (!name) return "Vui lòng nhập họ tên";
        if (name.length < 3) return "Tên phải có ít nhất 3 ký tự";
        return "";
    };

    const validateEmail = (email: string) => {
        if (!email) return "";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email không hợp lệ";
        return "";
    };

    const validatePhone = (phone: string) => {
        if (!phone) return "Vui lòng nhập số điện thoại";
        if (!/^0[0-9]{9}$/.test(phone)) return "Số điện thoại phải bao gồm 10 chữ số và bắt đầu bằng số 0";
        return "";
    };

    const handleBlur = (field: keyof ContactInfo) => {
        let error = "";
        if (field === "fullName") error = validateName(contactInfo.fullName);
        if (field === "email") error = validateEmail(contactInfo.email);
        if (field === "phone") error = validatePhone(contactInfo.phone);

        setErrors((prev) => ({ ...prev, [field]: error }));
    };

    const inputClasses = (hasError: boolean, readOnly: boolean) =>
        cn(
            "w-full px-3.5 py-2.5 border rounded-lg text-sm transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue",
            "placeholder:text-gray-400",
            hasError ? "border-red-400 bg-red-50/50" : "border-gray-300",
            readOnly ? "bg-gray-100 cursor-not-allowed text-gray-500" : "bg-white hover:border-gray-400"
        );

    return (
        <div className="rounded-xl border border-gray-200 p-6 bg-gray-50/30">
            <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-brand-blue" />
                </div>
                <h2 className="text-base font-bold text-gray-800">Thông tin liên hệ (Người nhận vé)</h2>
            </div>

            {/* Smart 1-Click Select Zone */}
            <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">Sử dụng thông tin của:</p>
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className={cn(
                            "w-full px-3.5 py-3 border rounded-lg text-sm bg-white hover:border-gray-400 transition-colors flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-left",
                            mode === "OTHER" ? "border-gray-300 text-gray-800" : "font-medium text-brand-blue bg-brand-blue/5 border-brand-blue"
                        )}
                    >
                        <span className="truncate pr-4">
                            {mode === "ACCOUNT" ? `Tài khoản ${user?.fullName || user?.username || user?.phone || ""}` :
                             mode === "OTHER" ? "Người liên hệ khác (Nhập thủ công)..." :
                             `Hành khách ${(mode as number) + 1} ${passengers[mode as number]?.fullName || ""}`}
                        </span>
                        <ChevronDown className={cn("h-4 w-4 text-gray-500 transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
                    </button>

                    {isOpen && (
                        <div className="absolute z-50 top-full left-0 w-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                            <ul className="max-h-60 overflow-auto flex flex-col gap-0.5">
                                {user && (
                                    <li 
                                        onClick={() => { setMode("ACCOUNT"); setIsOpen(false); }}
                                        className={cn(
                                            "cursor-pointer py-2.5 px-3 text-sm rounded-md transition-colors flex items-center", 
                                            mode === "ACCOUNT" ? "bg-brand-blue/10 text-brand-blue font-medium" : "hover:bg-brand-blue/5 text-gray-700"
                                        )}
                                    >
                                        Tài khoản {user.fullName || user.username || user.phone}
                                    </li>
                                )}
                                
                                {passengers.map((p, idx) => {
                                    if (!p.fullName?.trim()) return null;
                                    const desc = p.phone ? `(${p.phone})` : "";
                                    return (
                                        <li 
                                            key={idx}
                                            onClick={() => { setMode(idx); setIsOpen(false); }}
                                            className={cn(
                                                "cursor-pointer py-2.5 px-3 text-sm rounded-md transition-colors flex items-center", 
                                                mode === idx ? "bg-brand-blue/10 text-brand-blue font-medium" : "hover:bg-brand-blue/5 text-gray-700"
                                            )}
                                        >
                                            Hành khách {idx + 1} {p.fullName} {desc}
                                        </li>
                                    );
                                })}

                                <li 
                                    onClick={() => { setMode("OTHER"); setIsOpen(false); }}
                                    className={cn(
                                        "cursor-pointer py-2.5 px-3 text-sm rounded-md transition-colors flex items-center", 
                                        mode === "OTHER" ? "bg-brand-blue/10 text-brand-blue font-medium" : "hover:bg-brand-blue/5 text-gray-700"
                                    )}
                                >
                                    Người liên hệ khác (Nhập thủ công)...
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Read-only Hint / Fetching spinner */}
            {mode !== "OTHER" && (
                <div className="mb-4 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 flex items-center gap-2">
                    {isFetchingProfile
                        ? <><Loader2 className="h-3 w-3 animate-spin" /> Đang tải thông tin tài khoản...</>
                        : <><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500" /> Đang đồng bộ tự động. Các thông tin còn thiếu có thể nhập bổ sung.</>
                    }
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                        Họ và tên người nhận <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            readOnly={isNameReadOnly}
                            value={contactInfo.fullName}
                            onChange={(e) => handleChange("fullName", e.target.value)}
                            onBlur={() => handleBlur("fullName")}
                            placeholder="Nguyễn Văn A"
                            className={cn(inputClasses(!!errors.fullName, isNameReadOnly), "pl-10")}
                        />
                    </div>
                    {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                </div>

                {/* Email */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                        Email <span className="text-gray-400 normal-case tracking-normal font-normal">(không bắt buộc)</span>
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="email"
                            readOnly={isEmailReadOnly}
                            value={contactInfo.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            onBlur={() => handleBlur("email")}
                            placeholder="example@email.com"
                            className={cn(inputClasses(!!errors.email, isEmailReadOnly), "pl-10")}
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
                            maxLength={10}
                            readOnly={isPhoneReadOnly}
                            value={contactInfo.phone}
                            onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, ''))}
                            onBlur={() => handleBlur("phone")}
                            placeholder="0901234567"
                            className={cn(inputClasses(!!errors.phone, isPhoneReadOnly), "pl-10")}
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
                            onChange={(e) => onUpdate({ ...contactInfo, notes: e.target.value })}
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
