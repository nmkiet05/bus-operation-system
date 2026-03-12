import { Construction } from "lucide-react";

export default function BusTicketsPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="bg-blue-50 p-6 rounded-full mb-6">
                <Construction className="w-12 h-12 text-brand-blue" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Đặt vé xe khách</h1>
            <p className="text-gray-500 max-w-md">
                Tính năng đang được phát triển. Vui lòng quay lại sau!
            </p>
        </div>
    );
}
