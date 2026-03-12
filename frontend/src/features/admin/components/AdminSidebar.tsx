"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { ADMIN_SIDEBAR_MENU } from "@/features/admin/config/sidebar-menu";
import { AdminRole } from "@/features/admin/types";
import {
    LayoutDashboard,
    Bus,
    UserCog,
    Ticket,
    ShoppingCart,
    Route,
    Truck,
    Users,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    Menu,
    CalendarClock,
    Armchair,
    DollarSign,
    ArrowLeftRight,
    MapPin,
    Warehouse,
} from "lucide-react";
import { useState } from "react";

// Map tên icon (string) sang component Lucide tương ứng
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard,
    Bus,
    UserCog,
    Ticket,
    ShoppingCart,
    Route,
    Truck,
    Users,
    BarChart3,
    Settings,
    CalendarClock,
    Armchair,
    DollarSign,
    ArrowLeftRight,
    MapPin,
    Warehouse,
};

/**
 * Sidebar Admin Panel
 * - Hiển thị menu phân quyền theo role
 * - Collapsible trên Desktop, Overlay trên Mobile
 */
export function AdminSidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Lấy roles hiện tại của user
    const userRoles = (user?.roles || []) as AdminRole[];

    // Lọc menu theo role
    const filteredMenu = ADMIN_SIDEBAR_MENU.map((group) => ({
        ...group,
        items: group.items.filter((item) =>
            item.allowedRoles.some((role) => userRoles.includes(role))
        ),
    })).filter((group) => group.items.length > 0);

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Logo & Brand */}
            <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
                <Link href="/admin" className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                        <Bus className="h-5 w-5 text-white" />
                    </div>
                    {!collapsed && (
                        <div>
                            <h1 className="text-base font-bold text-white tracking-tight">
                                BOS Admin
                            </h1>
                            <p className="text-[10px] text-white/50 uppercase tracking-widest">
                                Operation Center
                            </p>
                        </div>
                    )}
                </Link>
                {/* Nút thu gọn Sidebar (Desktop only) */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                    <ChevronLeft
                        className={cn(
                            "h-4 w-4 transition-transform",
                            collapsed && "rotate-180"
                        )}
                    />
                </button>
            </div>

            {/* Menu Groups */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin-transparent">
                {filteredMenu.map((group) => (
                    <div key={group.label}>
                        {!collapsed && (
                            <p className="px-3 mb-2 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                                {group.label}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const Icon = ICON_MAP[item.icon];
                                const isActive =
                                    pathname === item.href ||
                                    (item.href !== "/" &&
                                        item.href !== "/admin" &&
                                        pathname.startsWith(item.href));

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        prefetch={false}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                            collapsed && "justify-center px-2.5",
                                            isActive
                                                ? "bg-white/20 text-white shadow-sm ring-1 ring-white/10"
                                                : "text-white/80 hover:bg-white/10 hover:text-white"
                                        )}
                                        title={collapsed ? item.title : undefined}
                                    >
                                        {Icon && (
                                            <Icon
                                                className={cn(
                                                    "h-[18px] w-[18px] flex-shrink-0",
                                                    isActive
                                                        ? "text-white"
                                                        : "text-white/50"
                                                )}
                                            />
                                        )}
                                        {!collapsed && <span>{item.title}</span>}
                                        {!collapsed && item.badge && (
                                            <span className="ml-auto bg-brand-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User Footer */}
            <div className="border-t border-white/10 px-3 py-3">
                <div
                    className={cn(
                        "flex items-center gap-3 px-3 py-2",
                        collapsed && "justify-center px-0"
                    )}
                >
                    <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent text-xs font-bold flex-shrink-0">
                        {user?.username?.[0]?.toUpperCase() || "U"}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {user?.username || "Admin"}
                            </p>
                            <p className="text-[11px] text-white/40 truncate">
                                {user?.roles?.[0]?.replace("ROLE_", "") || "USER"}
                            </p>
                        </div>
                    )}
                    {!collapsed && (
                        <button
                            onClick={logout}
                            className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-red-300 transition-colors"
                            title="Đăng xuất"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-brand-dark text-white shadow-lg"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    // Base styles
                    "bg-brand-blue flex flex-col h-screen overflow-hidden transition-all duration-300 border-r border-white/10",
                    // Desktop: Fixed width
                    "hidden lg:flex",
                    collapsed ? "w-[72px]" : "w-64",
                    // Mobile: Full overlay
                    mobileOpen && "!flex fixed inset-y-0 left-0 z-50 w-72 shadow-2xl"
                )}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
