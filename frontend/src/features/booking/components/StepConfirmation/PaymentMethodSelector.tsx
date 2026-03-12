"use client";

import { cn } from "@/lib/utils";
import { Building2, CreditCard, Wallet } from "lucide-react";

const PAYMENT_METHODS = [
    {
        id: "COUNTER",
        label: "Thanh toán tại quầy",
        description: "Thanh toán khi lên xe",
        icon: Building2,
        available: true,
    },
    {
        id: "BANK_TRANSFER",
        label: "Chuyển khoản ngân hàng",
        description: "Chuyển khoản trước giờ khởi hành",
        icon: CreditCard,
        available: true,
    },
    {
        id: "VNPAY",
        label: "VNPay",
        description: "Sắp ra mắt",
        icon: Wallet,
        available: false,
    },
];

interface PaymentMethodSelectorProps {
    selectedMethod: string | null;
    onSelect: (method: string) => void;
}

export function PaymentMethodSelector({
    selectedMethod,
    onSelect,
}: PaymentMethodSelectorProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
                Phương thức thanh toán
            </h3>

            <div className="space-y-2">
                {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const isSelected = selectedMethod === method.id;

                    return (
                        <button
                            key={method.id}
                            type="button"
                            disabled={!method.available}
                            onClick={() => onSelect(method.id)}
                            className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                                isSelected
                                    ? "border-brand-blue bg-blue-50/50"
                                    : "border-gray-200 hover:border-gray-300",
                                !method.available && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {/* Radio indicator */}
                            <div
                                className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                    isSelected
                                        ? "border-brand-blue"
                                        : "border-gray-300"
                                )}
                            >
                                {isSelected && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-brand-blue" />
                                )}
                            </div>

                            <Icon className={cn(
                                "h-5 w-5 flex-shrink-0",
                                isSelected ? "text-brand-blue" : "text-gray-400"
                            )} />

                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "text-sm font-semibold",
                                    isSelected ? "text-brand-blue" : "text-gray-700"
                                )}>
                                    {method.label}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {method.description}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
