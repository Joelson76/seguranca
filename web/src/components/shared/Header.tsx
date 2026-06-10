import { Bell, Moon, Sun, LogOut, User, Check, Package, BookOpen, AlertTriangle, FileText, Menu } from 'lucide-react'
import { Breadcrumb } from './Breadcrumb'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { useNotificacoes, type Notificacao } from '@/hooks/useNotificacoes'
import { formatDateTime } from '@/lib/utils'

const ICONES_TIPO: Record<string, React.ElementType> = {
  estoque: Package,
  treinamento: BookOpen,
  acidente: AlertTriangle,
  documento: FileText,
}

function NotificacaoItem({ n, onLer }: { n: Notificacao; onLer: (id: string) => void }) {
  const Icone = ICONES_TIPO[n.tipo] ?? Bell
  return (
    <div className="flex gap-3 p-3 hover:bg-muted/50 transition-colors">
      <div className="bg-primary/10 rounded-full p-1.5 shrink-0 h-7 w-7 flex items-center justify-center">
        <Icone className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-none">{n.titulo}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.mensagem}</p>
        <p className="text-xs text-muted-foreground mt-1">{formatDateTime(n.criado_em)}</p>
      </div>
      <button
        onClick={() => onLer(n.id)}
        className="shrink-0 text-muted-foreground hover:text-primary"
        title="Marcar como lida"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function Header() {
  const { tema, toggleTema, toggleSidebar } = useUIStore()
  const { perfil } = useAuthStore()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [sinoAberto, setSinoAberto] = useState(false)
  const sinoRef = useRef<HTMLDivElement>(null)

  const { notificacoes, naoLidas, marcarLida, marcarTodasLidas } = useNotificacoes()

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sinoRef.current && !sinoRef.current.contains(e.target as Node)) {
        setSinoAberto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <header className="h-16 border-b border-border bg-white dark:bg-gray-900 flex items-center px-4 md:px-6 gap-3">
      {/* Hambúrguer mobile */}
      <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex-1 min-w-0">
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTema}>
          {tema === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        {/* Sino de notificações */}
        <div className="relative" ref={sinoRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setSinoAberto(!sinoAberto)}
          >
            <Bell className="h-4 w-4" />
            {naoLidas > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {naoLidas > 9 ? '9+' : naoLidas}
              </span>
            )}
          </Button>

          {sinoAberto && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold">
                  Notificações {naoLidas > 0 && <Badge variant="destructive" className="ml-2">{naoLidas}</Badge>}
                </p>
                {naoLidas > 0 && (
                  <button
                    onClick={marcarTodasLidas}
                    className="text-xs text-primary hover:underline"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-border">
                {notificacoes.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Nenhuma notificação
                  </div>
                ) : (
                  notificacoes.filter(n => !n.lida).slice(0, 10).map((n) => (
                    <NotificacaoItem key={n.id} n={n} onLer={(id) => { marcarLida(id); setSinoAberto(false) }} />
                  ))
                )}
              </div>
              {notificacoes.length > 0 && (
                <div className="px-4 py-3 border-t border-border text-center">
                  <button
                    onClick={() => { navigate('/app/notificacoes'); setSinoAberto(false) }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Ver todas as notificações
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="bg-primary/10 rounded-full p-1.5">
            <User className="h-4 w-4 text-primary" />
          </div>
          {perfil && (
            <div className="hidden sm:block">
              <p className="text-xs font-medium">{perfil.nome}</p>
              <p className="text-xs text-muted-foreground capitalize">{perfil.perfil.replace(/_/g, ' ')}</p>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
