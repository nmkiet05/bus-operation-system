"use client";

import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Bus, LogOut, User } from "lucide-react";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();

    // Chỉ DRIVER (hoặc ADMIN/STAFF để test) mới được vào
    useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/login?returnUrl=/driver");
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Bus className="h-4 w-4 text-blue-400" />
                        </div>
                        <span className="font-semibold text-sm text-white tracking-wide">
                            Driver Portal
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
                            <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <User className="h-3 w-3 text-blue-400" />
                            </div>
                            <span className="text-xs font-medium text-slate-200">
                                {user.fullName || user.username}
                            </span>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
                {children}
            </main>
        </div>
    );
}
