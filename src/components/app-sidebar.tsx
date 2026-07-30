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
} from '@/components/ui/sidebar'
import { BarChart3, MapPin, AlertTriangle, AlertCircle, Activity, Home, LayoutDashboard } from 'lucide-react'
import { Link, useLocation } from '@tanstack/react-router'

const menuItems = [
  {
    group: 'Main',
    items: [
      { label: 'Dashboard', icon: Home, to: '/dashboard' },
    ]
  },
  {
    group: 'Reports',
    items: [
      { label: 'Total Reports', icon: BarChart3, to: '/dashboard/total-reports' },
      { label: 'Nearby Reports', icon: MapPin, to: '/dashboard/nearby-reports' },
    ]
  },
  {
    group: 'Monitoring',
    items: [
      { label: "Today's Risk", icon: AlertTriangle, to: '/dashboard/todays-risk' },
      { label: 'Active Warning', icon: AlertCircle, to: '/dashboard/active-warning' },
      { label: 'Recent Activity', icon: Activity, to: '/dashboard/recent-activity' },
    ]
  }
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <LayoutDashboard className="size-6 shrink-0" />
          <span className="font-semibold text-base group-data-[collapsible=icon]:hidden">Prita</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.to
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
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
