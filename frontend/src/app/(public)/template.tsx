"use client";

import { PageTransition } from "@/components/ui/PageTransition";

export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <PageTransition className="min-h-screen w-full bg-gray-50">
            {children}
        </PageTransition>
    );
}
