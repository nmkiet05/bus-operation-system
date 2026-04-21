"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Clock, Loader2, XCircle, Smartphone } from "lucide-react";
import { bookingService } from "@/features/booking/services/booking-service";
import { BookingStatus } from "@/features/booking/types";

const TOTAL_SECONDS = 300;

function QrPageContent() {
    const params = useSearchParams();
    const router = useRouter();
    const code = params.get("code") ?? "";
    const amount = Number(params.get("amount") ?? 0);

    const [status, setStatus] = useState<"waiting" | "confirmed" | "failed">("waiting");
    const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    let confirmUrl = "";
    if (typeof window !== "undefined") {
        let host = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : "";
        const protocol = window.location.protocol;

        // Khắc phục: Nếu dev mở web bằng localhost, nhưng API đang cấu hình IP LAN (192.168.x.x)
        // thì đổi host thành IP LAN để điện thoại quét mã QR có thể truy cập được.
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        if (host === "localhost" || host === "127.0.0.1") {
            try {
                if (apiUrl.startsWith("http")) {
                    host = new URL(apiUrl).hostname;
                }
            } catch { /* ignore */ }
        }
        confirmUrl = `${protocol}//${host}${port}/payment/confirm?code=${code}`;
    } else {
        confirmUrl = `/payment/confirm?code=${code}`;
    }

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(confirmUrl)}&size=220x220&margin=12`;

    // Polling mỗi 3 giây
    useEffect(() => {
        if (!code) return;
        let isMounted = true; // 1. Khai báo cờ hiệu
        let delay = 3000;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const poll = async () => {
            if (document.hidden) {
                if (isMounted) {
                    timeoutId = setTimeout(poll, 10000);
                }
                return;
            }
            try {
                const res = await bookingService.getBookingByCode(code);

                if (!isMounted) return; // 2. Nếu component đã unmount trong lúc chờ API thì HỦY luôn

                if (res.status === BookingStatus.CONFIRMED) {
                    setStatus("confirmed");
                    if (timeoutId) clearTimeout(timeoutId);
                    try { sessionStorage.removeItem(`booking_cache_${code}`); } catch { }
                    setTimeout(() => {
                        if (isMounted) router.push(`/booking/success?code=${code}`);
                    }, 1500);
                    return;
                }

                if (res.status === BookingStatus.CANCELLED || res.status === BookingStatus.EXPIRED) {
                    setStatus("failed");
                    if (timeoutId) clearTimeout(timeoutId);
                    return;
                }

                delay = Math.min(delay + 2000, 10000);
                if (isMounted) timeoutId = setTimeout(poll, delay);
            } catch {
                if (isMounted) timeoutId = setTimeout(poll, delay);
            }
        };

        poll();
        // Khi user quay lại tab → poll ngay
        const handleVisibility = () => {
            if (!document.hidden && isMounted) {
                if (timeoutId) clearTimeout(timeoutId);
                poll();
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            isMounted = false; // 3. Set false khi rời trang
            if (timeoutId) clearTimeout(timeoutId);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code, router]);

    // Countdown — persist qua sessionStorage để không reset khi reload
    useEffect(() => {
        if (!code) return;
        const key = `payment_qr_start_${code}`;
        let startTime = Number(sessionStorage.getItem(key) ?? 0);
        if (!startTime) {
            startTime = Date.now();
            sessionStorage.setItem(key, String(startTime));
        }
        const getRemaining = () => Math.max(0, TOTAL_SECONDS - Math.floor((Date.now() - startTime) / 1000));

        const init = getRemaining();
        if (init <= 0) { setStatus("failed"); return; }
        setSecondsLeft(init);

        const t = setInterval(() => {
            const rem = getRemaining();
            setSecondsLeft(rem);
            if (rem <= 0) { clearInterval(t); setStatus("failed"); }
        }, 1000);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code]);

    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const ss = String(secondsLeft % 60).padStart(2, "0");
    const amountStr = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">

                {/* Header — dùng brand-dark → brand-blue khớp với booking page */}
                <div className="bg-gradient-to-r from-brand-dark to-brand-blue px-6 py-5 text-center">
                    <p className="text-xs text-white/70 font-medium uppercase tracking-widest mb-1">
                        Thanh toán chuyển khoản
                    </p>
                    <p className="text-white font-bold text-2xl">{amountStr}</p>
                    <p className="text-white/70 text-xs mt-1 font-mono">{code}</p>
                </div>

                <div className="p-6">
                    {status === "waiting" && (
                        <>
                            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                                <Smartphone className="h-4 w-4 text-brand-blue flex-shrink-0" />
                                <span>Dùng điện thoại quét mã QR để xác nhận</span>
                            </div>

                            <div className="flex justify-center mb-4">
                                <div className="border-2 border-brand-blue/20 rounded-xl p-2 bg-white shadow-inner">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={qrImageUrl} alt="QR thanh toán" width={220} height={220} className="rounded-lg" />
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-2 mb-3">
                                <Clock className="h-4 w-4 text-brand-accent" />
                                <span className="text-sm text-gray-500">Hết hạn sau</span>
                                <span className={`font-mono font-bold text-lg tabular-nums ${secondsLeft < 60 ? "text-red-500" : "text-gray-800"}`}>
                                    {mm}:{ss}
                                </span>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Đang chờ xác nhận thanh toán...
                            </div>
                        </>
                    )}

                    {status === "confirmed" && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle className="h-9 w-9 text-emerald-500" />
                            </div>
                            <p className="font-bold text-emerald-700 text-lg">Thanh toán thành công!</p>
                            <p className="text-sm text-gray-500 mt-1">Đang chuyển hướng...</p>
                        </div>
                    )}

                    {status === "failed" && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <XCircle className="h-9 w-9 text-amber-500" />
                            </div>
                            <p className="font-bold text-amber-700 text-lg">Phiên thanh toán hết hạn</p>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed px-2">
                                Đặt vé vẫn hợp lệ — bạn có thể thanh toán lại trong vòng 24h.
                            </p>
                            <div className="mt-4 space-y-2">
                                <button
                                    onClick={() => {
                                        // Reset timer → phép thanh toán lại
                                        try { sessionStorage.removeItem(`payment_qr_start_${code}`); } catch { /* ignore */ }
                                        router.push(`/payment/qr?code=${code}&amount=${amount}`);
                                        window.location.reload();
                                    }}
                                    className="w-full bg-brand-blue hover:opacity-90 text-white font-bold py-2.5 rounded-xl transition-all text-sm shadow-md shadow-brand-blue/20"
                                >
                                    ↻ Thanh toán lại
                                </button>
                                <button
                                    onClick={() => router.push(`/booking/success?code=${code}`)}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl transition-all text-sm"
                                >
                                    Xem đặt vé
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PaymentQrPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
            </div>
        }>
            <QrPageContent />
        </Suspense>
    );
}
