"use client";

import { useState } from "react";
import { vi } from "date-fns/locale";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
    value: Date | null;
    onChange: (date: Date | undefined) => void;
    containerRef?: HTMLElement | null;
    placeholder?: string;
    /** Text shown when value is null, e.g. "+ Thêm ngày về" */
    emptyText?: string;
    /** Minimum selectable date (dates before this are disabled) */
    minDate?: Date;
}

export function DatePicker({ value, onChange, placeholder = "Chọn ngày", emptyText, minDate }: DatePickerProps) {
    const [open, setOpen] = useState(false);

    const today = new Date(new Date().setHours(0, 0, 0, 0));
    // Normalize minDate to midnight to allow same-day selection
    const minDateNormalized = minDate ? new Date(new Date(minDate).setHours(0, 0, 0, 0)) : null;
    const disabledBefore = minDateNormalized && minDateNormalized > today ? minDateNormalized : today;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "w-full h-full flex flex-col justify-center items-start text-left px-6 transition-colors focus:outline-none hover:bg-gray-50",
                    )}
                >
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5 line-clamp-1">{placeholder}</span>
                    <div className="flex items-center gap-2 w-full">
                        <span className={cn(
                            "font-black text-sm sm:text-base truncate block w-full text-left",
                            value ? "text-[#1a3b5d]" : "text-gray-400 font-semibold"
                        )}>
                            {value ? format(value, "dd 'thg' MM, yyyy", { locale: vi }) : (emptyText || placeholder)}
                        </span>
                    </div>
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-3 rounded-xl shadow-xl border-0 bg-white ring-1 ring-black/5"
                align="center"
                side="bottom"
                sideOffset={12}
            >
                <Calendar
                    mode="single"
                    selected={value || undefined}
                    onSelect={(date) => {
                        if (date) {
                            onChange(date);
                            setOpen(false);
                        }
                    }}
                    disabled={(date) => date < disabledBefore}
                    initialFocus
                    locale={vi}
                    numberOfMonths={1}
                    showOutsideDays={false}
                    modifiers={{
                        sunday: (date) => date.getDay() === 0,
                    }}
                    modifiersClassNames={{
                        sunday: "font-extrabold",
                    }}
                    classNames={{
                        day_outside: "text-gray-400 opacity-50 font-normal aria-selected:bg-gray-100/50 aria-selected:text-gray-500 hover:bg-gray-50",
                        day_disabled: "text-gray-400 opacity-100 cursor-not-allowed hover:bg-transparent hover:text-gray-400",
                        day_hidden: "invisible",
                        head_cell: "text-gray-600 font-extrabold text-sm w-10 py-3",
                        cell: "text-center p-0 relative focus-within:relative focus-within:z-20",
                        day: "h-10 w-10 p-0 font-bold text-base aria-selected:opacity-100 hover:bg-blue-50 hover:text-brand-blue rounded-full flex items-center justify-center transition-all",
                        day_selected: "!bg-brand-blue !text-white hover:!bg-brand-blue hover:!text-white shadow-md",
                        day_today: "bg-gray-100 text-gray-900",
                        caption: "flex justify-center pt-1 pb-4 relative items-center",
                        caption_label: "text-lg font-black text-[#1a3b5d] capitalize",
                        nav_button: "h-8 w-8 bg-white border border-gray-200 hover:bg-gray-50 hover:text-brand-blue rounded-lg transition-colors flex items-center justify-center shadow-sm absolute top-0",
                        nav_button_previous: "left-0",
                        nav_button_next: "right-0",
                        table: "w-full border-collapse space-y-1",
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4",
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
