import { useLocation } from "@tanstack/react-router";
import { SidebarTrigger } from "./ui/sidebar";
import { Bell, Search, Wind } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useSession } from "#/lib/auth-client";

export default function DashboardAppHeader() {
  const { data: session } = useSession();
  const { pathname } = useLocation();
  const user = session?.user;

  const isNoBorderRoute =
    pathname === "/dashboard" || pathname === "/dashboard/risk-map";

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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

      {/* Grid 2 (Tengah): Search Location */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari lokasi..."
            className="h-9 w-full rounded-full border border-neutral-200 bg-neutral-50/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:border-transparent dark:bg-neutral-900/50 dark:border-neutral-800 dark:focus-visible:ring-neutral-700"
          />
        </div>
      </div>

      {/* Grid 3 (Kanan): AQI Icon, Notification, Avatar */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100/60 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900 transition-colors dark:bg-neutral-800/60 dark:text-neutral-400 dark:hover:bg-neutral-700/80 dark:hover:text-neutral-100"
        >
          <Wind className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900" />
        </button>
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
            <AvatarFallback className="rounded-lg bg-foreground text-[11px] font-semibold text-background">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  );
}
