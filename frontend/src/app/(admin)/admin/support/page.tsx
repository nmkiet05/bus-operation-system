"use client";

import { useState } from "react";
import { 
    HelpCircle, 
    BookOpen, 
    Bus, 
    CalendarClock, 
    TicketPercent, 
    Map, 
    Users, 
    ShieldAlert, 
    ChevronDown, 
    ChevronRight 
} from "lucide-react";

const SUPPORT_TOPICS = [
    {
        id: "overview",
        title: "1. Tổng quan hệ thống (Bus Operation System)",
        icon: BookOpen,
        color: "text-blue-500",
        bgColor: "bg-blue-50",
        content: (
            <div className="space-y-4 text-slate-600">
                <p>
                    <strong className="text-slate-900">Bus Operation System (BOS)</strong> là hệ thống quản lý vận hành xe khách toàn diện, bao gồm các phân hệ (modules) chính:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Bán vé (Sales):</strong> Đặt vé, giữ chỗ, thanh toán, quản lý vé.</li>
                    <li><strong>Điều hành (Operation):</strong> Phân công tài xế, xe bus vào lịch chạy.</li>
                    <li><strong>Đội xe (Fleet):</strong> Quản lý danh sách xe, bảo trì, thông tin tài xế.</li>
                    <li><strong>Kế hoạch (Planning):</strong> Cấu hình bến xe, tuyến đường, điểm dừng, bảng giá, lịch trình mẫu.</li>
                    <li><strong>Nhân sự (Identity/HR):</strong> Quản lý nhân viên, phân quyền truy cập.</li>
                </ul>
                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 mt-4">
                    <p className="text-sm">
                        💡 <strong>Lưu ý:</strong> Hệ thống được thiết kế theo kiến trúc Microservices, mỗi phân hệ hoạt động độc lập và giao tiếp với nhau qua API/Message Broker nhằm đảm bảo tính mở rộng và chịu lỗi.
                    </p>
                </div>
            </div>
        )
    },
    {
        id: "sales",
        title: "2. Module Bán Vé (Sales)",
        icon: TicketPercent,
        color: "text-emerald-500",
        bgColor: "bg-emerald-50",
        content: (
            <div className="space-y-4 text-slate-600">
                <p>Nơi nhân viên phòng vé hoặc quản lý thực hiện thao tác bán vé cho khách hàng.</p>
                <div className="grid gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <strong className="text-slate-900 block mb-1">Luồng đặt vé (Public/Admin):</strong>
                        <ol className="list-decimal pl-5 space-y-1 text-sm">
                            <li>Chọn tuyến và ngày khởi hành, hệ thống hiển thị danh sách các chuyến có trong ngày.</li>
                            <li>Chọn sơ đồ ghế (có hỗ trợ ghế trống/đã đặt/đang giữ).</li>
                            <li>Nhập thông tin người đặt và thông tin hành khách cụ thể cho từng ghế.</li>
                            <li>Chọn điểm đón/trả và phương thức thanh toán.</li>
                            <li>Xác nhận tạo mã booking (Giữ chỗ hoặc Thanh toán xuất vé).</li>
                        </ol>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <strong className="text-slate-900 block mb-1">Tra cứu / Hủy vé:</strong>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Nhân viên có thể tìm kiếm đơn đặt vé theo Mã booking hoặc Số điện thoại.</li>
                            <li>Có thể hủy toàn bộ Booking hoặc hủy từng vé lẻ trong Booking. Tiền sẽ được tính lại tự động.</li>
                        </ul>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: "operation",
        title: "3. Module Điều hành (Operation)",
        icon: CalendarClock,
        color: "text-orange-500",
        bgColor: "bg-orange-50",
        content: (
            <div className="space-y-4 text-slate-600">
                <p>Module quan trọng nhất giúp điều phối xe và tài xế chạy hàng ngày.</p>
                <div className="space-y-3">
                    <div className="border border-slate-200 rounded-lg p-3">
                        <strong className="text-slate-900 line-clamp-1">3.1. Phân công ca xe (Trip Assignment)</strong>
                        <p className="text-sm mt-1">
                            Lịch trình (TripSchedule) sẽ được Planning cấu hình. Operation sẽ lấy lịch đó và chỉ định: Cụ thể ngày X, giờ Y chuyến xe này sẽ do <span className="font-semibold text-brand-blue">Tài xế nào</span> lái chiếc <span className="font-semibold text-brand-blue">Xe số bao nhiêu</span>.
                        </p>
                        <p className="text-sm mt-2 text-red-600 bg-red-50 p-2 rounded border border-red-100">
                            *Hệ thống có thuật toán kiểm tra xung đột để tài xế và xe không bị xếp trùng giờ hoạt động.
                        </p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-3">
                        <strong className="text-slate-900 line-clamp-1">3.2. Cập nhật trạng thái chuyến</strong>
                        <p className="text-sm mt-1">
                            Trạng thái một chuyến chạy qua các bước: SCHEDULED (Đã lên lịch) → BOARDING (Đang đón khách) → IN_TRANSIT (Đang đi) → ARRIVED (Đã đến) → COMPLETED (Hoàn thành) hoặc CANCELLED.
                        </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: "planning",
        title: "4. Module Kế hoạch (Planning)",
        icon: Map,
        color: "text-purple-500",
        bgColor: "bg-purple-50",
        content: (
            <div className="space-y-4 text-slate-600">
                <p>Nơi cấu hình các dữ liệu danh mục tĩnh cốt lõi cho hệ thống vé và điều hành.</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>
                        <strong className="text-slate-900">Bến xe (Stations):</strong> Quản lý danh sách các bến xe lớn ở các tỉnh (Ví dụ: BX Miền Tây, BX Miền Đông).
                    </li>
                    <li>
                        <strong className="text-slate-900">Tuyến đường (Routes):</strong> Định nghĩa lộ trình đi từ Bến A đến Bến B. Gắn với khoảng cách (km) và thời gian di chuyển dự kiến.
                    </li>
                    <li>
                        <strong className="text-slate-900">Điểm đón trả (Pickup Points):</strong> Dọc lộ trình tuyến có thể thiết lập nhiều trạm dừng để khách lên xuống.
                    </li>
                    <li>
                        <strong className="text-slate-900">Lịch trình (Trip Schedules):</strong> Quy định khung giờ xuất bến cố định hằng ngày của một Tuyến. (Ví dụ: Tuyến SG-CT có chuyến 7:00, 9:00, 11:00 hằng ngày).
                    </li>
                    <li>
                        <strong className="text-slate-900">Bảng giá (Fare Config):</strong> Cấu hình giá vé linh hoạt theo thời gian (Ngày lễ, ngày thường) và theo tuyến đường.
                    </li>
                </ul>
            </div>
        )
    },
    {
        id: "fleet",
        title: "5. Module Đội xe (Fleet)",
        icon: Bus,
        color: "text-amber-500",
        bgColor: "bg-amber-50",
        content: (
            <div className="space-y-4 text-slate-600">
                <p>Quản lý tài sản (Xe) và Tài xế, nhân viên theo xe.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-200 p-3 rounded-lg">
                        <strong className="flex items-center gap-2 text-slate-900 mb-2">
                            <Bus className="h-4 w-4" /> Quản lý xe (Bus)
                        </strong>
                        <ul className="text-sm list-disc pl-4 space-y-1">
                            <li>Thêm mới xe theo từng biển số.</li>
                            <li>Gắn xe với loại xe (BusType: Giường nằm 36 chỗ, Limousine 11 chỗ) để hệ thống biết sơ đồ ghế.</li>
                            <li>Quản lý mốc hạn kiểm định, hạn bảo hiểm. Giám sát trạng thái xe (Sẵn sàng / Đang bảo trì).</li>
                        </ul>
                    </div>
                    <div className="border border-slate-200 p-3 rounded-lg">
                        <strong className="flex items-center gap-2 text-slate-900 mb-2">
                            <Users className="h-4 w-4" /> Quản lý Tài xế (Driver)
                        </strong>
                        <ul className="text-sm list-disc pl-4 space-y-1">
                            <li>Profile tài xế, mã bằng lái.</li>
                            <li>Hạn giấy phép lái xe.</li>
                            <li>Theo dõi trạng thái: Có sẵn sàng nhận ca tuyến hay không.</li>
                        </ul>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: "security",
        title: "6. Bảo mật & Phân quyền (Security & Roles)",
        icon: ShieldAlert,
        color: "text-red-500",
        bgColor: "bg-red-50",
        content: (
            <div className="space-y-4 text-slate-600">
                <p>Hệ thống sử dụng Security Context tập trung để bảo vệ API.</p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-2">Các vai trò trong hệ thống:</h4>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                            <span className="font-mono bg-red-100 text-red-700 px-1 py-0.5 rounded text-xs mt-0.5">ADMIN</span>
                            <span>Có toàn quyền hệ thống. Truy cập vào Cấu hình, Quản trị người dùng phân quyền.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="font-mono bg-orange-100 text-orange-700 px-1 py-0.5 rounded text-xs mt-0.5">MANAGER</span>
                            <span>Quản lý cấp trung. Có quyền thiết lập danh mục, xem toàn bộ báo cáo, phân ca xe (Operation).</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="font-mono bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-xs mt-0.5">STAFF</span>
                            <span>Nhân viên quầy bán vé. Chỉ được phép thao tác ở luồng Sales (Tạo vé, hủy vé) và xem danh sách chuyến liên quan. Không thể sửa thiết lập danh mục công ty.</span>
                        </li>
                    </ul>
                </div>
            </div>
        )
    }
];

export default function SupportDocsPage() {
    const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({
        overview: true // Mặc định mở phần tổng quan
    });

    const toggleTopic = (id: string) => {
        setOpenTopics(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="p-6 pb-20 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-brand-blue to-sky-600 px-8 py-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <HelpCircle className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Tài liệu Hỗ trợ & Vận hành</h1>
                            <p className="text-blue-100 mt-1">Hướng dẫn sử dụng cấu trúc và chức năng hệ thống Bus Operation System</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 lg:p-8">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800">Cẩm nang hướng dẫn hệ thống</h2>
                        <button 
                            onClick={() => setOpenTopics(SUPPORT_TOPICS.reduce((acc, t) => ({...acc, [t.id]: true}), {}))}
                            className="text-sm text-brand-blue hover:underline font-medium"
                        >
                            Mở rộng tất cả
                        </button>
                    </div>

                    <div className="space-y-4">
                        {SUPPORT_TOPICS.map((topic) => {
                            const Icon = topic.icon;
                            const isOpen = openTopics[topic.id];

                            return (
                                <div key={topic.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow transition-shadow">
                                    <button 
                                        onClick={() => toggleTopic(topic.id)}
                                        className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${topic.bgColor} ${topic.color}`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <span className="font-bold text-slate-800 text-lg">{topic.title}</span>
                                        </div>
                                        <div className="text-slate-400">
                                            {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                        </div>
                                    </button>
                                    
                                    {isOpen && (
                                        <div className="p-5 border-t border-slate-100">
                                            {topic.content}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {/* Footer hints for the user report */}
                <div className="bg-slate-50 border-t border-slate-200 p-6 px-8 flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0">
                        <BookOpen className="h-6 w-6 text-slate-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 mb-1">Mẹo viết báo cáo (Thesis Report Hint)</h3>
                        <p className="text-slate-600 text-sm">
                            Trang tài liệu này đã liệt kê đầy đủ quy trình và các <code className="bg-slate-200 px-1 py-0.5 rounded text-red-500">module</code> chính mà hệ thống đang chạy. Khi viết sơ đồ Usecase hay phân tích nghiệp vụ, hãy tham khảo các đầu mục bên trên (Điều hành, Bán vé, Hệ thống) để bám sát nhất với luồng chức năng thực tế của Code.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
