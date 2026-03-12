import { Suspense } from "react";
import { SearchWidget } from "./search-widget";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Image from "next/image";
import { Flower as FlowerIcon } from "lucide-react";

interface HeroBannerProps {
    title?: string;
    subtitle?: string;
}

export function HeroBanner({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    title: _title = "VÉ XE TẾT GIẢM ĐẾN 40%",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    subtitle: _subtitle = "SỐ LƯỢNG CÓ HẠN - Nhập mã: RBSUMVAY",
}: HeroBannerProps) {
    return (
        <div className="relative w-full">
            {/* Hero Background - Theme Blue (Brand) + Hoa Mai Decoration (Visible on Mobile) */}
            <div className="block relative pt-28 pb-32 w-full overflow-hidden bg-[#0EA5E9] bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] md:min-h-[400px] md:pt-16 md:pb-32">

                {/* Decorative Elements (Apricot blossoms - Hoa Mai) */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Abstract Light Effects */}
                    <div className="absolute right-10 top-10 h-32 w-32 rounded-full bg-yellow-300 blur-[80px] opacity-60" />
                    <div className="absolute left-10 bottom-10 h-24 w-24 rounded-full bg-yellow-300 blur-[60px] opacity-40" />

                    {/* Right Side Flowers */}
                    <div className="absolute -right-4 -top-4 opacity-90">
                        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse-slow">
                            <path d="M150 50 C160 40 180 40 190 50 C200 60 200 80 190 90 C180 100 160 100 150 90 C140 80 140 60 150 50" fill="#FFD700" opacity="0.8" />
                            <path d="M120 20 C130 10 150 10 160 20 C170 30 170 50 160 60 C150 70 130 70 120 60 C110 50 110 30 120 20" fill="#FFD700" opacity="0.9" />
                            <path d="M160 80 C170 70 190 70 200 80 C210 90 210 110 200 120 C190 130 170 130 160 120 C150 110 150 90 160 80" fill="#FFD700" opacity="0.7" />
                        </svg>
                        {/* Simplified Flower Shapes using CSS/SVG for "Hoa Mai" */}
                        <div className="absolute top-10 right-10 text-yellow-300 transform rotate-12">
                            <FlowerIcon size={64} className="fill-yellow-400 text-yellow-600 drop-shadow-md" />
                        </div>
                        <div className="absolute top-24 right-4 text-yellow-300 transform -rotate-12">
                            <FlowerIcon size={48} className="fill-yellow-400 text-yellow-600 drop-shadow-md" />
                        </div>
                        <div className="absolute top-4 right-32 text-yellow-300 transform rotate-45">
                            <FlowerIcon size={40} className="fill-yellow-400 text-yellow-600 drop-shadow-md" />
                        </div>
                    </div>

                    {/* Left Side Flowers (Adjusted for Mobile Widget) */}
                    <div className="absolute left-0 top-20 opacity-80 md:bottom-0">
                        <div className="absolute top-0 left-6 text-yellow-300 transform rotate-12">
                            <FlowerIcon size={56} className="fill-yellow-400 text-yellow-600 drop-shadow-md" />
                        </div>
                        <div className="absolute top-16 left-2 text-yellow-300 transform -rotate-12">
                            <FlowerIcon size={32} className="fill-yellow-400 text-yellow-600 drop-shadow-md" />
                        </div>
                    </div>
                </div>

                {/* Content - Hidden on Mobile */}
                <div className="relative z-10 hidden h-full flex-col items-center justify-center px-4 pb-32 pt-16 text-center md:flex md:pb-20 md:pt-12">
                    {/* Promo Tag */}
                    <div className="mb-6 animate-fade-in-up">
                        <span className="inline-block rounded bg-yellow-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-blue shadow-sm">
                            🧧 Khuyến mãi Tết 2026
                        </span>
                    </div>

                    {/* Main Title */}
                    <div className="animate-fade-in-up delay-100">
                        <h1 className="mb-2 text-3xl font-extrabold uppercase leading-tight text-white drop-shadow-lg md:text-5xl lg:text-7xl">
                            <span className="text-yellow-300">VÉ XE TẾT</span> GIẢM ĐẾN <span className="text-yellow-300">40%</span>
                        </h1>
                        <h2 className="text-xl font-bold uppercase text-white/90 drop-shadow-md md:text-3xl">
                            SỐ LƯỢNG CÓ HẠN
                        </h2>
                    </div>

                    {/* Code Badge */}
                    <div className="mt-8 flex animate-fade-in-up flex-col items-center gap-2 delay-200 sm:flex-row">
                        <div className="flex items-center gap-0 overflow-hidden rounded-lg bg-black/20 backdrop-blur-md border border-white/10">
                            <div className="bg-[#0284c7] px-4 py-3 text-sm font-medium text-white/90">
                                Nhập mã
                            </div>
                            <div className="bg-yellow-400 px-6 py-3 text-lg font-bold text-[#b45309]">
                                RBSUMVAY
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Vector Art - Strong Convex Curve - Desktop Only */}
                <div className="absolute -bottom-1 left-0 right-0 z-0 hidden md:block">
                    <svg
                        viewBox="0 0 1440 200"
                        className="w-full"
                        preserveAspectRatio="none"
                        style={{ height: '80px' }}
                    >
                        <path
                            d="M0,0 Q720,180 1440,0 L1440,200 L0,200 Z"
                            fill="#ffffff"
                        />
                    </svg>
                </div>

                {/* Search Widget - Inside Banner like Search Page */}
                <div className="container mx-auto px-4 scale-90 origin-top relative z-10 md:-mt-10">
                    <Suspense fallback={<div className="h-40 w-full animate-pulse rounded-xl bg-white/50 backdrop-blur-sm" />}>
                        <SearchWidget />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
