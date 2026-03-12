"use client";

import { useAuth } from "@/providers/auth-provider";
import { Bell, Search, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

/**
 * Header Bar cho Admin Panel
 * - Thanh tìm kiếm nhanh
 * - Thông báo
 * - User dropdown
 */
export function AdminHeader() {
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-gray-100">
            {/* Phần bên trái: Thanh tìm kiếm */}
            <div className="flex items-center gap-4 flex-1">
                <div className="relative max-w-md w-full hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm chuyến, biển số, tài xế..."
                        className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors"
                    />
                </div>
            </div>

            {/* Phần bên phải: Notification + User */}
            <div className="flex items-center gap-3">
                {/* Nút thông báo */}
                <button className="relative p-2 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
                    <Bell className="h-5 w-5" />
                    {/* Badge đỏ - TODO: kết nối API notification */}
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* User Menu */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue text-xs font-bold">
                            {user?.username?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-medium text-gray-700">
                                {user?.username || "Admin"}
                            </p>
                            <p className="text-[11px] text-gray-400">
                                {user?.roles?.[0]?.replace("ROLE_", "") || "USER"}
                            </p>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
                    </button>

                    {/* Dropdown */}
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-50">
                            <button
                                onClick={() => {
                                    setDropdownOpen(false);
                                    logout();
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
