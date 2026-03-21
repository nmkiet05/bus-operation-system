"use client";

import { useState, type ReactNode } from "react";
import { BarChart3, BookOpen, ChevronDown, ChevronRight, HelpCircle, Sigma } from "lucide-react";

type Topic = {
  id: string;
  title: string;
  icon: typeof BookOpen;
  content: ReactNode;
};

const SUPPORT_TOPICS: Topic[] = [
  {
    id: "report-formulas",
    title: "1. Công thức tính trên page Report",
    icon: Sigma,
    content: (
      <div className="space-y-4 text-slate-700">
        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
          <p className="font-semibold text-slate-900 mb-2">Doanh thu gộp</p>
          <p className="font-mono text-sm">Doanh thu gộp = Tổng giá vé đã ghi nhận</p>
          <p className="text-sm mt-2">Hiểu đơn giản: tổng tiền bán vé trước khi trừ các khoản hoàn tiền.</p>
        </div>

        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
          <p className="font-semibold text-slate-900 mb-2">Doanh thu thuần</p>
          <p className="font-mono text-sm">Doanh thu thuần = Doanh thu gộp - Tiền hoàn vé</p>
          <p className="text-sm mt-2">Đây là số tiền thực nhận sau khi đã xử lý refund.</p>
        </div>

        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
          <p className="font-semibold text-slate-900 mb-2">Vé đã bán</p>
          <p className="font-mono text-sm">Vé đã bán = Số vé hợp lệ theo bộ lọc</p>
          <p className="text-sm mt-2">Hệ thống hiển thị theo đơn vị vé, không dùng cụm “ghế đã bán”.</p>
        </div>

        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
          <p className="font-semibold text-slate-900 mb-2">Giá vé trung bình</p>
          <p className="font-mono text-sm">Giá vé trung bình = Doanh thu thuần / Vé đã bán</p>
        </div>

        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
          <p className="font-semibold text-slate-900 mb-2">Hệ số lấp đầy (%)</p>
          <p className="font-mono text-sm">Hệ số lấp đầy = (Vé đã bán / Tổng số ghế cung ứng) x 100%</p>
        </div>
      </div>
    ),
  },
  {
    id: "report-reading",
    title: "2. Cách đọc hiểu page Report",
    icon: BarChart3,
    content: (
      <div className="space-y-4 text-slate-700">
        <div>
          <p className="font-semibold text-slate-900">Bước 1: Chọn bộ lọc</p>
          <ul className="list-disc pl-5 text-sm mt-2 space-y-1">
            <li>Từ ngày, đến ngày.</li>
            <li>Loại xe (nếu cần).</li>
            <li>Chu kỳ tổng hợp: ngày/tuần/tháng.</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-slate-900">Bước 2: Đọc KPI tổng quan</p>
          <ul className="list-disc pl-5 text-sm mt-2 space-y-1">
            <li>Doanh thu thuần là KPI chính để đánh giá tiền thực nhận.</li>
            <li>So sánh doanh thu gộp và thuần để thấy mức ảnh hưởng hoàn vé.</li>
            <li>Giá vé trung bình tăng/giảm giúp nhìn xu hướng chất lượng doanh thu.</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-slate-900">Bước 3: Đọc biểu đồ theo thời gian</p>
          <ul className="list-disc pl-5 text-sm mt-2 space-y-1">
            <li>Nhìn xu hướng tăng/giảm liên tục theo kỳ.</li>
            <li>Nếu có ngày đột biến, đối chiếu lại booking/refund ở ngày đó.</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-slate-900">Bước 4: Đọc bảng chi tiết theo loại xe</p>
          <ul className="list-disc pl-5 text-sm mt-2 space-y-1">
            <li>Bảng cho biết đóng góp của từng loại xe vào doanh thu/lấp đầy.</li>
            <li>Nếu loại xe có doanh thu thấp nhưng tải cao, cần kiểm tra chiến lược giá.</li>
            <li>Nếu loại xe có doanh thu cao nhưng tải thấp, cần kiểm tra cơ cấu vé và chính sách hoàn.</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "faq",
    title: "3. Câu hỏi thường gặp",
    icon: BookOpen,
    content: (
      <div className="space-y-3 text-slate-700 text-sm">
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="font-semibold text-slate-900">Vì sao danh sách loại xe có thể khác số dòng chi tiết?</p>
          <p className="mt-1">Chi tiết báo cáo phụ thuộc bộ lọc thời gian và dữ liệu vận hành trong kỳ. Khi không có phát sinh phù hợp bộ lọc, một số loại xe có thể không xuất hiện hoặc có giá trị 0.</p>
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <p className="font-semibold text-slate-900">Khi nào cần ưu tiên xem doanh thu thuần?</p>
          <p className="mt-1">Luôn ưu tiên doanh thu thuần khi đánh giá kết quả kinh doanh, vì chỉ số này đã phản ánh hoàn tiền.</p>
        </div>
      </div>
    ),
  },
];

export default function SupportDocsPage() {
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({ "report-formulas": true });

  const toggleTopic = (id: string) => {
    setOpenTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-6 pb-20 max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-brand-blue to-sky-600 px-8 py-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Hỗ trợ đọc hiểu Báo cáo</h1>
              <p className="text-blue-100 mt-1">Công thức tính và cách diễn giải số liệu trên page Report</p>
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8">
          <div className="space-y-4">
            {SUPPORT_TOPICS.map((topic) => {
              const Icon = topic.icon;
              const isOpen = openTopics[topic.id];

              return (
                <div key={topic.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <button
                    onClick={() => toggleTopic(topic.id)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-slate-800 text-lg">{topic.title}</span>
                    </div>
                    <div className="text-slate-400">
                      {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </div>
                  </button>

                  {isOpen && <div className="p-5 border-t border-slate-100">{topic.content}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
