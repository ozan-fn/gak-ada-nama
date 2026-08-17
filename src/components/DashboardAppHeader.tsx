import { useLocation } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { SidebarTrigger } from "./ui/sidebar";
import { Bell, MapPin, Search, Wind } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useSession } from "#/lib/auth-client";
import { useUserLocation } from "#/hooks/useUserLocation";
import { useEnvironmentData } from "#/hooks/useEnvironmentData";

// AQI color scale (standard international)
function getAQIColor(aqi: number): string {
  if (aqi <= 50) return "bg-emerald-500"; // Good
  if (aqi <= 100) return "bg-yellow-500"; // Moderate
  if (aqi <= 150) return "bg-orange-500"; // Unhealthy for Sensitive
  if (aqi <= 200) return "bg-red-500"; // Unhealthy
  if (aqi <= 300) return "bg-purple-500"; // Very Unhealthy
  return "bg-red-900"; // Hazardous
}

// AQI category label
function getAQICategory(aqi: number): string {
  if (aqi <= 50) return "Baik";
  if (aqi <= 100) return "Sedang";
  if (aqi <= 150) return "Tidak Sehat (Sensitif)";
  if (aqi <= 200) return "Tidak Sehat";
  if (aqi <= 300) return "Sangat Tidak Sehat";
  return "Berbahaya";
}

export default function DashboardAppHeader() {
  const { data: session } = useSession();
  const { pathname } = useLocation();
  const user = session?.user;

  const userLocation = useUserLocation();
  const { aqi, loading: aqiLoading } = useEnvironmentData(userLocation);

  const [showAQIDropdown, setShowAQIDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowAQIDropdown(false);
      }
    }

    if (showAQIDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAQIDropdown]);

  const isNoBorderRoute =
    pathname === "/dashboard" || pathname === "/dashboard/risk-map";

  // Cek khusus untuk menampilkan Search Bar
  const isRiskMapRoute = pathname === "/dashboard/risk-map";

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get current AQI value and color
  const currentAQI = aqi?.aqi ?? 0;
  const aqiColor = getAQIColor(currentAQI);
  const aqiCategory = getAQICategory(currentAQI);

  return (
    <header
      className={`grid h-14 shrink-0 grid-cols-3 items-center bg-white/80 backdrop-blur-md px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 dark:bg-neutral-900/80 ${
        isNoBorderRoute
          ? "border-b-0"
          : "border-b border-neutral-200/60 dark:border-neutral-800/60"
      }`}
    >
      {/* Grid 1 (Kiri): Sidebar Trigger */}
      <div className="flex items-center justify-start gap-3">
        <SidebarTrigger className="-ml-1 size-7 rounded-lg" />
        <div className="hidden h-5 w-px bg-border sm:block" />
      </div>

      {/* Grid 2 (Tengah): Search Location (Hanya di /dashboard/risk-map) */}
      <div className="flex justify-center">
        {isRiskMapRoute && (
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari lokasi..."
              className="h-9 w-full rounded-full border border-neutral-200 bg-neutral-50/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:border-transparent dark:bg-neutral-900/50 dark:border-neutral-800 dark:focus-visible:ring-neutral-700"
            />
          </div>
        )}
      </div>

      {/* Grid 3 (Kanan): AQI Icon, Notification, Avatar */}
      <div className="flex items-center justify-end gap-2">
        {/* AQI Indicator with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowAQIDropdown(!showAQIDropdown)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100/60 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900 transition-colors dark:bg-neutral-800/60 dark:text-neutral-400 dark:hover:bg-neutral-700/80 dark:hover:text-neutral-100"
            aria-label="Air Quality Index"
          >
            <Wind className="h-4 w-4" />
            {!aqiLoading && currentAQI > 0 && (
              <span
                className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${aqiColor} ring-2 ring-white dark:ring-neutral-900`}
                aria-hidden="true"
              />
            )}
          </button>

          {/* AQI Dropdown */}
          {showAQIDropdown && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Kualitas Udara
                  </p>
                  <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {currentAQI > 0 ? currentAQI : "—"}
                    <span className="ml-1 text-sm font-medium text-neutral-500">
                      AQI
                    </span>
                  </p>
                </div>
                <span
                  className={`mt-1 inline-flex items-center rounded-full ${aqiColor} px-2 py-1 text-xs font-medium text-white`}
                >
                  {aqiCategory}
                </span>
              </div>

              <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3 dark:border-neutral-700">
                <p className="inline-flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-500 dark:text-neutral-400" />
                  <span>{userLocation?.city || "Lokasi Anda"}</span>
                </p>
                {currentAQI > 0 ? (
                  <>
                    {currentAQI <= 50 && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        Udara bersih. Aman untuk aktivitas outdoor.
                      </p>
                    )}
                    {currentAQI > 50 && currentAQI <= 100 && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        Kualitas udara dapat diterima. Kelompok sensitif
                        sebaiknya batasi aktivitas outdoor berkepanjangan.
                      </p>
                    )}
                    {currentAQI > 100 && currentAQI <= 150 && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        Kelompok sensitif mungkin mengalami dampak kesehatan.
                        Batasi aktivitas outdoor berkepanjangan.
                      </p>
                    )}
                    {currentAQI > 150 && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        ⚠️ Tidak sehat! Hindari aktivitas outdoor. Gunakan
                        masker jika harus keluar.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Data AQI tidak tersedia untuk lokasi ini.
                  </p>
                )}
              </div>

              <div className="mt-3 border-t border-neutral-100 pt-2 dark:border-neutral-700">
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                  Data real-time dari AQICN
                </p>
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100/60 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900 transition-colors dark:bg-neutral-800/60 dark:text-neutral-400 dark:hover:bg-neutral-700/80 dark:hover:text-neutral-100"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900" />
        </button>

        <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700" />

        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-neutral-100/60 px-1.5 py-1 hover:bg-neutral-200/80 transition-colors dark:bg-neutral-800/60 dark:hover:bg-neutral-700/80"
        >
          <Avatar className="h-7 w-7 rounded-lg">
            <AvatarImage
              src={user?.image ?? undefined}
              alt={user?.name ?? "User"}
            />
            <AvatarFallback
              className="rounded-lg bg-foreground text-[11px] font-semibold text-background"
              suppressHydrationWarning
            >
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  );
}
