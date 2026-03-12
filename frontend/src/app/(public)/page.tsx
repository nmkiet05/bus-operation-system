import {
    HeroBanner,
    PromotionalCards,
    TrendingRoutes,
    WhyChooseUs,
    StatsSection,
    DownloadApp,
} from "@/features/home/components";
import ScrollAnimation from "@/components/animations/ScrollAnimation";

/**
 * Trang chủ (Home Page) - BOS Clone
 * URL: /
 * Layout: Main Layout (Public)
 * 
 * Design Philosophy:
 * - Mobile First: Stack vertical layout default
 * - Spacing: Generous spacing (py-12, py-16) for modern look
 * - Sections: Alternating backgrounds (White vs Gray-50) for separation
 */
export default function HomePage() {
    return (
        <main className="flex min-h-screen flex-col bg-white overflow-x-hidden">
            {/* 1. Hero Section (Gradient + SearchWidget) */}
            {/* HeroBanner tự handle height và spacing cho search widget */}
            <HeroBanner
                title="Đặt vé xe khách trực tuyến"
                subtitle="Hệ thống Vận hành & Đặt vé số 1 tại Cần Thơ"
            />

            {/* Container chính cho các nội dung dưới Hero */}
            {/* Standardized spacing to match trips page */}
            <div className="flex flex-col gap-16 pb-20 pt-32 md:gap-24 md:pt-36 lg:gap-32">

                {/* 2. Download App - CTA */}
                <DownloadApp />

                {/* 3. Promotional Cards - Ưu đãi */}
                <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <ScrollAnimation delay={0.1}>
                        <PromotionalCards />
                    </ScrollAnimation>
                </section>

                {/* 4. Trending Routes - Tuyến phổ biến */}
                {/* Background xám nhẹ để nổi bật cards */}
                <section className="bg-gray-50 py-12 md:py-16">
                    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <ScrollAnimation delay={0.2}>
                            <TrendingRoutes />
                        </ScrollAnimation>
                    </div>
                </section>

                {/* 5. Stats Section - Thống kê */}
                <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <ScrollAnimation delay={0.1}>
                        <StatsSection />
                    </ScrollAnimation>
                </section>

                {/* 6. Why Choose Us - Lợi ích */}
                <section className="bg-gray-50 py-12 md:py-16">
                    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <ScrollAnimation delay={0.2}>
                            <WhyChooseUs />
                        </ScrollAnimation>
                    </div>
                </section>


            </div>
        </main>
    );
}
