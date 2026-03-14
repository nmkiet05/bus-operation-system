"use client";

import { BarChart3, Bus, Ticket, Users, ArrowRight, Calendar, UserCheck, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/services/http/axios";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/features/admin/services/dashboard-service";

/**
 * Trang Dashboard Admin chính
 * Hiển thị các số liệu tổng quan (placeholder)
 */
export default function AdminDashboardPage() {
    const router = useRouter();

    const { data: statsData, isLoading: isLoadingStats } = useQuery({
        queryKey: ["admin-dashboard-stats"],
        queryFn: dashboardService.getTodayStats,
    });

    // Kích hoạt API call nhẹ để check token hợp lệ (nếu token hết hạn -> interceptor đá ra ngoài)
    useEffect(() => {
        axiosInstance.get("/operation/trips?page=0&size=1").catch(() => {
            // Lỗi được Axios Interceptor tự động xử lý và redirect
        });
    }, []);

    const formatCurrency = (amount?: number) => {
        const safeAmount = Number(amount || 0);
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(safeAmount);
    };

    const stats = [
        {
            label: "Chuyến hôm nay",
            value: String(statsData?.tripsToday ?? 0),
            change: "Theo ngày khởi hành",
            icon: Bus,
            color: "bg-blue-500",
        },
        {
            label: "Vé đã bán",
            value: String(statsData?.ticketsSoldToday ?? 0),
            change: "Booking CONFIRMED",
            icon: Ticket,
            color: "bg-green-500",
        },
        {
            label: "Tài xế hoạt động",
            value: String(statsData?.activeDriversToday ?? 0),
            change: "Có assignment hôm nay",
            icon: Users,
            color: "bg-purple-500",
        },
        {
            label: "Doanh thu hôm nay",
            value: formatCurrency(statsData?.revenueToday),
            change: "Payment SUCCESS",
            icon: BarChart3,
            color: "bg-amber-500",
        },
    ];

    const quickActions = [
        {
            label: "Bán Vé",
            description: "Đặt vé cho khách hàng tại quầy",
            icon: Ticket,
            href: "/admin/sales/bookings",
            gradient: "from-green-500 to-emerald-600",
            hoverGradient: "hover:from-green-600 hover:to-emerald-700",
        },
        {
            label: "Quản Lý Chuyến",
            description: "Duyệt, theo dõi vòng đời chuyến",
            icon: Bus,
            href: "/admin/operation/trips",
            gradient: "from-blue-500 to-cyan-600",
            hoverGradient: "hover:from-blue-600 hover:to-cyan-700",
        },
        {
            label: "Đội Ngũ",
            description: "Gán tài xế, tiếp viên cho chuyến",
            icon: UserCheck,
            href: "/admin/operation/crew",
            gradient: "from-purple-500 to-violet-600",
            hoverGradient: "hover:from-purple-600 hover:to-violet-700",
        },
        {
            label: "Ca Xe",
            description: "Lập ca, gán chuyến, CHECK-IN/OUT",
            icon: Calendar,
            href: "/admin/operation/bus-schedule",
            gradient: "from-amber-500 to-orange-600",
            hoverGradient: "hover:from-amber-600 hover:to-orange-700",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Tổng quan hệ thống vận hành xe khách
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    {stat.label}
                                </p>
                                {isLoadingStats ? (
                                    <p className="text-2xl font-bold text-gray-900 mt-1 inline-flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                        --
                                    </p>
                                ) : (
                                    <p className="text-2xl font-bold text-gray-900 mt-1">
                                        {stat.value}
                                    </p>
                                )}
                                <p className="text-xs text-green-600 mt-1 font-medium">
                                    {stat.change}
                                </p>
                            </div>
                            <div
                                className={`${stat.color} p-2.5 rounded-lg`}
                            >
                                <stat.icon className="h-5 w-5 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Thao Tác Nhanh</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                        <button
                            key={action.label}
                            onClick={() => router.push(action.href)}
                            className={`group relative bg-gradient-to-br ${action.gradient} ${action.hoverGradient} rounded-xl p-5 text-white text-left transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <action.icon className="h-6 w-6 mb-3 opacity-90" />
                                    <p className="font-semibold text-base">{action.label}</p>
                                    <p className="text-xs text-white/70 mt-1">{action.description}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-0 group-hover:translate-x-1 mt-1" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Placeholder: Thêm biểu đồ và bảng sau */}
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                    Biểu đồ thống kê sẽ được thêm trong phiên bản tiếp theo
                </p>
            </div>
        </div>
    );
}
