import { SidebarMenuGroup } from "../types";

/**
 * Cấu hình menu Sidebar cho Admin Panel.
 * Phân quyền dựa trên `allowedRoles` - chỉ hiển thị menu mà role đó được phép.
 *
 * ROLE_ADMIN / ROLE_MANAGER: Full access
 * ROLE_STAFF: Chỉ xem Dashboard + Đơn đặt vé
 */
export const ADMIN_SIDEBAR_MENU: SidebarMenuGroup[] = [
    {
        label: "Tổng quan",
        items: [
            {
                title: "Dashboard",
                href: "/admin",
                icon: "LayoutDashboard",
                allowedRoles: ["ROLE_ADMIN", "ROLE_MANAGER", "ROLE_STAFF"],
            },
        ],
    },
    {
        label: "Vận hành",
        items: [
            {
                title: "Quản lý chuyến",
                href: "/admin/operation/trips",
                icon: "Bus",
                allowedRoles: ["ROLE_ADMIN", "ROLE_MANAGER"],
            },
            {
                title: "Ca Xe",
                href: "/admin/operation/bus-schedule",
                icon: "CalendarClock",
                allowedRoles: ["ROLE_ADMIN", "ROLE_MANAGER"],
            },
            {
                title: "Đội Ngũ",
                href: "/admin/operation/crew",
                icon: "Users",
                allowedRoles: ["ROLE_ADMIN", "ROLE_MANAGER"],
            },
        ],
    },
    {
        label: "Vé & Thanh toán",
        items: [
            {
                title: "Bán vé",
                href: "/",
                icon: "Ticket",
                allowedRoles: ["ROLE_ADMIN", "ROLE_MANAGER", "ROLE_STAFF"],
            },
            {
                title: "Đơn đặt vé",
                href: "/admin/sales/bookings",
                icon: "ShoppingCart",
                allowedRoles: ["ROLE_ADMIN", "ROLE_MANAGER", "ROLE_STAFF"],
            },
            {
                title: "Giá vé",
                href: "/admin/sales/fare-config",
                icon: "DollarSign",
                allowedRoles: ["ROLE_ADMIN", "ROLE_MANAGER"],
            },
        ],
    },
    {
        label: "Kế hoạch",
        items: [
            {
                title: "Tuyến đường",
                href: "/admin/planning/routes",
                icon: "Route",
                allowedRoles: ["ROLE_ADMIN", "ROLE_MANAGER"],
            },
            {
                title: "Lịch chạy",
                href: "/admin/planning/schedules",
                icon: "CalendarClock",
                allowedRoles: ["ROLE_ADMIN", "ROLE_MANAGER"],
            },
        ],
    },
    {
        label: "Đội xe",
        items: [
            {
                title: "Phương tiện",
                href: "/admin/fleet/buses",
                icon: "Truck",
                allowedRoles: ["ROLE_ADMIN", "ROLE_MANAGER"],
            },
            {
                title: "Loại xe",
                href: "/admin/fleet/bus-types",
                icon: "Armchair",
                allowedRoles: ["ROLE_ADMIN", "ROLE_MANAGER"],
            },
        ],
    },
    {
        label: "Danh mục",
        items: [
            {
                title: "Bến xe",
                href: "/admin/catalog/stations",
                icon: "MapPin",
                allowedRoles: ["ROLE_ADMIN", "ROLE_MANAGER"],
            },
            {
                title: "Bãi xe",
                href: "/admin/catalog/depots",
                icon: "Warehouse",
                allowedRoles: ["ROLE_ADMIN", "ROLE_MANAGER"],
            },
        ],
    },
    {
        label: "Khác",
        items: [
            {
                title: "Báo cáo",
                href: "/admin/reports",
                icon: "BarChart3",
                allowedRoles: ["ROLE_ADMIN", "ROLE_MANAGER"],
            },
            {
                title: "Hỗ trợ (Support)",
                href: "/admin/support",
                icon: "HelpCircle",
                allowedRoles: ["ROLE_ADMIN", "ROLE_MANAGER", "ROLE_STAFF"],
            },
        ],
    },
];
