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
import EcoLensLocationSearch from "./ecolens/EcoLensLocationSearch";

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

  const isReportRoute = pathname === "/dashboard/report";

  const getPageTitle = () => {
    const routes: Record<string, string> = {
      "/dashboard": "Beranda",
      "/dashboard/warnings": "Peringatan",
      "/dashboard/report": "Buat Laporan",
      "/dashboard/insights": "Insight",
      "/dashboard/my-reports": "Laporan Saya",
      "/dashboard/activity": "Aktivitas",
      "/dashboard/settings": "Pengaturan",
      "/dashboard/notifications": "Notifikasi",
      "/dashboard/risk-map": "Peta Risiko",
    };

    return routes[pathname] ?? "Beranda";
  };

  const pageTitle = getPageTitle();

  const showBreadcrumb =
    !isRiskMapRoute && !isReportRoute && pathname !== "/dashboard";

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
      className={`
        sticky top-0 z-50
        grid h-14 shrink-0
        grid-cols-[auto_1fr_auto]
        items-center
        bg-background/95
        px-4
        backdrop-blur-md
        transition-[width,height]
        ease-linear
        group-has-data-[collapsible=icon]/sidebar-wrapper:h-12
        isolate
        ${isNoBorderRoute ? "border-b-0" : "border-b border-border"}
      `}
    >
      {/* Left Section */}
      <div className="flex min-w-0 flex-1 items-center gap-2 pr-2 md:flex-initial md:gap-3 md:pr-4">
        {/* Sidebar Trigger */}
        <SidebarTrigger
          className="
            -ml-1
            size-7
            shrink-0
            rounded-lg
            text-muted-foreground
            transition-colors
            hover:bg-sidebar-accent
            hover:text-sidebar-accent-foreground
            focus-visible:ring-2
            focus-visible:ring-ring
          "
        />

        {/* Divider */}
        <div className="hidden h-5 w-px bg-border sm:block" />

        {/* Mobile Page Title */}
        {showBreadcrumb ? (
          <span className="truncate text-sm font-medium text-foreground md:hidden">
            {pageTitle}
          </span>
        ) : !isRiskMapRoute && !isReportRoute ? (
          <span className="truncate text-sm font-medium text-foreground md:hidden">
            {pageTitle}
          </span>
        ) : null}

        {/* Mobile Risk Map Search */}
        {isRiskMapRoute && (
          <div className="min-w-0 flex-1 md:hidden">
            <LocationSearchBar onLocationSelect={handleLocationSearch} />
          </div>
        )}

        {/* Mobile Report Search */}
        {isReportRoute && (
          <div className="min-w-0 flex-1 md:hidden">
            <EcoLensLocationSearch />
          </div>
        )}
      </div>

      {/* Center Section */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          hidden
          -translate-x-1/2
          items-center
          justify-center
          md:flex
        "
      >
        <div
          className={`
            pointer-events-auto
            ${
              isRiskMapRoute || isReportRoute
                ? "w-[320px] lg:w-105 xl:w-125"
                : "w-auto"
            }
          `}
        >
          {isRiskMapRoute ? (
            <LocationSearchBar onLocationSelect={handleLocationSearch} />
          ) : isReportRoute ? (
            <EcoLensLocationSearch />
          ) : (
            <span className="whitespace-nowrap text-sm font-medium text-foreground">
              {pageTitle}
            </span>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="ml-4 flex items-center justify-end gap-2">
        <AQIIndicator />

        <NotificationBar />

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-border" />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="
              flex items-center gap-2
              rounded-lg
              bg-muted/60
              px-1.5 py-1
              outline-none
              transition-colors
              hover:bg-muted
              focus-visible:ring-2
              focus-visible:ring-ring
            "
          >
            <Avatar className="size-7 rounded-lg">
              <AvatarImage
                src={user?.image ?? undefined}
                alt={user?.name ?? "User"}
              />

              <AvatarFallback
                className="
                  rounded-lg
                  bg-foreground
                  text-[11px]
                  font-semibold
                  text-background
                "
                suppressHydrationWarning
              >
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          {/* Dropdown */}
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="
              w-56
              border-border
              bg-popover
              text-popover-foreground
            "
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="truncate text-xs font-medium leading-none text-foreground">
                    {user?.name ?? "User"}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {user?.email ?? ""}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-border" />

            {/* Profile */}
            <DropdownMenuItem
              onClick={() =>
                navigate({
                  to: "/dashboard/settings",
                })
              }
              className="
                text-foreground
                hover:bg-accent
                hover:text-accent-foreground
              "
            >
              <User className="mr-2 size-4 text-muted-foreground" />
              Profil
            </DropdownMenuItem>

            {/* Settings */}
            <DropdownMenuItem
              onClick={() =>
                navigate({
                  to: "/dashboard/settings",
                })
              }
              className="
                text-foreground
                hover:bg-accent
                hover:text-accent-foreground
              "
            >
              <Settings className="mr-2 size-4 text-muted-foreground" />
              Pengaturan
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border" />

            {/* Logout */}
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setShowLogoutConfirm(true)}
              className="
                text-destructive
                hover:bg-destructive/10
              "
            >
              <LogOut className="mr-2 size-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Logout Confirmation */}
        <AlertDialog
          open={showLogoutConfirm}
          onOpenChange={setShowLogoutConfirm}
        >
          <AlertDialogContent
            className="
              border-border
              bg-background
              text-foreground
              sm:max-w-md
            "
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                Keluar dari akun?
              </AlertDialogTitle>

              <AlertDialogDescription className="leading-relaxed text-muted-foreground">
                Anda akan keluar dari sesi ini dan perlu login kembali untuk
                mengakses dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={loggingOut}
                className="
                  border-border
                  bg-background
                  text-foreground
                  hover:bg-accent
                  hover:text-accent-foreground
                "
              >
                Batal
              </AlertDialogCancel>

              <AlertDialogAction
                onClick={handleLogout}
                disabled={loggingOut}
                className="
                  bg-destructive
                  text-destructive-foreground
                  hover:bg-destructive/90
                  focus:ring-destructive
                "
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
