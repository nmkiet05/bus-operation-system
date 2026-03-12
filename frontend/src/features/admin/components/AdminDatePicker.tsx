"use client";

import * as React from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface AdminDatePickerProps {
    value: Date | null;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    minDate?: Date;
    disabled?: boolean;
    className?: string;
    /** When true, allows selecting past dates (no automatic today-based restriction) */
    allowPastDates?: boolean;
    /** When true, shows an X button to clear the selected date */
    clearable?: boolean;
}

export function AdminDatePicker({
    value,
    onChange,
    placeholder = "Chọn ngày",
    minDate,
    disabled = false,
    className,
    allowPastDates = false,
    clearable = false,
}: AdminDatePickerProps) {
    const [open, setOpen] = React.useState(false);

    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const minDateNormalized = minDate ? new Date(new Date(minDate).setHours(0, 0, 0, 0)) : null;
    const disabledBefore = allowPastDates ? null : (minDateNormalized && minDateNormalized > today ? minDateNormalized : today);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <div className="relative inline-flex w-full">
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        disabled={disabled}
                        className={cn(
                            "w-full sm:w-[200px] h-10 px-3 justify-start text-left font-medium bg-white rounded-lg border-gray-200 shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-brand-blue/20",
                            !value && "text-muted-foreground",
                            clearable && value && "pr-8",
                            className
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-brand-blue" />
                        <span className="truncate">
                            {value ? format(value, "dd 'thg' MM, yyyy", { locale: vi }) : placeholder}
                        </span>
                    </Button>
                </PopoverTrigger>
                {clearable && value && !disabled && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(undefined);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors z-10"
                        title="Xóa ngày đã chọn"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
            <PopoverContent className="w-auto p-3 rounded-xl shadow-xl border border-gray-200 bg-white z-[200]" align="start" sideOffset={8}>
                <Calendar
                    mode="single"
                    selected={value || undefined}
                    onSelect={(date) => {
                        if (date) {
                            onChange(date);
                            setOpen(false);
                        }
                    }}
                    disabled={disabledBefore ? (date) => date < disabledBefore : undefined}
                    initialFocus
                    locale={vi}
                    formatters={{
                        formatWeekdayName: (date) => ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][date.getDay()]
                    }}
                    modifiers={{
                        sunday: (date) => date.getDay() === 0,
                    }}
                    modifiersClassNames={{
                        sunday: "font-extrabold text-red-500",
                    }}
                    classNames={{
                        day_outside: "text-gray-400 opacity-50 font-normal aria-selected:bg-gray-100/50 aria-selected:text-gray-500 hover:bg-gray-50",
                        day_disabled: "text-gray-300 opacity-100 cursor-not-allowed hover:bg-transparent hover:text-gray-300",
                        day_hidden: "invisible",
                        head_cell: "text-gray-600 font-extrabold text-xs w-9 py-2 uppercase",
                        cell: "text-center p-0 relative focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-medium text-sm aria-selected:opacity-100 hover:bg-brand-blue/10 hover:text-brand-blue rounded-full flex items-center justify-center transition-all",
                        day_selected: "!bg-brand-blue !text-white hover:!bg-brand-blue hover:!text-white shadow-md font-bold",
                        day_today: "bg-gray-100 text-gray-900 font-bold",
                        caption: "flex justify-center pt-1 pb-3 relative items-center",
                        caption_label: "text-sm font-bold text-gray-900 capitalize",
                        nav_button: "h-7 w-7 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors flex items-center justify-center shadow-sm absolute top-0",
                        nav_button_previous: "left-1",
                        nav_button_next: "right-1",
                        table: "w-full border-collapse space-y-1",
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-3",
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
