import { useState } from 'react'
import { Plus, BookOpen, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SkeletonTabela } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { TabelaResponsiva } from '@/components/shared/TabelaResponsiva'
import { useTreinamentos, type Treinamento } from '@/hooks/useTreinamentos'
import TreinamentoForm from './TreinamentoForm'

export default function TreinamentosList() {
  const [modalAberto, setModalAberto] = useState(false)
  const [treinamentoEdit, setTreinamentoEdit] = useState<Treinamento | null>(null)

  const { data: treinamentos = [], isLoading } = useTreinamentos()

  function abrirEdicao(treinamento: Treinamento) {
    setTreinamentoEdit(treinamento)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setTreinamentoEdit(null)
  }

  const colunas = [
    {
      header: 'Nome do Treinamento',
      cell: (t: Treinamento) => (
        <div>
          <p className="font-medium">{t.nome}</p>
          {t.descricao && (
            <p className="text-xs text-muted-foreground mt-0.5">{t.descricao}</p>
          )}
        </div>
      ),
    },
    {
      header: 'NR',
      hideMobile: true,
      cell: (t: Treinamento) => (
        <span className="text-sm text-muted-foreground">
          {t.norma_regulamentadora || '—'}
        </span>
      ),
    },
    {
      header: 'Carga Horária',
      cell: (t: Treinamento) => (
        <Badge variant="outline">{t.carga_horaria}h</Badge>
      ),
    },
    {
      header: 'Validade',
      cell: (t: Treinamento) => (
        <Badge variant="outline">{t.validade_meses} meses</Badge>
      ),
    },
    {
      header: 'Status',
      cell: (t: Treinamento) => (
        <Badge variant={t.ativo ? 'success' : 'secondary'}>
          {t.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tipos de Treinamento</h1>
          <p className="text-muted-foreground">
            Gerencie os tipos de treinamento e suas configurações
          </p>
        </div>
        <Button onClick={() => setModalAberto(true)}>
          <Plus className="h-4 w-4" />
          Novo Treinamento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isLoading ? 'Carregando...' : `${treinamentos.length} tipo(s) cadastrado(s)`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTabela linhas={5} />
          ) : treinamentos.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              titulo="Nenhum treinamento cadastrado"
              descricao="Comece cadastrando os tipos de treinamento que sua empresa oferece"
              acao={
                <Button onClick={() => setModalAberto(true)}>
                  <Plus className="h-4 w-4" />
                  Cadastrar primeiro treinamento
                </Button>
              }
            />
          ) : (
            <TabelaResponsiva
              colunas={colunas}
              dados={treinamentos}
              keyExtractor={(t) => t.id}
              acoes={(t) => (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => abrirEdicao(t)}
                  title="Editar treinamento"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              )}
            />
          )}
        </CardContent>
      </Card>

      <TreinamentoForm
        aberto={modalAberto}
        onFechar={fecharModal}
        treinamento={treinamentoEdit}
      />
    </div>
  )
}
