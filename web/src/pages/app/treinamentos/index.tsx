import { useState } from 'react'
import { Plus, BookOpen, AlertTriangle, LayoutGrid } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTreinamentos, useParticipacoes } from '@/hooks/useTreinamentos'
import ParticipacaoForm from './ParticipacaoForm'

export default function TreinamentosHub() {
  const navigate = useNavigate()
  const [modalParticipacao, setModalParticipacao] = useState(false)

  const { data: treinamentos = [] } = useTreinamentos()
  const { data: participacoes = [] } = useParticipacoes(0, 100)

  const hoje = new Date()
  const vencendoEm30 = participacoes.filter((p) => {
    const diff = Math.ceil((new Date(p.data_vencimento).getTime() - hoje.getTime()) / 86400000)
    return diff > 0 && diff <= 30
  }).length

  const vencidos = participacoes.filter((p) => {
    const diff = Math.ceil((new Date(p.data_vencimento).getTime() - hoje.getTime()) / 86400000)
    return diff < 0
  }).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Treinamentos SST</h1>
          <p className="text-muted-foreground">
            Gerencie treinamentos, participações e vencimentos
          </p>
        </div>
        <Button onClick={() => setModalParticipacao(true)}>
          <Plus className="h-4 w-4" />
          Registrar Participação
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/treinamentos/tipos')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Tipos de Treinamento
            </CardTitle>
            <BookOpen className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treinamentos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tipos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/treinamentos/vencimentos')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Vencimentos
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vencendoEm30}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Vencendo em 30 dias
            </p>
            {vencidos > 0 && (
              <Badge variant="danger" className="mt-2">
                {vencidos} vencido(s)
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/treinamentos/matriz')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Matriz de Treinamentos
            </CardTitle>
            <LayoutGrid className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participacoes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Participações registradas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Atalhos rápidos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acesso Rápido</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate('/treinamentos/tipos')}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Gerenciar Tipos de Treinamento
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate('/treinamentos/vencimentos')}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Acompanhar Vencimentos
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate('/treinamentos/matriz')}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Ver Matriz Completa
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => setModalParticipacao(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Registrar Nova Participação
          </Button>
        </CardContent>
      </Card>

      <ParticipacaoForm
        aberto={modalParticipacao}
        onFechar={() => setModalParticipacao(false)}
      />
    </div>
  )
}
