import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, FileDown, Loader2, Shield, BookOpen, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { gerarFichaEpi } from '@/utils/gerarFichaEpi'
import { toast } from 'sonner'

export default function FichaFuncionario() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: func, isLoading } = useQuery({
    queryKey: ['funcionario', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('funcionarios').select('*').eq('id', id!).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const { data: entregas = [] } = useQuery({
    queryKey: ['entregas-func', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('entregas_epi')
        .select('*, epis(nome, ca)')
        .eq('funcionario_id', id!)
        .order('data_entrega', { ascending: false })
      return data ?? []
    },
    enabled: !!id,
  })

  const { data: treinamentos = [] } = useQuery({
    queryKey: ['trein-func', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('funcionario_treinamentos')
        .select('*, treinamentos(nome, norma_regulamentadora)')
        .eq('funcionario_id', id!)
        .order('data_vencimento', { ascending: false })
      return data ?? []
    },
    enabled: !!id,
  })

  const { data: acidentes = [] } = useQuery({
    queryKey: ['acidentes-func', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('acidentes')
        .select('*')
        .eq('funcionario_id', id!)
        .order('data_ocorrencia', { ascending: false })
      return data ?? []
    },
    enabled: !!id,
  })

  function statusTreinBadge(venc: string) {
    const diff = Math.ceil((new Date(venc).getTime() - Date.now()) / 86400000)
    if (diff < 0) return <Badge variant="danger">Vencido</Badge>
    if (diff <= 30) return <Badge variant="warning">Vence em {diff}d</Badge>
    return <Badge variant="success">Válido</Badge>
  }

  async function handleGerarFicha() {
    if (!func) return
    try {
      gerarFichaEpi(func, entregas)
    } catch {
      toast.error('Erro ao gerar ficha')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!func) return <p className="text-muted-foreground">Funcionário não encontrado.</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/funcionarios')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{func.nome}</h1>
          <p className="text-muted-foreground">{func.cargo} — {func.setor}</p>
        </div>
        <Button onClick={handleGerarFicha} variant="outline">
          <FileDown className="h-4 w-4" />
          Ficha de EPI (PDF)
        </Button>
      </div>

      {/* Dados pessoais */}
      <Card>
        <CardHeader><CardTitle className="text-base">Dados do Funcionário</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              { label: 'Matrícula', value: func.matricula },
              { label: 'CPF', value: func.cpf },
              { label: 'Cargo', value: func.cargo },
              { label: 'Setor', value: func.setor },
              { label: 'Admissão', value: formatDate(func.data_admissao) },
              { label: 'Status', value: <Badge variant={func.ativo ? 'success' : 'secondary'}>{func.ativo ? 'Ativo' : 'Inativo'}</Badge> },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-muted-foreground text-xs mb-0.5">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* EPIs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-blue-500" />
            Histórico de EPIs ({entregas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entregas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma entrega registrada</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {['EPI', 'CA', 'Qtd', 'Entrega', 'Vencimento', 'Status'].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entregas.map((e: { id: string; epis: unknown; quantidade: number; data_entrega: string; data_vencimento?: string; devolvido: boolean }) => (
                    <tr key={e.id} className="border-b last:border-0">
                      <td className="py-2 px-2">{(e.epis as { nome: string } | null)?.nome}</td>
                      <td className="py-2 px-2 font-mono text-xs">{(e.epis as { ca: string } | null)?.ca}</td>
                      <td className="py-2 px-2">{e.quantidade}</td>
                      <td className="py-2 px-2 text-muted-foreground">{formatDate(e.data_entrega)}</td>
                      <td className="py-2 px-2 text-muted-foreground">{e.data_vencimento ? formatDate(e.data_vencimento) : '-'}</td>
                      <td className="py-2 px-2">
                        <Badge variant={e.devolvido ? 'secondary' : 'success'}>
                          {e.devolvido ? 'Devolvido' : 'Em uso'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Treinamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-purple-500" />
            Treinamentos ({treinamentos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {treinamentos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum treinamento registrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {['Treinamento', 'NR', 'Realização', 'Vencimento', 'Status'].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {treinamentos.map((t: { id: string; treinamentos: unknown; data_realizacao: string; data_vencimento: string }) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-2 px-2">{(t.treinamentos as { nome: string } | null)?.nome}</td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">{(t.treinamentos as { norma_regulamentadora?: string } | null)?.norma_regulamentadora ?? '-'}</td>
                      <td className="py-2 px-2 text-muted-foreground">{formatDate(t.data_realizacao)}</td>
                      <td className="py-2 px-2 text-muted-foreground">{formatDate(t.data_vencimento)}</td>
                      <td className="py-2 px-2">{statusTreinBadge(t.data_vencimento)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acidentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Acidentes e Incidentes ({acidentes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {acidentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma ocorrência registrada</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {['Tipo', 'Data', 'Local', 'Status'].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {acidentes.map((a: { id: string; tipo: string; data_ocorrencia: string; local_ocorrencia: string; status: string }) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-2 px-2 text-xs">{a.tipo.replace(/_/g, ' ')}</td>
                      <td className="py-2 px-2 text-muted-foreground">{formatDate(a.data_ocorrencia)}</td>
                      <td className="py-2 px-2 text-muted-foreground">{a.local_ocorrencia}</td>
                      <td className="py-2 px-2">
                        <Badge variant="secondary" className="capitalize">{a.status.replace(/_/g, ' ')}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
