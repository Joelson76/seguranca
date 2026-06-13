import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface Props {
  children: React.ReactNode
  perfisPermitidos?: string[]
}

export function ProtectedRoute({ children, perfisPermitidos }: Props) {
  const { user, perfil, carregando } = useAuth()
  const [timeout, setTimeout] = useState(false)

  // Timeout de segurança de 10 segundos
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (carregando) {
        console.error('Timeout na autenticação - redirecionando para login')
        setTimeout(true)
      }
    }, 10000)

    return () => clearTimeout(timer)
  }, [carregando])

  if (timeout) {
    return <Navigate to="/login" replace />
  }

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (!perfil) return <Navigate to="/onboarding" replace />

  if (perfisPermitidos && !perfisPermitidos.includes(perfil.perfil)) {
    return <Navigate to="/app/dashboard" replace />
  }

  return <>{children}</>
}
