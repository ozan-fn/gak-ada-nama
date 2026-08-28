import {
  Bell,
  ClipboardList,
  History,
  Home,
  Map,
  Newspaper,
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "./ui/separator";
import logoBlue from "@/assets/images/logo-blue.png";

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
      {
        label: "Insight",
        icon: Newspaper,
        to: "/dashboard/insights",
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
  const { setOpenMobile, isMobile } = useSidebar();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="offcanvas" className="md:w-64 w-64">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link to="/dashboard" className="no-underline">
              <SidebarMenuButton size="lg" tooltip="Prita">
                <img src={logoBlue} alt="Prita Logo" className="h-6" />
              </SidebarMenuButton>
            </Link>
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
                      <Link
                        to={item.to}
                        className="no-underline"
                        onClick={handleNavClick}
                      >
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
            <Link
              to="/dashboard/settings"
              className="no-underline"
              onClick={handleNavClick}
            >
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
