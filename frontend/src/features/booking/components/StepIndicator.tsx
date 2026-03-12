"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
    currentStep: number;
    totalSteps?: number;
    steps?: string[];
}

const defaultSteps = ["Chọn ghế", "Điểm đón/trả", "Thông tin", "Xác nhận"];

/**
 * StepIndicator Component
 * Hiển thị progress bar cho booking flow
 */
export function StepIndicator({
    currentStep,
    totalSteps = 4,
    steps = defaultSteps,
}: StepIndicatorProps) {
    return (
        <div className="w-full py-5 px-4 bg-white border-b border-gray-100 shadow-sm">
            <div className="container mx-auto max-w-4xl">
                <div className="flex items-center justify-between relative">
                    {/* Progress Line */}
                    <div className="absolute left-0 right-0 top-[18px] h-0.5 bg-gray-200 -z-10">
                        <div
                            className="h-full bg-gradient-to-r from-brand-blue to-sky-500 transition-all duration-500 ease-out"
                            style={{
                                width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
                            }}
                        />
                    </div>

                    {/* Steps */}
                    {steps.slice(0, totalSteps).map((label, index) => {
                        const stepNumber = index + 1;
                        const isCompleted = currentStep > stepNumber;
                        const isCurrent = currentStep === stepNumber;
                        const isPending = currentStep < stepNumber;

                        return (
                            <div
                                key={stepNumber}
                                className="flex flex-col items-center gap-1.5 relative"
                            >
                                {/* Circle */}
                                <div
                                    className={cn(
                                        "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
                                        isCompleted &&
                                        "bg-brand-blue text-white shadow-md shadow-brand-blue/20",
                                        isCurrent &&
                                        "bg-brand-blue text-white ring-4 ring-brand-blue/15 shadow-lg shadow-brand-blue/25 scale-110",
                                        isPending && "bg-gray-100 text-gray-400 border-2 border-gray-200"
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="h-4 w-4" strokeWidth={3} />
                                    ) : (
                                        stepNumber
                                    )}
                                </div>

                                {/* Label */}
                                <span
                                    className={cn(
                                        "text-xs font-medium text-center transition-colors duration-300 whitespace-nowrap",
                                        isCurrent && "text-brand-blue font-bold",
                                        isPending && "text-gray-400",
                                        isCompleted && "text-gray-600 font-semibold"
                                    )}
                                >
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
