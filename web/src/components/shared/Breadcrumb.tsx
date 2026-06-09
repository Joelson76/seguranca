import { useLocation, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

const ROTAS: Record<string, string> = {
  dashboard: 'Dashboard',
  funcionarios: 'Funcionários',
  epis: 'EPIs',
  entregas: 'Entregas de EPI',
  treinamentos: 'Treinamentos',
  acidentes: 'Acidentes',
  documentos: 'Documentos',
  relatorios: 'Relatórios',
  matriz: 'Matriz de Treinamentos',
  configuracoes: 'Configurações',
  admin: 'Super Admin',
  onboarding: 'Configuração inicial',
}

export function Breadcrumb() {
  const { pathname } = useLocation()
  const segmentos = pathname.split('/').filter(Boolean)

  if (segmentos.length === 0) return null

  const migalhas = segmentos.map((seg, idx) => ({
    label: ROTAS[seg] ?? (seg.length === 36 ? 'Detalhes' : seg),
    href: '/' + segmentos.slice(0, idx + 1).join('/'),
    atual: idx === segmentos.length - 1,
  }))

  return (
    <nav className="flex items-center gap-1 text-xs text-muted-foreground">
      {migalhas.map((m, i) => (
        <span key={m.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {m.atual ? (
            <span className="text-foreground font-medium">{m.label}</span>
          ) : (
            <Link to={m.href} className="hover:text-foreground transition-colors">{m.label}</Link>
          )}
        </span>
      ))}
    </nav>
  )
}
