"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

/**
 * SearchableSelect — Searchable dropdown component.
 *
 * Features:
 * - Type-ahead search (filter while typing)
 * - Custom render for options
 * - Optional grouping (e.g. filter by bus type)
 * - Compact mode
 */

export interface SearchableSelectOption {
    value: string;
    label: string;
    searchText?: string; // Extra text to match against during search
    group?: string;      // Group label (e.g. bus type name)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw?: any;           // Original data for custom rendering
}

interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    className?: string;
    triggerClassName?: string;
    disabled?: boolean;
    renderOption?: (option: SearchableSelectOption) => React.ReactNode;
    renderValue?: (option: SearchableSelectOption | undefined) => React.ReactNode;
    // Group filtering
    groups?: string[];
    selectedGroup?: string;
    onGroupChange?: (group: string) => void;
    groupLabel?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "-- Chọn --",
    searchPlaceholder = "Tìm kiếm...",
    emptyText = "Không tìm thấy",
    className,
    triggerClassName,
    disabled,
    renderOption,
    renderValue,
    groups,
    selectedGroup,
    onGroupChange,
    groupLabel = "Loại",
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    const selectedOption = options.find((o) => o.value === value);

    // Filter by search text
    const filtered = React.useMemo(() => {
        let items = options;

        // Group filter
        if (selectedGroup && selectedGroup !== "__all__") {
            items = items.filter((o) => o.group === selectedGroup);
        }

        // Search filter
        if (search.trim()) {
            const q = search.toLowerCase().trim();
            items = items.filter((o) => {
                const text = `${o.label} ${o.searchText || ""} ${o.group || ""}`.toLowerCase();
                return text.includes(q);
            });
        }

        return items;
    }, [options, search, selectedGroup]);

    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            {/* Group filter (optional, e.g. bus type) */}
            {groups && groups.length > 0 && onGroupChange && (
                <Select
                    value={selectedGroup || "__all__"}
                    onValueChange={(v) => onGroupChange(v === "__all__" ? "" : v)}
                >
                    <SelectTrigger
                        className="h-10 bg-white min-w-[130px] text-sm font-medium rounded-lg border-gray-200 shadow-sm hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-brand-blue/20"
                        title={groupLabel}
                    >
                        <SelectValue placeholder={`Tất cả ${groupLabel.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-200 shadow-xl z-[200]">
                        <SelectItem value="__all__">Tất cả {groupLabel.toLowerCase()}</SelectItem>
                        {groups.map((g) => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {/* Searchable dropdown */}
            <Popover open={open} onOpenChange={setOpen} modal={true}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className={cn(
                            "h-10 justify-between bg-white font-medium text-sm rounded-lg min-w-[180px] border-gray-200 shadow-sm hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-brand-blue/20",
                            !value && "text-gray-400 font-normal",
                            triggerClassName
                        )}
                    >
                        <span className="truncate flex-1 text-left">
                            {selectedOption
                                ? renderValue
                                    ? renderValue(selectedOption)
                                    : selectedOption.label
                                : placeholder}
                        </span>
                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl overflow-hidden shadow-xl border border-gray-200 z-[200] pointer-events-auto" align="start" sideOffset={8}>
                    <div className="flex flex-col">
                        {/* Search input */}
                        <div className="flex items-center border-b border-gray-100 px-3 bg-gray-50/50">
                            <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="flex h-10 w-full bg-transparent py-3 text-sm font-medium outline-none placeholder:text-gray-400 placeholder:font-normal"
                                autoFocus
                            />
                        </div>
                        {/* Options list */}
                        <div className="max-h-[260px] overflow-y-auto overscroll-contain p-1.5 space-y-0.5">
                            {filtered.length === 0 ? (
                                <div className="py-6 text-center text-sm text-gray-400">
                                    {emptyText}
                                </div>
                            ) : (
                                filtered.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={cn(
                                            "relative flex w-full cursor-default select-none items-center rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors",
                                            "hover:bg-brand-blue/10 hover:text-brand-blue",
                                            value === option.value && "bg-brand-blue text-white hover:bg-brand-blue hover:text-white"
                                        )}
                                        onClick={() => {
                                            onChange(option.value === value ? "" : option.value);
                                            setOpen(false);
                                            setSearch("");
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4 shrink-0",
                                                value === option.value ? "opacity-100 text-white" : "opacity-0"
                                            )}
                                        />
                                        <span className="flex-1 text-left">
                                            {renderOption ? renderOption(option) : option.label}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
