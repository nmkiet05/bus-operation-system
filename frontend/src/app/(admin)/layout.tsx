"use client";

import { AdminSidebar, AdminHeader } from "@/features/admin";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Layout chính cho Admin Panel.
 * - Bọc toàn bộ các trang /admin/*
 * - Kiểm tra quyền truy cập (chỉ ADMIN/MANAGER/STAFF)
 * - Chia layout thành Sidebar (trái) + Main Content (phải)
 */
export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    // Guard: Chỉ cho phép các role admin truy cập
    useEffect(() => {
        if (!isLoading && user) {
            const allowedRoles = ["ROLE_ADMIN", "ROLE_MANAGER", "ROLE_STAFF"];
            console.log("[AdminLayout] User:", user);
            console.log("[AdminLayout] User Roles:", user.roles);
            const hasPermission = user.roles?.some((role) => allowedRoles.includes(role));
            console.log("[AdminLayout] Has Permission:", hasPermission);

            if (!hasPermission) {
                console.log("[AdminLayout] No permission, redirecting to /");
                router.replace("/");
            }
        }
        if (!isLoading && !user) {
            router.replace("/login?returnUrl=/admin");
        }
    }, [user, isLoading, router]);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Đang tải...</p>
                </div>
            </div>
        );
    }

    // Chưa đăng nhập hoặc không đủ quyền
    if (!user) return null;

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Sidebar - fixed bên trái */}
            <AdminSidebar />

            {/* Main Area - chiếm phần còn lại */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header - sticky trên cùng */}
                <AdminHeader />

                {/* Page Content - scrollable */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
