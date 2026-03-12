"use client";

import Link from "next/link";
import { Bus } from "lucide-react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <Link href="/" className="flex flex-col items-center group">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-blue to-sky-600 flex items-center justify-center mb-4 shadow-lg shadow-sky-200/50 group-hover:shadow-sky-300/50 transition-shadow">
                        <Bus className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-blue to-sky-600 bg-clip-text text-transparent">
                        BOS Travel
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Hệ thống vận hành xe khách
                    </p>
                </Link>
                {children}
            </div>
        </div>
    );
}
