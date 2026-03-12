"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TripCard } from "@/features/search/components/TripCard";
import { RoundTripTabs } from "@/features/search/components/RoundTripTabs";
import { SelectedTripBanner } from "@/features/search/components/SelectedTripBanner";
import { FilterBar } from "@/features/search/components/FilterBar";
import { SearchWidget } from "@/features/home/components/search-widget";
import { searchTrips, Trip } from "@/services/api/trips";
import { toast } from "sonner";
import { Loader2, Flower as FlowerIcon } from "lucide-react";
import { Suspense } from "react";

function SearchResults() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // URL params
    const fromProvinceId = searchParams.get("fromProvinceId");
    const toProvinceId = searchParams.get("toProvinceId");
    const departureDateStr = searchParams.get("departureDate") || searchParams.get("date");
    const returnDateStr = searchParams.get("returnDate");

    const isRoundTrip = !!returnDateStr;

    // Trip lists
    const [outboundTrips, setOutboundTrips] = useState<Trip[]>([]);
    const [returnTrips, setReturnTrips] = useState<Trip[]>([]);
    const [loadingOutbound, setLoadingOutbound] = useState(true);
    const [loadingReturn, setLoadingReturn] = useState(false);

    // Round-trip state
    const [activeTab, setActiveTab] = useState<"outbound" | "return">("outbound");
    const [selectedOutbound, setSelectedOutbound] = useState<Trip | null>(null);
    const [selectedReturn, setSelectedReturn] = useState<Trip | null>(null);

    // Fetch outbound trips
    useEffect(() => {
        const fetchOutbound = async () => {
            if (!fromProvinceId || !toProvinceId || !departureDateStr) {
                setLoadingOutbound(false);
                return;
            }
            try {
                setLoadingOutbound(true);
                const data = await searchTrips({
                    fromProvinceId: Number(fromProvinceId),
                    toProvinceId: Number(toProvinceId),
                    departureDate: departureDateStr,
                });
                setOutboundTrips(data);
            } catch (error) {
                console.error("Failed to fetch outbound trips", error);
                toast.error("Không thể tải danh sách chuyến đi");
            } finally {
                setLoadingOutbound(false);
            }
        };
        fetchOutbound();
    }, [fromProvinceId, toProvinceId, departureDateStr]);

    // Fetch return trips (only when round-trip)
    useEffect(() => {
        const fetchReturn = async () => {
            if (!isRoundTrip || !fromProvinceId || !toProvinceId || !returnDateStr) return;
            try {
                setLoadingReturn(true);
                // Reverse from/to for return trip
                const data = await searchTrips({
                    fromProvinceId: Number(toProvinceId),
                    toProvinceId: Number(fromProvinceId),
                    departureDate: returnDateStr,
                });
                setReturnTrips(data);
            } catch (error) {
                console.error("Failed to fetch return trips", error);
                toast.error("Không thể tải danh sách chuyến về");
            } finally {
                setLoadingReturn(false);
            }
        };
        fetchReturn();
    }, [isRoundTrip, fromProvinceId, toProvinceId, returnDateStr]);

    // Reset round-trip state when search params change (new search)
    useEffect(() => {
        setSelectedOutbound(null);
        setSelectedReturn(null);
        setActiveTab("outbound");
    }, [fromProvinceId, toProvinceId, departureDateStr, returnDateStr]);

    // Handlers
    const handleSelectOutbound = useCallback(
        (trip: Trip) => {
            if (isRoundTrip) {
                setSelectedOutbound(trip);
                setActiveTab("return");
                toast.success("Đã chọn chuyến đi! Vui lòng chọn chuyến về.");
            } else {
                // One-way: go straight to booking
                router.push(`/booking/${trip.id}`);
            }
        },
        [isRoundTrip, router]
    );

    const handleSelectReturn = useCallback(
        (trip: Trip) => {
            if (!selectedOutbound) return;
            setSelectedReturn(trip);
            // Navigate to booking with both trip IDs
            router.push(
                `/booking/${selectedOutbound.id}?returnTripId=${trip.id}`
            );
        },
        [selectedOutbound, router]
    );

    const handleClearOutbound = useCallback(() => {
        setSelectedOutbound(null);
        setSelectedReturn(null);
        setActiveTab("outbound");
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleClearReturn = useCallback(() => {
        setSelectedReturn(null);
    }, []);

    // Helper: Build full datetime from trip's departureDate + departureTime
    // Backend returns departureTime as LocalTime ("07:00:00"), not a full ISO datetime
    const buildFullDateTime = (trip: Trip): number | null => {
        if (!trip.departureTime) return null;
        // If departureTime already includes a date (ISO format), parse directly
        if (trip.departureTime.includes('T') || trip.departureTime.includes('-')) {
            return new Date(trip.departureTime).getTime();
        }
        // Otherwise combine departureDate + departureTime
        const dateStr = trip.departureDate;
        if (dateStr) {
            return new Date(`${dateStr}T${trip.departureTime}`).getTime();
        }
        return null;
    };

    // Current view data — filter return trips: departure must be after outbound estimated arrival
    const filteredReturnTrips = (() => {
        if (!selectedOutbound || !returnTrips.length) return returnTrips;

        // Calculate outbound arrival time
        let outboundArrivalMs: number | null = null;

        if (selectedOutbound.arrivalTime) {
            const parsed = new Date(selectedOutbound.arrivalTime).getTime();
            if (!isNaN(parsed)) outboundArrivalMs = parsed;
        }

        // Fallback: estimate from departureDate + departureTime + duration
        if (outboundArrivalMs === null && selectedOutbound.duration) {
            const depMs = buildFullDateTime(selectedOutbound);
            if (depMs !== null) {
                outboundArrivalMs = depMs + selectedOutbound.duration * 60 * 1000;
            }
        }

        if (outboundArrivalMs === null) {
            return returnTrips; // Can't determine arrival, show all
        }

        return returnTrips.filter((t) => {
            const retDepMs = buildFullDateTime(t);
            if (retDepMs === null) return true; // Can't parse, show it
            return retDepMs > outboundArrivalMs;
        });
    })();

    const currentTrips = activeTab === "outbound" ? outboundTrips : filteredReturnTrips;
    const currentLoading = activeTab === "outbound" ? loadingOutbound : loadingReturn;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Banner */}
            <div className="hidden md:block bg-brand-blue pt-28 pb-32 mb-0 relative overflow-visible">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute right-0 top-0 h-full w-1/3 opacity-30">
                        <div className="absolute right-10 top-[-20px] h-32 w-32 rounded-full bg-yellow-300 blur-[80px]" />
                    </div>
                    <div className="absolute -right-4 -top-10 opacity-80">
                        <div className="absolute top-10 right-10 text-yellow-300 transform rotate-12">
                            <FlowerIcon size={64} className="fill-yellow-400 text-yellow-500/50 drop-shadow-md" />
                        </div>
                        <div className="absolute top-24 right-4 text-yellow-300 transform -rotate-12">
                            <FlowerIcon size={48} className="fill-yellow-400 text-yellow-500/50 drop-shadow-md" />
                        </div>
                    </div>
                    <div className="absolute -left-4 top-20 opacity-60">
                        <div className="absolute top-0 left-6 text-yellow-300 transform rotate-45">
                            <FlowerIcon size={56} className="fill-yellow-400 text-yellow-500/50 drop-shadow-md" />
                        </div>
                        <div className="absolute top-16 left-2 text-yellow-300 transform -rotate-12">
                            <FlowerIcon size={32} className="fill-yellow-400 text-yellow-500/50 drop-shadow-md" />
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 scale-90 origin-top relative z-10">
                    <SearchWidget />
                </div>
            </div>

            <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8 pt-20 md:pt-0">
                {/* Sidebar Filter */}
                <div className="hidden lg:block w-1/4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-24">
                        <h3 className="font-bold text-lg mb-4 text-brand-blue">Bộ lọc tìm kiếm</h3>
                        <div className="space-y-3">
                            <p className="text-sm text-gray-500">Giờ đi</p>
                            <div className="h-2 bg-gray-100 rounded"></div>
                            <p className="text-sm text-gray-500 pt-2">Nhà xe</p>
                            <div className="h-2 bg-gray-100 rounded"></div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    <FilterBar />

                    {/* Round-trip tabs */}
                    {isRoundTrip && departureDateStr && returnDateStr && (
                        <RoundTripTabs
                            departureDate={new Date(departureDateStr)}
                            returnDate={new Date(returnDateStr)}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            outboundSelected={!!selectedOutbound}
                            returnSelected={!!selectedReturn}
                            returnEnabled={!!selectedOutbound}
                        />
                    )}

                    {/* Selected trip banners */}
                    {isRoundTrip && selectedOutbound && activeTab === "return" && (
                        <SelectedTripBanner
                            trip={selectedOutbound}
                            label="Chuyến đi"
                            onClear={handleClearOutbound}
                        />
                    )}

                    {/* Trip list */}
                    {currentLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
                        </div>
                    ) : currentTrips.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                            <h3 className="text-lg font-bold text-gray-700">
                                Không tìm thấy chuyến xe nào
                            </h3>
                            <p className="text-gray-500">
                                Vui lòng thử lại với ngày hoặc tuyến đường khác
                            </p>
                        </div>
                    ) : (
                        <div className="mt-4 space-y-4">
                            {currentTrips.map((trip) => (
                                <TripCard
                                    key={trip.id}
                                    startTime={trip.departureTime?.substring(0, 5) || "--:--"}
                                    endTime={trip.arrivalTime?.substring(11, 16) || "--:--"}
                                    duration={`${Math.round(trip.duration / 60)}h`}
                                    price={trip.price}
                                    operator={trip.busType}
                                    seatsAvailable={trip.availableSeats}
                                    onBook={() =>
                                        activeTab === "outbound"
                                            ? handleSelectOutbound(trip)
                                            : handleSelectReturn(trip)
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense
            fallback={
                <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
                </div>
            }
        >
            <SearchResults />
        </Suspense>
    );
}
