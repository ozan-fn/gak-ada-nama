import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "#/components/AppSidebar";
import { getSession } from "@/lib/auth.functions";
import DashboardAppHeader from "#/components/DashboardAppHeader";

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
  return (
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
}
