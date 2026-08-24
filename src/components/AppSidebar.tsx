import {
  Bell,
  ChartNoAxesCombined,
  ClipboardList,
  History,
  Home,
  LayoutDashboard,
  Map,
  Plus,
  Settings,
} from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
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
import { Separator } from "./ui/separator";

const menuItems = [
  {
    group: "Utama",
    items: [
      {
        label: "Beranda",
        icon: Home,
        to: "/dashboard",
      },
    ],
  },
  {
    group: "Jelajahi",
    items: [
      {
        label: "Peta Risiko",
        icon: Map,
        to: "/dashboard/risk-map",
      },
      {
        label: "Peringatan",
        icon: Bell,
        to: "/dashboard/warnings",
      },
    ],
  },
  {
    group: "Kontribusi",
    items: [
      {
        label: "Buat Laporan",
        icon: Plus,
        to: "/dashboard/report",
      },
      {
        label: "Laporan Saya",
        icon: ClipboardList,
        to: "/dashboard/my-reports",
      },
    ],
  },
  {
    group: "Wawasan",
    items: [
      {
        label: "Dampak Risiko",
        icon: ChartNoAxesCombined,
        to: "/dashboard/impact-analysis",
      },
      {
        label: "Aktivitas",
        icon: History,
        to: "/dashboard/activity",
      },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const isSettingsActive = location.pathname === "/dashboard/settings";

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
                <span className="text-xs text-muted-foreground">
                  Intelijen Lingkungan
                </span>
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
        <Separator />
        <SidebarMenu>
          <SidebarMenuItem>
            <Link to="/dashboard/settings" className="no-underline">
              <SidebarMenuButton
                isActive={isSettingsActive}
                tooltip="Pengaturan"
                className="cursor-pointer"
              >
                <Settings />
                <span>Pengaturan</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
