import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { OfflineIndicator } from './OfflineIndicator'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const { sidebarAberta } = useUIStore()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Desktop: margem baseada no estado da sidebar */}
      <div className={cn(
        'transition-all duration-300 ml-0',
        sidebarAberta ? 'lg:ml-64' : 'lg:ml-16'
      )}>
        <Header />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <OfflineIndicator />
    </div>
  )
}
