"use client";

import { useQuery } from "@tanstack/react-query";
import { getPickupPointsByRoute } from "@/services/api/pickupPoint";
import { QUERY_TIME } from "@/config/query";

/**
 * Hook to fetch pickup points for a specific route
 * Uses TanStack Query for caching
 */
export function usePickupPoints(routeId: number | null) {
    return useQuery({
        queryKey: ["pickupPoints", routeId],
        queryFn: () => getPickupPointsByRoute(routeId!),
        enabled: !!routeId,
        staleTime: QUERY_TIME.TEN_MINUTES,
        gcTime: QUERY_TIME.TWENTY_FOUR_HOURS,
    });
}
