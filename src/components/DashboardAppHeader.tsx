import { useLocation, useNavigate } from "@tanstack/react-router";
import { SidebarTrigger } from "./ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useSession } from "#/lib/auth-client";
import AQIIndicator from "./AQIIndicator";
import LocationSearchBar from "./LocationSearchBar";
import NotificationBar from "./NotificationBar";

export default function DashboardAppHeader() {
  const { data: session } = useSession();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = session?.user;

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

  // Handle location search - navigate with search params
  const handleLocationSearch = (location: {
    latitude: number;
    longitude: number;
    city: string;
  }) => {
    navigate({
      to: "/dashboard/risk-map",
      search: {
        lat: location.latitude,
        lng: location.longitude,
        city: location.city,
      },
    });
  };

  return (
    <header
      className={`relative z-50 grid h-14 shrink-0 grid-cols-3 items-center bg-white/80 backdrop-blur-md px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 dark:bg-neutral-900/80 ${
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
          <LocationSearchBar onLocationSelect={handleLocationSearch} />
        )}
      </div>

      {/* Grid 3 (Kanan): AQI Icon, Notification, Avatar */}
      <div className="flex items-center justify-end gap-2">
        {/* AQI Indicator */}
        <AQIIndicator />

        {/* Notification Bell */}
        <NotificationBar />

        <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700" />

        {/* User Avatar */}
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
