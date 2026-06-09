import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props { children: ReactNode }
interface State { erro: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null }

  static getDerivedStateFromError(erro: Error): State {
    return { erro }
  }

  render() {
    if (!this.state.erro) return this.props.children
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 text-center">
        <div className="bg-red-100 dark:bg-red-950 rounded-full p-4">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-1">Algo deu errado</h2>
          <p className="text-muted-foreground text-sm max-w-md">{this.state.erro.message}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4" /> Recarregar página
        </Button>
      </div>
    )
  }
}
