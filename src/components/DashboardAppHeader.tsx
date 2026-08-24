import { useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut, Settings, User } from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { useSession, signOut } from "#/lib/auth-client";
import AQIIndicator from "./AQIIndicator";
import LocationSearchBar from "./LocationSearchBar";
import NotificationBar from "./NotificationBar";

export default function DashboardAppHeader() {
  const { data: session } = useSession();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = session?.user;
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isNoBorderRoute =
    pathname === "/dashboard" || pathname === "/dashboard/risk-map";

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

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      navigate({ to: "/login" });
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
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
        <AQIIndicator />
        <NotificationBar />

        <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700" />

        <DropdownMenu>
          <DropdownMenuTrigger>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-neutral-100/60 px-1.5 py-1 hover:bg-neutral-200/80 transition-colors dark:bg-neutral-800/60 dark:hover:bg-neutral-700/80 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
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
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" sideOffset={8} className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs font-medium leading-none truncate">
                    {user?.name ?? "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email ?? ""}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
              <User className="mr-2 size-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
              <Settings className="mr-2 size-4" />
              Pengaturan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <LogOut className="mr-2 size-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog
          open={showLogoutConfirm}
          onOpenChange={setShowLogoutConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Keluar dari akun?</AlertDialogTitle>
              <AlertDialogDescription>
                Anda akan keluar dari sesi ini dan perlu login kembali untuk
                mengakses dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loggingOut}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                disabled={loggingOut}
                className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
              >
                {loggingOut ? "Keluar..." : "Keluar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </header>
  );
}
