import { useState, useRef, useEffect, memo } from "react";
import { Check, ChevronDown, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export interface City {
    id: number;
    name: string;
    provinceName?: string;
    provinceId?: number;
}

interface CityDropdownProps {
    label: string;
    cities: City[];
    selectedCity: City | null;
    onSelect: (city: City | null) => void;
    excludeCityId?: number;
    minimal?: boolean;
}

export const CityDropdown = memo(function CityDropdown({
    label,
    cities,
    selectedCity,
    onSelect,
    excludeCityId,
}: CityDropdownProps) {
    const [open, setOpen] = useState(false);
    // ... rest of component
    const [searchQuery, setSearchQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter cities
    const filteredCities = cities.filter(city => {
        if (excludeCityId && city.id === excludeCityId) return false;

        if (!searchQuery) return true;

        const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const query = normalize(searchQuery);
        return normalize(city.name).includes(query) || (city.provinceName && normalize(city.provinceName).includes(query));
    });

    // Focus input when opening
    useEffect(() => {
        if (open && inputRef.current) {
            // Small timeout to allow popover animation to start
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    const handleSelect = (city: City) => {
        onSelect(city);
        setOpen(false);
        setSearchQuery("");
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    aria-controls="city-listbox"
                    className={cn(
                        "w-full h-full flex flex-col justify-center items-start text-left focus:outline-none px-6 hover:bg-gray-50 transition-colors",
                    )}
                >
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</span>
                    <div className="flex w-full items-center justify-between">
                        <span className={cn(
                            "font-extrabold text-sm sm:text-base truncate block",
                            selectedCity ? "text-[#1a3b5d]" : "text-gray-400"
                        )}>
                            {selectedCity ? selectedCity.name : "Chọn địa điểm"}
                        </span>
                        <ChevronDown className={cn(
                            "h-4 w-4 text-gray-400 transition-transform duration-200 ml-2 shrink-0",
                            open && "transform rotate-180"
                        )} />
                    </div>
                </button>
            </PopoverTrigger>

            <PopoverContent
                className="w-[320px] p-0 bg-white rounded-xl shadow-xl border-0 ring-1 ring-black/5"
                align="center"
                side="bottom"
                sideOffset={12}
            >
                {/* Search Input */}
                <div className="flex items-center border-b border-gray-100 px-3 py-3">
                    <Search className="h-4 w-4 text-gray-400 mr-2" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-900"
                        placeholder="Tìm tỉnh thành, bến xe..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* City List */}
                <div className="max-h-[300px] overflow-y-auto py-2">
                    {filteredCities.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-500">
                            Không tìm thấy kết quả
                        </div>
                    ) : (
                        <div>
                            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Địa điểm phổ biến
                            </div>
                            <ul className="p-1">
                                {filteredCities.map((city) => (
                                    <li key={city.id}>
                                        <button
                                            type="button"
                                            onClick={() => handleSelect(city)}
                                            className={cn(
                                                "w-full flex items-center px-3 py-2.5 text-left rounded-lg transition-colors hover:bg-blue-50 group",
                                                selectedCity?.id === city.id && "bg-blue-50"
                                            )}
                                        >
                                            <div className={cn(
                                                "mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 transition-colors group-hover:bg-blue-100",
                                                selectedCity?.id === city.id && "bg-blue-100 text-brand-blue"
                                            )}>
                                                <MapPin className="h-4 w-4 text-gray-500 group-hover:text-brand-blue" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={cn(
                                                    "font-bold text-gray-900 group-hover:text-brand-blue truncate",
                                                    selectedCity?.id === city.id && "text-brand-blue"
                                                )}>
                                                    {city.name}
                                                </div>
                                                {city.provinceName && (
                                                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                                                        {city.provinceName}
                                                    </div>
                                                )}
                                            </div>
                                            {selectedCity?.id === city.id && (
                                                <Check className="h-4 w-4 text-brand-blue ml-2 shrink-0" />
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
});
