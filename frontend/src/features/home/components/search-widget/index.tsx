"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, User, Plus, Minus } from "lucide-react";
import { CityDropdown, City } from "./CityDropdown";
import { DatePicker } from "./DatePicker";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
// import { Switch } from "@/components/ui/switch"; // Not used yet
// import { getProvinces } from "@/services/api/catalog"; // Removed in favor of hook
import { useProvinces } from "@/hooks/useMasterData";
import { format } from "date-fns";
import { toast } from "sonner";

export function SearchWidget() {
    const router = useRouter();
    // const [stations, setStations] = useState<City[]>([]); // Derived state now

    // State Initialization
    const [fromStation, setFromStation] = useState<City | null>(null);
    const [toStation, setToStation] = useState<City | null>(null);
    const [departureDate, setDepartureDate] = useState<Date | null>(new Date());
    const [returnDate, setReturnDate] = useState<Date | null>(null);

    // Flag to prevent overwriting session storage with initial default values
    const [isInitialized, setIsInitialized] = useState(false);

    // Passengers data
    const [adults, setAdults] = useState(1);
    const [youth, setYouth] = useState(0);
    const [senior, setSenior] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [hasDiscountCard, setHasDiscountCard] = useState(false);
    const [passengersOpen, setPassengersOpen] = useState(false);

    // Callback ref to ensure element is available for PopoverAnchor
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
    // Ref for the date group container to center the calendar
    const [dateGroupEl, setDateGroupEl] = useState<HTMLDivElement | null>(null);

    const searchParams = useSearchParams();

    // Enterprise Optimization: Use Global Hook for Provinces
    const { data: provincesData } = useProvinces();

    // Optimize: Derive State with useMemo to prevent double render
    const stations = useMemo<City[]>(() => {
        if (!provincesData) return [];
        return provincesData.map(province => ({
            id: province.id,
            name: province.name,
            provinceName: province.name,
            provinceId: province.id
        }));
    }, [provincesData]);

    // Initialize state from URL or Session Storage
    useEffect(() => {
        if (stations.length === 0) return;

        const fromId = searchParams.get("fromProvinceId");
        const toId = searchParams.get("toProvinceId");
        const dateParam = searchParams.get("departureDate") || searchParams.get("date");
        const returnDateParam = searchParams.get("returnDate");

        // Helper to find location by ID (Province ID)
        const findStation = (id: string) => stations.find(s => s.id.toString() === id);

        // 1. Try URL Params first (Higher priority)
        let initializedFrom: City | null | undefined = null;
        let initializedTo: City | null | undefined = null;
        let initializedDate: Date | null = null;
        let initializedReturnDate: Date | null = null;

        let initializedAdults = 1;
        let initializedYouth = 0;
        let initializedSenior = 0;

        if (fromId) {
            const found = findStation(fromId);
            if (found) initializedFrom = found;
        }

        if (toId) {
            const found = findStation(toId);
            if (found) initializedTo = found;
        }

        if (dateParam) {
            const parsedDate = new Date(dateParam);
            if (!isNaN(parsedDate.getTime())) initializedDate = parsedDate;
        }

        if (returnDateParam) {
            const parsedReturn = new Date(returnDateParam);
            if (!isNaN(parsedReturn.getTime())) initializedReturnDate = parsedReturn;
        }

        // 2. Fallback to Session Storage if URL params missing (e.g. Back button to Home)
        // Check local storage for passengers as well
        if (!initializedFrom && !initializedTo && !initializedDate) {
            try {
                const storedFrom = sessionStorage.getItem("search_fromStation");
                const storedTo = sessionStorage.getItem("search_toStation");
                const storedDate = sessionStorage.getItem("search_date");
                const storedReturnDate = sessionStorage.getItem("search_returnDate");

                // Passengers
                const storedAdults = sessionStorage.getItem("search_adults");
                const storedYouth = sessionStorage.getItem("search_youth");
                const storedSenior = sessionStorage.getItem("search_senior");

                if (storedFrom) initializedFrom = JSON.parse(storedFrom);
                if (storedTo) initializedTo = JSON.parse(storedTo);

                if (storedDate) {
                    const d = new Date(storedDate);
                    if (!isNaN(d.getTime())) initializedDate = d;
                }

                if (storedReturnDate) {
                    const rd = new Date(storedReturnDate);
                    if (!isNaN(rd.getTime())) initializedReturnDate = rd;
                }

                if (storedAdults) initializedAdults = parseInt(storedAdults);
                if (storedYouth) initializedYouth = parseInt(storedYouth);
                if (storedSenior) initializedSenior = parseInt(storedSenior);

            } catch (e) {
                console.error("Failed to restore search state", e);
            }
        } else {
            // Even if URL has params, we might want to restore passengers from session
            const storedAdults = sessionStorage.getItem("search_adults");
            const storedYouth = sessionStorage.getItem("search_youth");
            const storedSenior = sessionStorage.getItem("search_senior");

            if (storedAdults) initializedAdults = parseInt(storedAdults);
            if (storedYouth) initializedYouth = parseInt(storedYouth);
            if (storedSenior) initializedSenior = parseInt(storedSenior);
        }

        // Apply State
        if (initializedFrom) setFromStation(initializedFrom);
        if (initializedTo) setToStation(initializedTo);
        if (initializedDate) setDepartureDate(initializedDate);
        setReturnDate(initializedReturnDate);

        setAdults(initializedAdults || 1);
        setYouth(initializedYouth || 0);
        setSenior(initializedSenior || 0);

        // Mark as initialized to allow saving changes
        setIsInitialized(true);

    }, [stations, searchParams]);

    // Save state changes to Session Storage (Guarded by isInitialized)
    useEffect(() => {
        if (!isInitialized) return;

        // Always save latest values, remove if cleared
        if (fromStation) {
            sessionStorage.setItem("search_fromStation", JSON.stringify(fromStation));
        } else {
            sessionStorage.removeItem("search_fromStation");
        }
        if (toStation) {
            sessionStorage.setItem("search_toStation", JSON.stringify(toStation));
        } else {
            sessionStorage.removeItem("search_toStation");
        }
        if (departureDate) {
            sessionStorage.setItem("search_date", departureDate.toISOString());
        } else {
            sessionStorage.removeItem("search_date");
        }
        if (returnDate) {
            sessionStorage.setItem("search_returnDate", returnDate.toISOString());
        } else {
            sessionStorage.removeItem("search_returnDate");
        }

        sessionStorage.setItem("search_adults", adults.toString());
        sessionStorage.setItem("search_youth", youth.toString());
        sessionStorage.setItem("search_senior", senior.toString());

    }, [fromStation, toStation, departureDate, returnDate, adults, youth, senior, isInitialized]);

    const handleSearch = () => {
        // Force save before navigate
        if (fromStation) sessionStorage.setItem("search_fromStation", JSON.stringify(fromStation));
        if (toStation) sessionStorage.setItem("search_toStation", JSON.stringify(toStation));
        if (departureDate) sessionStorage.setItem("search_date", departureDate.toISOString());
        if (returnDate) {
            sessionStorage.setItem("search_returnDate", returnDate.toISOString());
        } else {
            sessionStorage.removeItem("search_returnDate");
        }

        sessionStorage.setItem("search_adults", adults.toString());
        sessionStorage.setItem("search_youth", youth.toString());
        sessionStorage.setItem("search_senior", senior.toString());

        if (!fromStation) {
            toast.error("Vui lòng chọn Điểm đi");
            return;
        }
        if (!toStation) {
            toast.error("Vui lòng chọn Điểm đến");
            return;
        }
        if (!departureDate) {
            toast.error("Vui lòng chọn Ngày đi");
            return;
        }

        const params = new URLSearchParams();
        // Use ID directly as it is now Province ID
        params.set("fromProvinceId", fromStation.id.toString());
        params.set("toProvinceId", toStation.id.toString());
        params.set("departureDate", format(departureDate, "yyyy-MM-dd"));

        // Add optional return date if selected
        if (returnDate) {
            params.set("returnDate", format(returnDate, "yyyy-MM-dd"));
        }

        // Add passengers info if needed (optional for search, usually for booking)
        params.set("adults", adults.toString());
        params.set("youth", youth.toString());
        params.set("senior", senior.toString());

        router.push(`/trips?${params.toString()}`);
    };

    const totalPassengers = adults + youth + senior;

    return (
        <div className="relative w-full">
            <div
                id="search-widget-container"
                ref={setContainerEl}
                className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg md:grid-cols-2 xl:grid-cols-[1.3fr_1.3fr_1.2fr_1.2fr_1fr_auto] xl:gap-0 xl:p-1 xl:rounded-xl overflow-visible divide-y xl:divide-y-0 xl:divide-x divide-gray-200"
            >
                {/* 1. FROM */}
                <div className="relative group xl:h-[72px]">
                    <CityDropdown
                        label="Điểm đi"
                        cities={stations}
                        selectedCity={fromStation}
                        onSelect={setFromStation}
                    />
                </div>

                {/* 2. TO */}
                <div className="relative group xl:h-[72px]">
                    <CityDropdown
                        label="Điểm đến"
                        cities={stations}
                        selectedCity={toStation}
                        onSelect={setToStation}
                    />
                </div>


                {/* 3. DATE GROUP (Departure + Return) */}
                <div className="relative group xl:h-[72px]">
                    <div
                        ref={setDateGroupEl}
                        className="w-full h-full flex items-center"
                    >
                        <div className="flex-1">
                            <DatePicker
                                value={departureDate}
                                onChange={(date) => {
                                    setDepartureDate(date || null);
                                    // Clear return date if departure becomes after return
                                    if (date && returnDate && date > returnDate) {
                                        setReturnDate(null);
                                    }
                                }}
                                containerRef={dateGroupEl}
                                placeholder="Ngày đi"
                            />
                        </div>
                    </div>
                </div>

                {/* 3b. RETURN DATE */}
                <div className="relative group xl:h-[72px] xl:!border-l-0">
                    <div className="w-full h-full flex items-center">
                        <div className="flex-1 relative">
                            <DatePicker
                                value={returnDate}
                                onChange={(date) => setReturnDate(date || null)}
                                containerRef={dateGroupEl}
                                placeholder="Ngày về"
                                emptyText="+ Thêm ngày về"
                                minDate={departureDate || undefined}
                            />
                            {/* Clear return date button */}
                            {returnDate && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setReturnDate(null); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 z-10"
                                    title="Bỏ ngày về"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. PASSENGERS */}
                <div className="group relative xl:h-[72px] flex items-center">
                    <Popover open={passengersOpen} onOpenChange={setPassengersOpen}>
                        <PopoverTrigger asChild>
                            <button className="w-full h-full flex flex-col justify-center items-start px-6 hover:bg-gray-50 transition-colors">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Hành khách</span>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-[#1a3b5d]" />
                                    <span className="text-sm font-extrabold text-[#1a3b5d]">
                                        {totalPassengers} Khách
                                    </span>
                                </div>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-80 rounded-2xl border-0 p-0 shadow-2xl ring-1 ring-black/5 bg-white"
                            align="center"
                            sideOffset={12}
                        >
                            <div className="p-4">
                                {/* Adult */}
                                <div className="flex items-center justify-between border-b border-gray-100 py-4">
                                    <div>
                                        <div className="font-bold text-[#1a3b5d]">Người lớn <span className="font-normal text-gray-400">(Trên 6 tuổi)</span></div>
                                        <div className="text-sm text-gray-500">Số lượng: {adults}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setAdults(Math.max(1, adults - 1))}
                                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-colors hover:border-main hover:text-main disabled:opacity-50"
                                            disabled={adults <= 1}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="w-6 text-center font-bold text-[#1a3b5d]">{adults}</span>
                                        <button
                                            onClick={() => setAdults(adults + 1)}
                                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-colors hover:border-main hover:text-main"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Youth */}
                                <div className="flex items-center justify-between border-b border-gray-100 py-4">
                                    <div>
                                        <div className="font-bold text-[#1a3b5d]">Trẻ em <span className="font-normal text-gray-400">(0-6 tuổi)</span></div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setYouth(Math.max(0, youth - 1))}
                                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-colors hover:border-main hover:text-main disabled:opacity-50"
                                            disabled={youth <= 0}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="w-6 text-center font-bold text-[#1a3b5d]">{youth}</span>
                                        <button
                                            onClick={() => setYouth(youth + 1)}
                                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-colors hover:border-main hover:text-main"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Senior */}
                                <div className="flex items-center justify-between border-b border-gray-100 py-4">
                                    <div>
                                        <div className="font-bold text-[#1a3b5d]">Người cao tuổi <span className="font-normal text-gray-400">(Trên 60 tuổi)</span></div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setSenior(Math.max(0, senior - 1))}
                                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-colors hover:border-main hover:text-main disabled:opacity-50"
                                            disabled={senior <= 0}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="w-6 text-center font-bold text-[#1a3b5d]">{senior}</span>
                                        <button
                                            onClick={() => setSenior(senior + 1)}
                                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-colors hover:border-main hover:text-main"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* 5. SUBMIT BUTTON */}
                <div className="flex items-center justify-end md:col-span-2 xl:col-span-1 p-2 xl:p-1">
                    <button
                        onClick={handleSearch}
                        className="flex h-12 w-full xl:h-full xl:w-auto items-center justify-center gap-2 rounded-lg bg-[#0EA5E9] px-6 font-bold text-white shadow-md transition-all hover:bg-[#0284C7] active:scale-[0.98] text-sm whitespace-nowrap"
                    >
                        <Search className="h-4 w-4" />
                        <span>TÌM KIẾM</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
