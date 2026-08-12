import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  BarChart3,
  MapPin,
  AlertTriangle,
  AlertCircle,
  Activity,
  Home,
  LayoutDashboard,
} from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { DashboardNav } from "./DashboardNav";

const menuItems = [
  {
    group: "Main",
    items: [{ label: "Dashboard", icon: Home, to: "/dashboard" }],
  },
  {
    group: "Reports",
    items: [
      {
        label: "Total Reports",
        icon: BarChart3,
        to: "/dashboard/total-reports",
      },
      {
        label: "Nearby Reports",
        icon: MapPin,
        to: "/dashboard/nearby-reports",
      },
    ],
  },
  {
    group: "Monitoring",
    items: [
      {
        label: "Today's Risk",
        icon: AlertTriangle,
        to: "/dashboard/todays-risk",
      },
      {
        label: "Active Warning",
        icon: AlertCircle,
        to: "/dashboard/active-warning",
      },
      {
        label: "Recent Activity",
        icon: Activity,
        to: "/dashboard/recent-activity",
      },
    ],
  },
];

type UserData = {
  name: string;
  email: string;
  avatar?: string | null;
};

type AppSidebarProps = {
  user?: UserData;
};

export function AppSidebar({ user }: AppSidebarProps) {
  const location = useLocation();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Prita">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <LayoutDashboard className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Prita</span>
                <span className="text-xs text-muted-foreground">Dashboard</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  return (
                    <SidebarMenuItem key={item.label}>
                      <Link to={item.to} className="no-underline">
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.label}
                          className="cursor-pointer"
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        {user && (
          <DashboardNav
            user={{
              name: user.name,
              email: user.email,
              avatar: user.avatar ?? undefined,
            }}
          />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
