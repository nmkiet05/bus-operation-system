"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut, ShieldCheck, UserCircle, Ticket, Wallet } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/providers/auth-provider";

/**
 * LoginDrawer - Side Drawer cho đăng nhập và quản lý tài khoản
 * - Chưa đăng nhập: Hiện form đăng nhập/đăng ký
 * - Đã đăng nhập: Hiện thông tin user + nút đăng xuất
 */
export function LoginDrawer({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        setOpen(false);
        logout();
    };

    const handleNavigate = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    // Helpers
    const displayName = user?.fullName || user?.username || "Người dùng";
    const isAdmin = user?.roles?.some(r => r === "ROLE_ADMIN" || r === "ADMIN" || r === "ROLE_MANAGER" || r === "MANAGER");
    const isDriver = user?.roles?.some(r => r === "ROLE_DRIVER" || r === "DRIVER");
    const roleLabel = isAdmin ? "Quản trị viên" : isDriver ? "Tài xế" : "Khách hàng";

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>

            <SheetContent side="right" className="w-full p-0 sm:w-[400px] border-l-0 bg-[#f3f4f6]">
                <SheetTitle className="sr-only">Menu tài khoản</SheetTitle>

                {/* ===== HEADER ===== */}
                <div className="relative h-40 w-full overflow-hidden bg-[#0EA5E9]">
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute -left-4 bottom-0 h-32 w-32 rounded-full bg-black/10 blur-xl" />

                    {/* Close Button */}
                    <SheetTrigger asChild>
                        <button className="absolute right-4 top-4 z-50 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                            <ChevronRight className="h-6 w-6 rotate-180" />
                        </button>
                    </SheetTrigger>

                    <div className="relative z-10 flex h-full flex-col justify-center px-6 text-white">
                        <div className="flex items-center gap-4">
                            {user ? (
                                /* ── Đã đăng nhập ── */
                                <>
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-2 ring-white/30">
                                        <span className="text-2xl font-bold uppercase">
                                            {displayName.charAt(0)}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-bold leading-tight truncate">{displayName}</h2>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <ShieldCheck className="h-3.5 w-3.5 text-green-300 flex-shrink-0" />
                                            <p className="text-sm text-white/80">{roleLabel}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* ── Chưa đăng nhập ── */
                                <>
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl backdrop-blur-sm">
                                        👤
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold leading-tight">Xin chào, Khách!</h2>
                                        <p className="text-sm text-white/80">Đăng nhập để quản lý vé xe</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ===== CONTENT BODY ===== */}
                <div className="px-4 py-6 -mt-6 relative z-20">

                    {user ? (
                        /* ========== ĐÃ ĐĂNG NHẬP ========== */
                        <>
                            {/* Admin Panel Link */}
                            {isAdmin && (
                                <button
                                    onClick={() => handleNavigate("/admin")}
                                    className="mb-4 w-full rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] p-4 text-left shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    <div className="flex items-center justify-between text-white">
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck className="h-5 w-5" />
                                            <div>
                                                <p className="font-bold text-sm">Bảng điều khiển</p>
                                                <p className="text-xs text-white/70">Quản lý hệ thống</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-white/60" />
                                    </div>
                                </button>
                            )}

                            {/* Menu Group: Tài khoản */}
                            <div className="mb-6 space-y-3">
                                <h4 className="px-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Tài khoản của tôi
                                </h4>
                                <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                                    <button onClick={() => handleNavigate("/bookings")} className="group flex w-full items-center justify-between border-b border-gray-100 p-4 transition-colors hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <Ticket className="h-4 w-4 text-[#0EA5E9]" />
                                            <span className="font-medium text-gray-700 group-hover:text-gray-900">Vé của tôi</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </button>

                                    <button onClick={() => handleNavigate("/profile")} className="group flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <UserCircle className="h-4 w-4 text-[#0EA5E9]" />
                                            <span className="font-medium text-gray-700 group-hover:text-gray-900">Thông tin cá nhân</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Menu Group: Tiện ích */}
                            <div className="mb-6 space-y-3">
                                <h4 className="px-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Tiện ích
                                </h4>
                                <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                                    <button onClick={() => handleNavigate("/wallet")} className="group flex w-full items-center justify-between border-b border-gray-100 p-4 transition-colors hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <Wallet className="h-4 w-4 text-[#0EA5E9]" />
                                            <span className="font-medium text-gray-700 group-hover:text-gray-900">Ví BusPay</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </button>
                                    <div className="group flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-gray-50">
                                        <span className="font-medium text-gray-700 group-hover:text-gray-900">Hỗ trợ khách hàng</span>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="w-full rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-bold text-red-600 transition-all hover:bg-red-100 hover:border-red-300 active:scale-[0.98]"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <LogOut className="h-4 w-4" />
                                    <span>Đăng xuất</span>
                                </div>
                            </button>
                        </>
                    ) : (
                        /* ========== CHƯA ĐĂNG NHẬP ========== */
                        <>
                            {/* Login/Register Card */}
                            <div className="mb-6 rounded-2xl bg-white p-5 shadow-lg ring-1 ring-black/5">
                                <h3 className="mb-2 text-lg font-bold text-gray-800">
                                    Truy cập tài khoản
                                </h3>
                                <p className="mb-4 text-sm text-gray-500">
                                    Đăng nhập để xem vé đã đặt, ví tiền và ưu đãi dành riêng cho bạn.
                                </p>

                                <div className="flex gap-3">
                                    <Link
                                        href="/login"
                                        onClick={() => setOpen(false)}
                                        className="flex-1 rounded-xl bg-[#0EA5E9] py-2.5 text-center text-sm font-bold text-white shadow-md transition-all hover:bg-[#0284C7] active:scale-[0.98]"
                                    >
                                        Đăng nhập
                                    </Link>
                                    <Link
                                        href="/register"
                                        onClick={() => setOpen(false)}
                                        className="flex-1 rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-center text-sm font-bold text-gray-700 transition-all hover:bg-gray-100 hover:text-black"
                                    >
                                        Đăng ký
                                    </Link>
                                </div>
                            </div>

                            {/* Menu Group: Khách */}
                            <div className="mb-6 space-y-3">
                                <h4 className="px-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Tiện ích
                                </h4>
                                <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                                    <Link href="/booking/lookup" onClick={() => setOpen(false)} className="group flex items-center justify-between border-b border-gray-100 p-4 transition-colors hover:bg-gray-50">
                                        <span className="font-medium text-gray-700 group-hover:text-gray-900">Tra cứu vé</span>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </Link>
                                    <div className="group flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-gray-50">
                                        <span className="font-medium text-gray-700 group-hover:text-gray-900">Hỗ trợ khách hàng</span>
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="absolute bottom-6 w-full text-center">
                    <p className="text-xs text-gray-400">
                        Version 1.0.0 • Bus Operation System
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    );
}
