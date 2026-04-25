"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { User, HelpCircle, ChevronDown } from "lucide-react";
import { LoginDrawer } from "@/features/auth/components";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * Header Content - Actual Implementation
 */
function HeaderContent() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isHomePage = pathname === "/";

  // Trip Info State (for Mobile Header)
  const [tripInfo, setTripInfo] = useState({
    from: "Điểm đi",
    to: "Điểm đến",
    date: new Date(),
    passengers: 1
  });

  // Effect 1: Sync Trip Info (when params change)
  useEffect(() => {
    if (!pathname?.startsWith("/trips")) return;

    const updateHeaderInfo = () => {
      try {
        // Priority: Session Storage for rich names, Params for values
        const storedFrom = sessionStorage.getItem("search_fromStation");
        const storedTo = sessionStorage.getItem("search_toStation");
        const dateParam = searchParams.get("departureDate") || searchParams.get("date");

        // Passengers Logic - Sync with SearchWidget
        const pAdults = parseInt(searchParams.get("adults") || sessionStorage.getItem("search_adults") || "1");
        const pYouth = parseInt(searchParams.get("youth") || sessionStorage.getItem("search_youth") || "0");
        const pSenior = parseInt(searchParams.get("senior") || sessionStorage.getItem("search_senior") || "0");
        const totalPassengers = pAdults + pYouth + pSenior;

        const fromData = storedFrom ? JSON.parse(storedFrom) : null;
        const toData = storedTo ? JSON.parse(storedTo) : null;
        const dateVal = dateParam ? new Date(dateParam) : new Date();

        setTripInfo({
          from: fromData?.name || fromData?.provinceName || "Điểm đi",
          to: toData?.name || toData?.provinceName || "Điểm đến",
          date: !isNaN(dateVal.getTime()) ? dateVal : new Date(),
          passengers: totalPassengers > 0 ? totalPassengers : 1
        });
      } catch (e) {
        console.error(e);
      }
    };

    updateHeaderInfo();
  }, [searchParams, pathname]);

  // Effect 2: Scroll Handler
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Dynamic Threshold based on Page Type
      const threshold = 10;

      // Change color when scrolled past threshold
      if (currentScrollY > threshold) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Mobile: Smart Hide/Show
      // Hide when scrolling down > 100px, Show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isHomePage]);

  // Desktop: Force white header if not on homepage or trips page
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isTransparentPage = pathname === "/" || pathname?.startsWith("/trips") || pathname?.startsWith("/bus-tickets");

  // Determine Header State
  const isWhiteMode = isScrolled;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-[999] w-full transition-all duration-300 font-sans",
        // Mobile Layout: Show
        isVisible ? "translate-y-0" : "-translate-y-full xl:translate-y-0",

        // --- STYLES (All Platforms) ---
        "py-2 transition-all duration-300",

        // SCROLLED (White Mode)
        isWhiteMode
          ? "bg-white text-gray-900 shadow-md md:py-0"
          : cn(
            "text-white md:py-3 bg-gradient-to-b from-black/50 to-transparent",
            isHomePage ? "bg-transparent" : "bg-[#0EA5E9] md:bg-transparent"
          )
      )}
    >
      <div className={cn(
        "mx-auto max-w-7xl h-16 flex items-center justify-between",
        "w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]"
      )}>

        {/* --- MOBILE TRIP HEADER (Only on /trips on Mobile) --- */}
        {pathname?.startsWith("/trips") && (
          <div className="flex md:hidden items-center justify-between w-full text-white">
            <div className="flex items-center gap-3">
              {/* Back Button */}
              <button onClick={() => window.history.back()} className="p-1 -ml-2">
                <ChevronDown className="h-6 w-6 rotate-90" /> {/* Reusing ChevronDown as Back Icon */}
              </button>

              {/* Trip Info */}
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1 font-bold text-sm max-w-[200px] truncate">
                  <span className="truncate">{tripInfo.from}</span>
                  <span className="text-xs opacity-60 flex-shrink-0">›</span>
                  <span className="truncate">{tripInfo.to}</span>
                </div>
                <div className="text-[10px] opacity-80 font-medium capitalize">
                  {format(tripInfo.date, "EEEE, dd 'thg' MM", { locale: vi })}, {tripInfo.passengers} Khách
                </div>
              </div>
            </div>

            {/* Login/Profile Button (Synced with Standard Header) */}
            <LoginDrawer>
              <button className={cn(
                "flex items-center gap-2 rounded-full border px-2 py-1.5 transition-all ml-2 border-white/30 hover:bg-white/10 hover:border-white/50"
              )}>
                <div className="p-1.5 rounded-full bg-white/20 text-white transition-colors">
                  <User className="h-5 w-5" />
                </div>
              </button>
            </LoginDrawer>
          </div>
        )}

        {/* --- STANDARD HEADER CONTENT (Hidden on Mobile /trips) --- */}
        <div className={cn(
          "flex items-center justify-between w-full",
          (pathname?.startsWith("/trips") || pathname?.startsWith("/booking")) ? "hidden md:flex" : "flex"
        )}>
          {/* --- LEFT: LOGO --- */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <span className={cn(
                "text-3xl font-extrabold tracking-tight transition-colors",
                isWhiteMode ? "text-[#0EA5E9]" : "text-white"
              )}>
                BOS
              </span>
            </Link>

            {/* Nav Links - Desktop Only */}
            <nav className="hidden xl:flex gap-6">
              <Link
                href="/bus-tickets"
                className={cn(
                  "text-sm font-medium transition-colors",
                  isWhiteMode ? "text-gray-700 hover:text-[#0EA5E9]" : "text-white/90 hover:text-white"
                )}
              >
                Vé xe khách
              </Link>
              <Link
                href="/bus-rental"
                className={cn(
                  "text-sm font-medium transition-colors",
                  isWhiteMode ? "text-gray-700 hover:text-[#0EA5E9]" : "text-white/90 hover:text-white"
                )}
              >
                Thuê xe
              </Link>
              <Link
                href="/booking/lookup"
                className={cn(
                  "text-sm font-medium transition-colors",
                  isWhiteMode ? "text-gray-700 hover:text-[#0EA5E9]" : "text-white/90 hover:text-white"
                )}
              >
                Tra cứu vé
              </Link>
            </nav>
          </div>

          {/* --- RIGHT: ACTIONS --- */}
          <div className="flex items-center gap-1 xl:gap-4">

            {/* Hỗ trợ */}
            <button className={cn(
              "hidden xl:flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-colors",
              isWhiteMode ? "text-gray-700 hover:bg-gray-100" : "text-white/90 hover:bg-white/10"
            )}>
              <HelpCircle className="h-4 w-4" />
              <span>Hỗ trợ</span>
            </button>

            {/* Dropdown Languages */}
            <button className={cn(
              "hidden sm:flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-lg transition-colors",
              isWhiteMode ? "text-gray-700 hover:bg-gray-100" : "text-white/90 hover:bg-white/10"
            )}>
              <Image src="/images/vn-flag.png" alt="VN" width={20} height={14} className="object-cover rounded-sm shadow-sm" />
              <span>Tiếng Việt</span>
              <ChevronDown className={cn("h-3 w-3 ml-1", isWhiteMode ? "text-gray-500" : "text-white/70")} />
            </button>

            {/* Nút Tài khoản */}
            <LoginDrawer>
              <button className={cn(
                "flex items-center gap-2 rounded-full md:rounded-lg border px-2 md:px-3 py-1.5 transition-all ml-2",
                isWhiteMode
                  ? "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  : "border-white/30 hover:bg-white/10 hover:border-white/50"
              )}>
                <div className={cn(
                  "p-1.5 rounded-full transition-colors",
                  isWhiteMode ? "bg-gray-100 text-gray-600" : "bg-white/20 text-white"
                )}>
                  {user ? (
                    <span className="h-5 w-5 flex items-center justify-center text-xs font-bold uppercase">
                      {(user.fullName || user.username || "U").charAt(0)}
                    </span>
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div className="hidden text-left text-xs sm:block">
                  {user ? (
                    <>
                      <p className={cn("font-bold truncate max-w-[100px]", isWhiteMode ? "text-gray-900" : "text-white")}>
                        {user.fullName || user.username}
                      </p>
                      <div className={cn("flex items-center font-medium text-[10px]", isWhiteMode ? "text-gray-500" : "text-white/70")}>
                        Tài khoản
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className={cn("font-bold", isWhiteMode ? "text-gray-900" : "text-white")}>Tài khoản</p>
                      <div className={cn("flex items-center font-medium text-[10px] uppercase", isWhiteMode ? "text-gray-500" : "text-white/70")}>
                        Đăng nhập
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </div>
                    </>
                  )}
                </div>
              </button>
            </LoginDrawer>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Header() {
  return (
    <Suspense fallback={<div className="h-16 w-full fixed top-0 z-[999]" />}>
      <HeaderContent />
    </Suspense>
  );
}
