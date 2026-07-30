import { createFileRoute, Outlet } from '@tanstack/react-router'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { AppSidebar } from '@/components/app-sidebar'
import { authClient } from '@/lib/auth-client'
import { useNavigate } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
})

function ProtectedLayout() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authClient.signOut()
      navigate({ to: '/login' })
    } catch (err) {
      console.error('Logout error:', err)
      navigate({ to: '/login' })
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex items-center justify-between border-b px-6 py-4 gap-4">
          <SidebarTrigger />
          <Button variant="destructive" size="sm" onClick={handleLogout}>
            <LogOut className="size-4 mr-2" />
            Logout
          </Button>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
