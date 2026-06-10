import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Clock, AlertCircle, FileDown, Calendar, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SkeletonTabela } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { TabelaResponsiva } from '@/components/shared/TabelaResponsiva'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { differenceInDays } from 'date-fns'

interface VencimentoItem {
  id: string
  funcionario_nome: string
  funcionario_matricula: string
  treinamento_nome: string
  treinamento_nr?: string
  data_vencimento: string
  certificado_url?: string
  dias_restantes: number
}

type AbaVencimento = '30dias' | '7dias' | 'vencidos'

export default function VencimentosDashboard() {
  const [aba, setAba] = useState<AbaVencimento>('30dias')

  const { data, isLoading } = useQuery({
    queryKey: ['vencimentos-treinamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funcionario_treinamentos')
        .select(`
          id,
          data_vencimento,
          certificado_url,
          funcionarios (nome, matricula),
          treinamentos (nome, norma_regulamentadora)
        `)
        .order('data_vencimento', { ascending: true })

      if (error) throw error

      const hoje = new Date()
      const processados: VencimentoItem[] = (data || []).map((item: any) => ({
        id: item.id,
        funcionario_nome: item.funcionarios?.nome || 'N/A',
        funcionario_matricula: item.funcionarios?.matricula || 'N/A',
        treinamento_nome: item.treinamentos?.nome || 'N/A',
        treinamento_nr: item.treinamentos?.norma_regulamentadora,
        data_vencimento: item.data_vencimento,
        certificado_url: item.certificado_url,
        dias_restantes: differenceInDays(new Date(item.data_vencimento), hoje),
      }))

      return {
        vencendo30: processados.filter((v) => v.dias_restantes > 7 && v.dias_restantes <= 30),
        vencendo7: processados.filter((v) => v.dias_restantes >= 0 && v.dias_restantes <= 7),
        vencidos: processados.filter((v) => v.dias_restantes < 0),
      }
    },
    refetchInterval: 1000 * 60 * 5, // refaz query a cada 5 minutos
  })

  const vencimentos = data?.[aba === '30dias' ? 'vencendo30' : aba === '7dias' ? 'vencendo7' : 'vencidos'] || []

  const colunas = [
    {
      header: 'Funcionário',
      cell: (v: VencimentoItem) => (
        <div>
          <p className="font-medium">{v.funcionario_nome}</p>
          <p className="text-xs text-muted-foreground">{v.funcionario_matricula}</p>
        </div>
      ),
    },
    {
      header: 'Treinamento',
      cell: (v: VencimentoItem) => (
        <div>
          <p>{v.treinamento_nome}</p>
          {v.treinamento_nr && (
            <p className="text-xs text-muted-foreground">{v.treinamento_nr}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Vencimento',
      cell: (v: VencimentoItem) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(v.data_vencimento)}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (v: VencimentoItem) => {
        if (v.dias_restantes < 0) {
          return (
            <Badge variant="danger">
              Vencido há {Math.abs(v.dias_restantes)} dia(s)
            </Badge>
          )
        }
        if (v.dias_restantes <= 7) {
          return (
            <Badge variant="warning">
              Vence em {v.dias_restantes} dia(s)
            </Badge>
          )
        }
        return (
          <Badge variant="default">
            Vence em {v.dias_restantes} dia(s)
          </Badge>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vencimentos de Treinamentos</h1>
        <p className="text-muted-foreground">
          Acompanhe treinamentos próximos do vencimento
        </p>
      </div>

      {/* Cards de resumo */}
      {!isLoading && data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className={`cursor-pointer transition-all ${
              aba === '30dias' ? 'ring-2 ring-yellow-500' : ''
            }`}
            onClick={() => setAba('30dias')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Vencendo em 30 dias
              </CardTitle>
              <Clock className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.vencendo30.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requer atenção
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              aba === '7dias' ? 'ring-2 ring-orange-500' : ''
            }`}
            onClick={() => setAba('7dias')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Vencendo em 7 dias
              </CardTitle>
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.vencendo7.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ação urgente
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              aba === 'vencidos' ? 'ring-2 ring-red-500' : ''
            }`}
            onClick={() => setAba('vencidos')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Vencidos
              </CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.vencidos.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ação imediata
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de vencimentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {aba === '30dias'
              ? 'Treinamentos vencendo em 30 dias'
              : aba === '7dias'
              ? 'Treinamentos vencendo em 7 dias'
              : 'Treinamentos vencidos'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTabela linhas={5} />
          ) : !data || (data.vencendo30.length === 0 && data.vencendo7.length === 0 && data.vencidos.length === 0) ? (
            <EmptyState
              icon={Clock}
              titulo="Nenhuma participação de treinamento registrada"
              descricao="Registre participações de funcionários em treinamentos para acompanhar vencimentos."
            />
          ) : vencimentos.length === 0 ? (
            <EmptyState
              icon={
                aba === '30dias'
                  ? Clock
                  : aba === '7dias'
                  ? AlertCircle
                  : AlertTriangle
              }
              titulo={
                aba === '30dias'
                  ? 'Nenhum treinamento vencendo em 30 dias'
                  : aba === '7dias'
                  ? 'Nenhum treinamento vencendo em 7 dias'
                  : 'Nenhum treinamento vencido'
              }
              descricao={
                aba === 'vencidos'
                  ? 'Parabéns! Todos os treinamentos estão em dia.'
                  : 'Nenhum treinamento nesta categoria no momento.'
              }
            />
          ) : (
            <TabelaResponsiva
              colunas={colunas}
              dados={vencimentos}
              keyExtractor={(v) => v.id}
              acoes={(v) => (
                v.certificado_url ? (
                  <a href={v.certificado_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" title="Ver certificado">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">Sem certificado</span>
                )
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
