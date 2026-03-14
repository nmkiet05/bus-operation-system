"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Bus,
    Map,
    TicketPercent,
    Users,
    BarChart3,
    Settings,
    LogOut,
    CalendarClock,
    HelpCircle
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";

interface SidebarItemProps {
    icon: React.ElementType;
    label: string;
    href: string;
    active?: boolean;
}

const SidebarItem = ({ icon: Icon, label, href, active }: SidebarItemProps) => {
    return (
        <Link href={href} className="w-full">
            <div
                className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                    active
                        ? "bg-brand-blue/10 text-brand-blue font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-brand-blue"
                )}
            >
                <Icon className={cn("h-5 w-5", active ? "text-brand-blue" : "text-slate-400 group-hover:text-brand-blue")} />
                <span>{label}</span>
            </div>
        </Link>
    );
};

export function AdminSidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    // Role checking helper
    const hasRole = (roles: string[]) => {
        if (!user || !user.roles) return false;
        return user.roles.some(r => roles.includes(r.replace("ROLE_", "")));
    };

    const menuItems = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/admin",
            roles: ["ADMIN", "MANAGER", "STAFF"],
        },
        {
            label: "Vận hành (Operation)",
            icon: CalendarClock,
            href: "/admin/operation/trips",
            roles: ["ADMIN", "MANAGER"], // Staff sales không cần vào đây
        },
        {
            label: "Đội xe (Fleet)",
            icon: Bus,
            href: "/admin/fleet",
            roles: ["ADMIN", "MANAGER"],
        },
        {
            label: "Tuyến đườոg (Routes)",
            icon: Map,
            href: "/admin/routes",
            roles: ["ADMIN", "MANAGER"],
        },
        {
            label: "Bán vé (Sales)",
            icon: TicketPercent,
            href: "/admin/sales",
            roles: ["ADMIN", "MANAGER", "STAFF"],
        },
        {
            label: "Nhân sự (HR)",
            icon: Users,
            href: "/admin/hr",
            roles: ["ADMIN", "MANAGER"],
        },
        {
            label: "Báo cáo (Reports)",
            icon: BarChart3,
            href: "/admin/reports",
            roles: ["ADMIN", "MANAGER"],
        },
        {
            label: "Cấu hình",
            icon: Settings,
            href: "/admin/settings",
            roles: ["ADMIN"],
        },
        {
            label: "Hỗ trợ (Support)",
            icon: HelpCircle,
            href: "/admin/support",
            roles: ["ADMIN", "MANAGER", "STAFF"],
        },
    ];

    return (
        <div className="flex flex-col h-screen w-64 bg-white border-r border-slate-200 fixed left-0 top-0">
            {/* Header Logo */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-center">
                <h1 className="text-2xl font-bold text-brand-blue">BOS Admin</h1>
            </div>

            {/* User Info */}
            <div className="p-4 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold">
                        {user?.fullName?.charAt(0) || "A"}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold truncate" title={user?.fullName}>{user?.fullName || "User"}</p>
                        <p className="text-xs text-slate-500 truncate" title={user?.roles?.join(", ")}>
                            {user?.roles?.map(r => r.replace("ROLE_", "")).join(", ") || "No Role"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {menuItems.map((item) => {
                    // Nếu item có quy định roles và user không có role đó -> Ẩn
                    if (item.roles && !hasRole(item.roles)) return null;

                    return (
                        <SidebarItem
                            key={item.href}
                            icon={item.icon}
                            label={item.label}
                            href={item.href}
                            active={pathname === item.href || pathname.startsWith(item.href + "/")}
                        />
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-slate-100">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 gap-3"
                    onClick={logout}
                >
                    <LogOut className="h-5 w-5" />
                    <span>Đăng xuất</span>
                </Button>
            </div>
        </div>
    );
}
