import { Bus, MapPin, Clock, TrendingUp } from "lucide-react";

/**
 * TrendingRoutes - Component hiển thị các tuyến xe phổ biến
 * Thiết kế theo phong cách BOS với card đẹp mắt
 */

interface Route {
    id: number;
    from: string;
    to: string;
    price: number;
    duration: string;
    popularity: number;
}

// Mock data - sẽ thay bằng API sau
const TRENDING_ROUTES: Route[] = [
    { id: 1, from: "Cần Thơ", to: "Sài Gòn", price: 120000, duration: "3h 30m", popularity: 95 },
    { id: 2, from: "Cần Thơ", to: "Hà Nội", price: 850000, duration: "24h", popularity: 88 },
    { id: 3, from: "Cần Thơ", to: "Đà Lạt", price: 280000, duration: "7h", popularity: 92 },
    { id: 4, from: "Sài Gòn", to: "Nha Trang", price: 180000, duration: "6h", popularity: 90 },
    { id: 5, from: "Sài Gòn", to: "Đà Nẵng", price: 320000, duration: "12h", popularity: 85 },
    { id: 6, from: "Hà Nội", to: "Hạ Long", price: 150000, duration: "3h", popularity: 87 },
];

export function TrendingRoutes() {
    return (
        <section className="container mx-auto px-4 py-12">
            {/* Header */}
            <div className="mb-8 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-brand-blue" />
                <h2 className="text-3xl font-bold text-gray-800">Các tuyến phổ biến</h2>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {TRENDING_ROUTES.map((route, index) => (
                    <RouteCard
                        key={route.id}
                        route={route}
                        className={index >= 3 ? "hidden md:block" : ""}
                    />
                ))}
            </div>
        </section>
    );
}

/**
 * RouteCard - Card hiển thị thông tin một tuyến xe
 */
interface RouteCardProps {
    route: Route;
    className?: string;
}

function RouteCard({ route, className = "" }: RouteCardProps) {
    return (
        <div className={`group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-xl ${className}`}>
            {/* Header với gradient */}
            <div className="bg-gradient-to-r from-brand-blue to-sky-600 p-4 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        <span className="font-semibold">{route.from}</span>
                    </div>
                    <Bus className="h-5 w-5" />
                    <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        <span className="font-semibold">{route.to}</span>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-4">
                {/* Giá và thời gian */}
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Giá từ</p>
                        <p className="text-2xl font-bold text-brand-blue">
                            {route.price.toLocaleString('vi-VN')}đ
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Thời gian</p>
                        <div className="flex items-center gap-1 text-gray-700">
                            <Clock className="h-4 w-4" />
                            <span className="font-semibold">{route.duration}</span>
                        </div>
                    </div>
                </div>

                {/* Popularity Bar */}
                <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                        <span>Độ phổ biến</span>
                        <span>{route.popularity}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                            className="h-full bg-gradient-to-r from-red-400 to-red-500"
                            style={{ width: `${route.popularity}%` }}
                        />
                    </div>
                </div>

                {/* CTA Button */}
                <button className="w-full rounded-lg bg-brand-blue py-2 font-semibold text-white transition-colors hover:bg-sky-700">
                    Xem chuyến xe
                </button>
            </div>
        </div>
    );
}
