import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Shield, Package, BookOpen,
  AlertTriangle, FileText, BarChart3, Settings,
  ChevronLeft, ChevronRight, Building2, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'

const navItems = [
  { href: '/app/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/app/funcionarios',  icon: Users,           label: 'Funcionários' },
  { href: '/app/epis',          icon: Shield,          label: 'EPIs' },
  { href: '/app/entregas',      icon: Package,         label: 'Entregas de EPI' },
  { href: '/app/treinamentos',  icon: BookOpen,        label: 'Treinamentos' },
  { href: '/app/acidentes',     icon: AlertTriangle,   label: 'Acidentes' },
  { href: '/app/documentos',    icon: FileText,        label: 'Documentos' },
  { href: '/app/relatorios',    icon: BarChart3,       label: 'Relatórios' },
  { href: '/app/configuracoes', icon: Settings,        label: 'Configurações' },
]

function NavItem({ href, icon: Icon, label, collapsed }: {
  href: string; icon: React.ElementType; label: string; collapsed: boolean
}) {
  return (
    <NavLink
      to={href}
      title={collapsed ? label : undefined}
      className={({ isActive }) => cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

function SidebarContent({ mobile = false, sidebarAberta, toggleSidebar, setSidebarAberta, perfil }: {
  mobile?: boolean
  sidebarAberta: boolean
  toggleSidebar: () => void
  setSidebarAberta: (aberta: boolean) => void
  perfil: { perfil: string } | null
}) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border shrink-0">
        <div className="bg-primary rounded-lg p-1.5 shrink-0">
          <Shield className="h-5 w-5 text-white" />
        </div>
        {(sidebarAberta || mobile) && (
          <span className="ml-2 font-bold text-gray-900 dark:text-white text-sm truncate">SafeTrack</span>
        )}
        {mobile ? (
          <button onClick={() => setSidebarAberta(false)} className="ml-auto p-1 rounded-md hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={toggleSidebar} className="ml-auto p-1 rounded-md hover:bg-muted text-muted-foreground">
            {sidebarAberta ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} collapsed={!sidebarAberta && !mobile} />
        ))}
        {perfil?.perfil === 'super_admin' && (
          <NavItem href="/admin" icon={Building2} label="Super Admin" collapsed={!sidebarAberta && !mobile} />
        )}
      </nav>
    </>
  )
}

export function Sidebar() {
  const { sidebarAberta, toggleSidebar, setSidebarAberta } = useUIStore()
  const { perfil } = useAuthStore()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-border transition-all duration-300 flex-col hidden lg:flex',
        sidebarAberta ? 'w-64' : 'w-16'
      )}>
        <SidebarContent
          sidebarAberta={sidebarAberta}
          toggleSidebar={toggleSidebar}
          setSidebarAberta={setSidebarAberta}
          perfil={perfil}
        />
      </aside>

      {/* Mobile overlay */}
      {sidebarAberta && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarAberta(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        'fixed left-0 top-0 z-40 h-screen w-72 bg-white dark:bg-gray-900 border-r border-border flex flex-col lg:hidden transition-transform duration-300',
        sidebarAberta ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent
          mobile
          sidebarAberta={sidebarAberta}
          toggleSidebar={toggleSidebar}
          setSidebarAberta={setSidebarAberta}
          perfil={perfil}
        />
      </aside>
    </>
  )
}
