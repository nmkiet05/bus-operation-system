"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const menuItems = [
        {
            title: "Lịch sử đặt vé",
            href: "/bookings",
            icon: Ticket,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar */}
                    <aside className="w-full md:w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold">
                                    U
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Tài khoản</p>
                                    <p className="text-xs text-gray-500">Thành viên</p>
                                </div>
                            </div>

                            <nav className="space-y-1">
                                {menuItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                                isActive
                                                    ? "bg-brand-blue text-white"
                                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                            )}
                                        >
                                            <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-gray-400")} />
                                            {item.title}
                                        </Link>
                                    );
                                })}
                                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-4">
                                    <LogOut className="h-4 w-4" />
                                    Đăng xuất
                                </button>
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
