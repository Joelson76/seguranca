import { useNavigate } from 'react-router-dom'
import { Shield, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 text-center">
      <div className="bg-primary/10 rounded-full p-5">
        <Shield className="h-10 w-10 text-primary" />
      </div>
      <div>
        <h1 className="text-6xl font-bold text-muted-foreground/30">404</h1>
        <h2 className="text-xl font-semibold mt-2">Página não encontrada</h2>
        <p className="text-muted-foreground mt-1">A página que você procura não existe ou foi removida.</p>
      </div>
      <Button onClick={() => navigate('/app/dashboard')} variant="outline">
        <ArrowLeft className="h-4 w-4" />
        Voltar ao dashboard
      </Button>
    </div>
  )
}
