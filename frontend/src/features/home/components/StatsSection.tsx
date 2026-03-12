import { Users, Bus, Ticket } from "lucide-react";

const STATS = [
    {
        id: 1,
        label: "Khách hàng hài lòng",
        value: "36 triệu",
        sub: "trên toàn cầu",
        icon: Users,
    },
    {
        id: 2,
        label: "Nhà xe đối tác",
        value: "Hơn 5,000",
        sub: "tin tưởng hợp tác",
        icon: Bus,
    },
    {
        id: 3,
        label: "Lượt đặt chỗ",
        value: "100K",
        sub: "mỗi ngày",
        icon: Ticket,
    }
];

export function StatsSection() {
    return (
        <section className="py-16 border-t border-gray-100 bg-white">
            <div className="container mx-auto px-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-10 text-center md:text-left">
                    Điểm nổi bật của BOS
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    {STATS.map(stat => (
                        <div key={stat.id} className="flex flex-col items-center text-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
                            <div className="mb-4 p-4 bg-sky-50 rounded-full text-brand-blue">
                                <stat.icon className="w-8 h-8" />
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                            <div className="text-lg font-medium text-gray-700 mb-1">{stat.label}</div>
                            <p className="text-sm text-gray-400">{stat.sub}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
