import { Ticket, Copy } from "lucide-react";

const PROMOS = [
    {
        id: 1,
        title: "Tiết kiệm tới 25% khi đặt vé xe lần đầu",
        desc: "Hạn sử dụng đến 31/03/2026",
        code: "DAUTIEN",
        bg: "bg-orange-50 border-orange-200",
        iconColor: "text-orange-500",
        tag: "Khách hàng mới"
    },
    {
        id: 2,
        title: "Tiết kiệm 20% cho lần đặt vé tiếp theo",
        desc: "Hạn sử dụng đến 31/12/2026",
        code: "GIAMGIA",
        bg: "bg-blue-50 border-blue-200",
        iconColor: "text-blue-500",
        tag: "Ưu đãi HOT"
    }
];

export function PromotionalCards() {
    return (
        <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-8">Ưu đãi dành cho bạn</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {PROMOS.map(promo => (
                        <div key={promo.id} className={`p-6 rounded-xl border-2 border-dashed ${promo.bg} flex items-center gap-4 transition-transform hover:scale-[1.01] cursor-pointer group`}>
                            {/* Icon Box */}
                            <div className={`w-16 h-16 rounded-lg bg-white flex items-center justify-center shadow-sm ${promo.iconColor}`}>
                                <Ticket className="w-8 h-8" />
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-white rounded border border-gray-200 mb-2 text-gray-500">
                                    {promo.tag}
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-1 leading-tight group-hover:text-brand-blue transition-colors">
                                    {promo.title}
                                </h3>
                                <p className="text-sm text-gray-500 mb-3">{promo.desc}</p>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded px-2 py-1 bg-white/50">
                                        <span className="font-mono font-bold text-gray-700">{promo.code}</span>
                                        <Copy className="w-3 h-3 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
