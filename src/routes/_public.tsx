import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router'
import { Header } from '#/components/Header'
import { Footer } from '#/components/Footer'

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
})

function PublicLayout() {
  const location = useLocation()
  const isLiveMap = location.pathname === '/livemap'

  return (
    <div className="relative">
      <Header />
      <Outlet />
      {!isLiveMap && <Footer />}
    </div>
  )
}
