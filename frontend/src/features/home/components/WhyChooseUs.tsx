import { Shield, Clock, Headphones, Wallet } from "lucide-react";

/**
 * WhyChooseUs - Component hiển thị lý do chọn dịch vụ
 * Thiết kế theo phong cách BOS với icon và mô tả
 */

interface Benefit {
    icon: React.ReactNode;
    title: string;
    description: string;
}

const BENEFITS: Benefit[] = [
    {
        icon: <Wallet className="h-10 w-10 text-brand-blue" />,
        title: "Giá vé tốt nhất",
        description: "Cam kết giá vé rẻ nhất thị trường với nhiều ưu đãi hấp dẫn",
    },
    {
        icon: <Shield className="h-10 w-10 text-brand-blue" />,
        title: "An toàn & Tin cậy",
        description: "Đối tác với hơn 400 nhà xe uy tín, đảm bảo chất lượng dịch vụ",
    },
    {
        icon: <Clock className="h-10 w-10 text-brand-blue" />,
        title: "Đặt vé nhanh chóng",
        description: "Chỉ 3 bước đơn giản, đặt vé trong vòng 2 phút",
    },
    {
        icon: <Headphones className="h-10 w-10 text-brand-blue" />,
        title: "Hỗ trợ 24/7",
        description: "Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ mọi lúc",
    },
];

export function WhyChooseUs() {
    return (
        <section className="bg-gray-50 py-16">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-12 text-center">
                    <h2 className="mb-3 text-3xl font-bold text-gray-800">
                        Tại sao chọn chúng tôi?
                    </h2>
                    <p className="text-lg text-gray-600">
                        Trải nghiệm đặt vé xe khách hiện đại và tiện lợi nhất
                    </p>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {BENEFITS.map((benefit, index) => (
                        <BenefitCard key={index} benefit={benefit} />
                    ))}
                </div>
            </div>
        </section>
    );
}

/**
 * BenefitCard - Card hiển thị một lợi ích
 */
interface BenefitCardProps {
    benefit: Benefit;
}

function BenefitCard({ benefit }: BenefitCardProps) {
    return (
        <div className="group rounded-xl bg-white p-6 text-center shadow-sm transition-all hover:shadow-lg">
            {/* Icon */}
            <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-sky-50 p-4 transition-transform group-hover:scale-110">
                    {benefit.icon}
                </div>
            </div>

            {/* Title */}
            <h3 className="mb-2 text-xl font-bold text-gray-800">
                {benefit.title}
            </h3>

            {/* Description */}
            <p className="text-gray-600">
                {benefit.description}
            </p>
        </div>
    );
}
