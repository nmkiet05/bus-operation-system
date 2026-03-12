"use client";

interface PriceBreakdownProps {
    outboundPrice: number;
    outboundSeatCount: number;
    returnPrice?: number;
    returnSeatCount?: number;
    isRoundTrip?: boolean;
    serviceFee?: number;
}

export function PriceBreakdown({
    outboundPrice,
    outboundSeatCount,
    returnPrice = 0,
    returnSeatCount = 0,
    isRoundTrip = false,
    serviceFee = 0,
}: PriceBreakdownProps) {
    const outboundSubtotal = outboundPrice * outboundSeatCount;
    const returnSubtotal = (returnPrice || 0) * (returnSeatCount || 0);
    const subtotal = outboundSubtotal + returnSubtotal;
    const total = subtotal + serviceFee;

    const fmt = (value: number) =>
        new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
                Chi tiết giá
            </h3>

            <div className="space-y-3 text-sm">
                {/* Outbound */}
                <div className="flex justify-between">
                    <span className="text-gray-600">
                        {isRoundTrip && (
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5 align-middle" />
                        )}
                        {isRoundTrip ? "Chuyến đi" : "Giá vé"} × {outboundSeatCount}
                    </span>
                    <span className="font-medium text-gray-900">
                        {fmt(outboundSubtotal)}
                    </span>
                </div>

                {/* Return */}
                {isRoundTrip && returnSeatCount > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-600">
                            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1.5 align-middle" />
                            Chuyến về × {returnSeatCount}
                        </span>
                        <span className="font-medium text-gray-900">
                            {fmt(returnSubtotal)}
                        </span>
                    </div>
                )}

                <div className="flex justify-between">
                    <span className="text-gray-600">Phí dịch vụ</span>
                    <span className="font-medium text-emerald-600">
                        {serviceFee === 0 ? "Miễn phí" : fmt(serviceFee)}
                    </span>
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="font-bold text-gray-900">Tổng cộng</span>
                    <span className="text-xl font-bold text-brand-blue">
                        {fmt(total)}
                    </span>
                </div>
            </div>

            <p className="text-[11px] text-gray-400 mt-3">
                Giá đã bao gồm thuế VAT và phí bảo hiểm hành khách
            </p>
        </div>
    );
}
