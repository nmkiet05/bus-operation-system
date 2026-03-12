import { useQuery } from "@tanstack/react-query";
import { getProvinces } from "@/services/api/catalog";

// Define keys for query caching to ensure consistency
export const QUERY_KEYS = {
    PROVINCES: ["provinces"],
    BUS_TYPES: ["busTypes"],
};

/**
 * Enterprise Hook: useProvinces
 * - Fetches list of provinces/cities.
 * - Caches strictly (Infinity staleTime) as this data rarely changes.
 */
export function useProvinces() {
    return useQuery({
        queryKey: QUERY_KEYS.PROVINCES,
        queryFn: getProvinces,
        staleTime: Infinity, // Data is considered fresh forever (until reload)
        gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}

/**
 * Enterprise Hook: useBusTypes (Placeholder for future)
 */
export function useBusTypes() {
    return useQuery({
        queryKey: QUERY_KEYS.BUS_TYPES,
        queryFn: async () => [], // TODO: Implement actual API call
        staleTime: Infinity,
    });
}
