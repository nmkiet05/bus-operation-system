import { Button } from '@/components/ui/button';
import { Clock, Tag, Bus } from 'lucide-react';

/**
 * FilterBar - Mobile-First Horizontal Scroll
 * - Snap scroll on mobile
 * - Touch-friendly buttons
 * - No scrollbar visible
 */

export function FilterBar() {
    return (
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white py-3 shadow-sm">
            <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide md:gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 rounded-full border-gray-300 font-normal hover:border-brand-blue hover:text-brand-blue"
                >
                    <Clock className="mr-2 h-4 w-4" />
                    Giờ đi sớm nhất
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 rounded-full border-gray-300 font-normal hover:border-brand-blue hover:text-brand-blue"
                >
                    <Clock className="mr-2 h-4 w-4" />
                    Giờ đi muộn nhất
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 rounded-full border-gray-300 font-normal hover:border-brand-blue hover:text-brand-blue"
                >
                    <Tag className="mr-2 h-4 w-4" />
                    Giá rẻ nhất
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 rounded-full border-gray-300 font-normal hover:border-brand-blue hover:text-brand-blue"
                >
                    <Bus className="mr-2 h-4 w-4" />
                    Nhà xe
                </Button>
            </div>
        </div>
    );
}
