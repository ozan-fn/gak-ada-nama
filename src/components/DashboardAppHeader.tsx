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

  const getPageTitle = () => {
    const routes: Record<string, string> = {
      "/dashboard": "Beranda",
      "/dashboard/warning": "Peringatan",
      "/dashboard/profile": "Profil",
      "/dashboard/settings": "Pengaturan",
      "/dashboard/notifications": "Notifikasi",
    };

    return routes[pathname] ?? "Beranda";
  };

  const pageTitle = getPageTitle();

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
        relative z-50 grid h-14 shrink-0
        grid-cols-[auto_1fr_auto]
        items-center
        bg-white/80 px-4
        backdrop-blur-md
        transition-[width,height]
        ease-linear
        group-has-data-[collapsible=icon]/sidebar-wrapper:h-12
        dark:bg-neutral-900/80
        ${
          isNoBorderRoute
            ? "border-b-0"
            : "border-b border-neutral-200/60 dark:border-neutral-800/60"
        }
      `}
    >
      <div className="flex min-w-0 items-center gap-3 pr-4">
        <SidebarTrigger className="-ml-1 size-7 shrink-0 rounded-lg" />

        <div className="hidden h-5 w-px bg-border sm:block" />

        {!isRiskMapRoute && (
          <span className="truncate text-sm font-medium text-neutral-700 md:hidden dark:text-neutral-200">
            {pageTitle}
          </span>
        )}
      </div>

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
            ${isRiskMapRoute ? "w-[320px] lg:w-105 xl:w-125" : "w-auto"}
          `}
        >
          {isRiskMapRoute ? (
            <LocationSearchBar onLocationSelect={handleLocationSearch} />
          ) : (
            <span className="whitespace-nowrap text-sm font-medium text-neutral-700 dark:text-neutral-200">
              {pageTitle}
            </span>
          )}
        </div>
      </div>

      <div className="ml-4 flex items-center justify-end gap-2">
        <AQIIndicator />

        <NotificationBar />

        <div className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="
              flex items-center gap-2
              rounded-lg
              bg-neutral-100/60
              px-1.5 py-1
              outline-none
              transition-colors
              hover:bg-neutral-200/80
              focus-visible:ring-2
              focus-visible:ring-emerald-500/50
              dark:bg-neutral-800/60
              dark:hover:bg-neutral-700/80
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

          <DropdownMenuContent align="end" sideOffset={8} className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="truncate text-xs font-medium leading-none">
                    {user?.name ?? "User"}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {user?.email ?? ""}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => navigate({ to: "/dashboard/profile" })}
            >
              <User className="mr-2 size-4" />
              Profil
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => navigate({ to: "/dashboard/settings" })}
            >
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

        {/* Logout Confirmation */}
        <AlertDialog
          open={showLogoutConfirm}
          onOpenChange={setShowLogoutConfirm}
        >
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Keluar dari akun?</AlertDialogTitle>

              <AlertDialogDescription className="leading-relaxed">
                Anda akan keluar dari sesi ini dan perlu login kembali untuk
                mengakses dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={loggingOut}>Batal</AlertDialogCancel>

              <AlertDialogAction
                onClick={handleLogout}
                disabled={loggingOut}
                className="
                  bg-red-600
                  text-white
                  hover:bg-red-700
                  focus:ring-red-600
                  dark:bg-red-500
                  dark:hover:bg-red-600
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
