import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    const { pathname } = request.nextUrl;

    // 1. Protected Routes (Account bookings + Admin + Driver Portal)
    if (
        pathname.startsWith("/bookings") ||
        pathname.startsWith("/profile") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/driver")
    ) {
        if (!token) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("returnUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // 2. Auth Routes (Login/Register) - redirect nếu đã đăng nhập
    if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
        if (token) {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/bookings/:path*", "/profile/:path*", "/admin/:path*", "/driver/:path*", "/login", "/register"],
};
