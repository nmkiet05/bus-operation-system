"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { paymentService } from "@/services/api/payment";
import { bookingService } from "@/features/booking/services/booking-service";

type Screen = "loading" | "ready" | "processing" | "success" | "cancelled";

function ConfirmPageContent() {
    const params = useSearchParams();
    const router = useRouter();
    const code = params.get("code") ?? "";

    const [screen, setScreen] = useState<Screen>("loading");
    const [amount, setAmount] = useState(0);
    const [txId, setTxId] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!code) { setScreen("ready"); return; }
        bookingService.getBookingByCode(code)
            .then(res => { setAmount(Number(res.totalAmount ?? 0)); setScreen("ready"); })
            .catch(() => setScreen("ready"));
    }, [code]);

    const handleConfirm = async () => {
        setScreen("processing");
        try {
            const res = await paymentService.processPayment({ bookingCode: code, method: "BANK_TRANSFER" });
            setTxId(res.transactionId ?? "");
            setScreen("success");
            // Xóa cache để success page luôn gọi API mới → hiện đúng trạng thái CONFIRMED
            try { sessionStorage.removeItem(`booking_cache_${code}`); } catch { /* ignore */ }
            setTimeout(() => router.push(`/booking/success?code=${code}`), 2000);
        } catch (err) {
            const e = err as { response?: { status?: number; data?: { message?: string } } };
            const status = e?.response?.status;
            const msg = e?.response?.data?.message;
            if (status === 404) {
                setErrorMsg("Không tìm thấy đơn đặt vé. Vui lòng kiểm tra lại mã.");
            } else if (status === 400) {
                setErrorMsg(msg ?? "Đơn đặt vé đã được thanh toán hoặc đã hủy.");
            } else {
                setErrorMsg(msg ?? "Thanh toán thất bại. Vui lòng thử lại.");
            }
            setScreen("cancelled");
        }
    };

    const amtStr = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs overflow-hidden border border-gray-100">

                {/* Header — khớp brand */}
                <div className="bg-gradient-to-r from-brand-dark to-brand-blue px-5 py-4 text-center">
                    <p className="text-[10px] text-white/60 uppercase tracking-widest mb-1">BOS Bank — Giả lập</p>
                    <p className="text-white font-bold text-xl">{amtStr}</p>
                    <p className="text-white/70 text-xs mt-0.5 font-mono">{code}</p>
                </div>

                <div className="p-5">
                    {screen === "loading" && (
                        <div className="flex flex-col items-center gap-3 py-6">
                            <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
                            <p className="text-sm text-gray-400">Đang tải...</p>
                        </div>
                    )}

                    {screen === "ready" && (
                        <>
                            <p className="text-sm text-center text-gray-500 mb-5">
                                Xác nhận chuyển khoản đến<br />
                                <span className="font-bold text-gray-800">BOS – Bus Operation System</span>
                            </p>
                            <div className="space-y-2.5">
                                <button
                                    onClick={handleConfirm}
                                    className="w-full bg-brand-blue hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-sm shadow-md shadow-brand-blue/20"
                                >
                                    ✓ Xác nhận thanh toán
                                </button>
                                <button
                                    onClick={() => setScreen("cancelled")}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-xl transition-all text-sm"
                                >
                                    ✕ Hủy giao dịch
                                </button>
                            </div>
                        </>
                    )}

                    {screen === "processing" && (
                        <div className="flex flex-col items-center gap-3 py-8">
                            <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
                            <p className="text-sm text-gray-500">Đang xử lý...</p>
                        </div>
                    )}

                    {screen === "success" && (
                        <div className="text-center py-4">
                            <CheckCircle className="h-14 w-14 text-emerald-500 mx-auto mb-2" />
                            <p className="font-bold text-emerald-700 text-lg">Giao dịch thành công</p>
                            {txId && <p className="text-xs text-gray-400 mt-1 font-mono">{txId}</p>}
                            <p className="text-xs text-gray-400 mt-3">Đang chuyển hướng...</p>
                        </div>
                    )}

                    {screen === "cancelled" && (
                        <div className="text-center py-4">
                            <XCircle className="h-14 w-14 text-red-400 mx-auto mb-2" />
                            <p className="font-bold text-red-600 text-lg">Thất bại</p>
                            <p className="text-xs text-gray-500 mt-1 px-2">{errorMsg || "Giao dịch bị hủy."}</p>
                            <div className="mt-4 space-y-2">
                                <button
                                    onClick={() => setScreen("ready")}
                                    className="w-full bg-brand-blue hover:opacity-90 text-white font-bold py-2.5 rounded-xl transition-all text-sm"
                                >
                                    ↺ Thử lại
                                </button>
                                {code && (
                                    <button
                                        onClick={() => router.push(`/booking/success?code=${code}`)}
                                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl transition-all text-sm"
                                    >
                                        Xem đặt vé
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PaymentConfirmPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
            </div>
        }>
            <ConfirmPageContent />
        </Suspense>
    );
}
