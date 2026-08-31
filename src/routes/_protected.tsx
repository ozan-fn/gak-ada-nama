import {
  createFileRoute,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarInset } from "#/components/ui/sidebar";
import { AppSidebar } from "#/components/AppSidebar";
import { getSession } from "#/lib/auth.functions";
import DashboardAppHeader from "#/components/DashboardAppHeader";
import { EcoLensLocationProvider } from "#/contexts/EcoLensLocationContext";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location }) => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    return { user: session.user };
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { pathname } = useLocation();
  const isReportRoute = pathname === "/dashboard/report";

  // Apply theme immediately on mount to prevent flash
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    const isDark = theme === "dark";

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const content = (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <DashboardAppHeader />

        <main className="min-h-0 flex-1 overflow-y-auto bg-neutral-50/40 dark:bg-neutral-950/40">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );

  return isReportRoute ? (
    <EcoLensLocationProvider>{content}</EcoLensLocationProvider>
  ) : (
    content
  );
}
