import { useQuery } from '@tanstack/react-query'
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

type Status = 'valido' | 'vencendo' | 'vencido' | 'nao_realizado'

function StatusIcon({ status }: { status: Status }) {
  if (status === 'valido') return <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
  if (status === 'vencendo') return <Clock className="h-4 w-4 text-yellow-500 mx-auto" />
  if (status === 'vencido') return <XCircle className="h-4 w-4 text-red-500 mx-auto" />
  return <span className="text-muted-foreground text-xs block text-center">—</span>
}

export default function MatrizTreinamentos() {
  const { data, isLoading } = useQuery({
    queryKey: ['matriz-treinamentos'],
    queryFn: async () => {
      const [{ data: funcs }, { data: treinamentos }, { data: participacoes }] = await Promise.all([
        supabase.from('funcionarios').select('id, nome, matricula, cargo').eq('ativo', true).order('nome').limit(50),
        supabase.from('treinamentos').select('id, nome, norma_regulamentadora').eq('ativo', true).order('nome'),
        supabase.from('funcionario_treinamentos').select('funcionario_id, treinamento_id, data_vencimento, status').order('data_vencimento', { ascending: false }),
      ])
      return { funcs: funcs ?? [], treinamentos: treinamentos ?? [], participacoes: participacoes ?? [] }
    },
  })

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-[300px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  const { funcs = [], treinamentos = [], participacoes = [] } = data ?? {}

  // Monta mapa: funcionario_id -> treinamento_id -> status mais recente
  const mapa: Record<string, Record<string, { status: string; vencimento: string }>> = {}
  for (const p of participacoes as any[]) {
    if (!mapa[p.funcionario_id]) mapa[p.funcionario_id] = {}
    if (!mapa[p.funcionario_id][p.treinamento_id]) {
      mapa[p.funcionario_id][p.treinamento_id] = { status: p.status, vencimento: p.data_vencimento }
    }
  }

  function getStatus(funcId: string, treinId: string): Status {
    const entry = mapa[funcId]?.[treinId]
    if (!entry) return 'nao_realizado'
    if (entry.status === 'vencido') return 'vencido'
    const diff = Math.ceil((new Date(entry.vencimento).getTime() - Date.now()) / 86400000)
    if (diff <= 30) return 'vencendo'
    return 'valido'
  }

  const totaisPorFunc = funcs.map((f: any) => ({
    ...f,
    validos: treinamentos.filter((t: any) => getStatus(f.id, t.id) === 'valido').length,
    total: treinamentos.length,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Matriz de Treinamentos</h1>
        <p className="text-muted-foreground">Visão geral de conformidade por funcionário e treinamento</p>
      </div>

      {/* Legenda */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Válido</div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-yellow-500" /> Vencendo em 30 dias</div>
            <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" /> Vencido</div>
            <div className="flex items-center gap-2 text-muted-foreground">— Não realizado</div>
          </div>
        </CardContent>
      </Card>

      {treinamentos.length === 0 || funcs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Cadastre funcionários e treinamentos para visualizar a matriz
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{funcs.length} funcionário(s) × {treinamentos.length} treinamento(s)</CardTitle>
            <CardDescription>Mostrando os 50 primeiros funcionários ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2 border font-medium bg-muted/50 min-w-[160px] sticky left-0 z-10">
                      Funcionário
                    </th>
                    {treinamentos.map((t: any) => (
                      <th key={t.id} className="p-2 border font-medium bg-muted/50 text-center max-w-[80px]">
                        <div className="truncate max-w-[80px]" title={t.nome}>{t.norma_regulamentadora ?? t.nome.split(' ')[0]}</div>
                      </th>
                    ))}
                    <th className="p-2 border font-medium bg-muted/50 text-center">Conformidade</th>
                  </tr>
                </thead>
                <tbody>
                  {totaisPorFunc.map((f: any) => {
                    const pct = f.total > 0 ? Math.round((f.validos / f.total) * 100) : 0
                    return (
                      <tr key={f.id} className="hover:bg-muted/20">
                        <td className="p-2 border sticky left-0 bg-background z-10">
                          <div className="font-medium truncate max-w-[150px]" title={f.nome}>{f.nome}</div>
                          <div className="text-muted-foreground">{f.matricula}</div>
                        </td>
                        {treinamentos.map((t: any) => {
                          const status = getStatus(f.id, t.id)
                          const entry = mapa[f.id]?.[t.id]
                          return (
                            <td key={t.id} className="p-2 border text-center" title={entry ? `Vence: ${formatDate(entry.vencimento)}` : 'Não realizado'}>
                              <StatusIcon status={status} />
                            </td>
                          )
                        })}
                        <td className="p-2 border text-center">
                          <Badge variant={pct === 100 ? 'success' : pct >= 70 ? 'warning' : 'danger'}>
                            {pct}%
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
