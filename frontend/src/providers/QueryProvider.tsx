"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Enterprise Standard: Aggressive caching for Master Data
                        staleTime: 60 * 1000, // 1 minute default
                        gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
                        refetchOnWindowFocus: false, // Prevent spamming API on tab switch
                        retry: 1, // Minimize retry spam
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
