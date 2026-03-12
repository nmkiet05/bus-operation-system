import { Wifi, Zap, BusFront } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TripCardProps {
    startTime: string; // "08:00"
    endTime: string;   // "14:00"
    duration: string;  // "6h"
    price: number;     // 350000
    operator: string;  // "Phương Trang"
    seatsAvailable: number;
    onBook?: () => void;
}

/**
 * TripCard - Mobile-First Design
 * - Mobile: Vertical stack with compact spacing
 * - Desktop: Horizontal layout with side-by-side sections
 */

export function TripCard({ startTime, endTime, duration, price, operator, seatsAvailable, onBook }: TripCardProps) {
    return (
        <div className="group relative transition-all hover:-translate-y-1">
            <Card className="flex flex-col overflow-hidden border-0 shadow-sm transition-shadow hover:shadow-xl md:flex-row">

                {/* Left Section: Time & Info */}
                <div className="flex flex-1 flex-col justify-center p-4 md:p-6">

                    <div className="mb-3 flex items-center gap-4 md:mb-4 md:gap-12">
                        {/* Time */}
                        <div className="flex min-w-[50px] flex-col items-center md:min-w-[60px]">
                            <span className="text-xl font-bold text-brand-blue md:text-2xl">{startTime}</span>
                            <span className="text-[10px] font-medium text-gray-500 md:text-xs">Nơi đi</span>
                        </div>

                        {/* Duration Line */}
                        <div className="flex flex-1 flex-col items-center px-2 md:px-4">
                            <span className="mb-1 text-[10px] text-gray-400 md:text-xs">{duration}</span>
                            <div className="relative h-[2px] w-full bg-gray-200">
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-gray-400">
                                    <BusFront className="h-3 w-3 md:h-4 md:w-4" />
                                </div>
                            </div>
                        </div>

                        {/* Time */}
                        <div className="flex min-w-[50px] flex-col items-center md:min-w-[60px]">
                            <span className="text-xl font-bold text-brand-blue md:text-2xl">{endTime}</span>
                            <span className="text-[10px] font-medium text-gray-500 md:text-xs">Nơi đến</span>
                        </div>
                    </div>

                    {/* Operator & Amenities */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600 md:gap-3 md:text-sm">
                        <span className="font-bold text-gray-900">{operator}</span>
                        <span className="hidden h-1 w-1 rounded-full bg-gray-300 md:block" />
                        <div className="flex gap-2">
                            <Wifi className="h-3 w-3 text-gray-400 md:h-4 md:w-4" />
                            <Zap className="h-3 w-3 text-gray-400 md:h-4 md:w-4" />
                        </div>
                        <span className="ml-auto font-medium text-orange-500">{seatsAvailable} ghế trống</span>
                    </div>

                </div>

                {/* Right Section: Price & Action */}
                <div className="flex w-full flex-col items-center justify-center border-t border-gray-100 bg-gray-50 p-4 md:w-48 md:border-l md:border-t-0 md:p-6">
                    <div className="mb-2 text-xl font-bold text-brand-blue md:text-2xl">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
                    </div>
                    <Button
                        onClick={onBook}
                        className="w-full bg-brand-blue font-bold hover:bg-sky-700 active:scale-[0.98]"
                    >
                        CHỌN CHUYẾN
                    </Button>
                </div>

            </Card>
        </div>
    );
}
