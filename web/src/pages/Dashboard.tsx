import { useQuery } from '@tanstack/react-query'
import { Shield, Package, Users, AlertTriangle, AlertCircle, Clock, TrendingUp } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/shared/StatCard'
import { SkeletonDashboard } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { addDays, format, subMonths, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Dashboard() {
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const inicioMes = startOfMonth(new Date()).toISOString()
      const [
        { count: funcionarios },
        { data: epis },
        { count: entregas },
        { count: acidentes },
      ] = await Promise.all([
        supabase.from('funcionarios').select('*', { count: 'exact', head: true }).eq('ativo', true),
        supabase.from('epis').select('quantidade_atual').eq('ativo', true),
        supabase.from('entregas_epi').select('*', { count: 'exact', head: true }).gte('data_entrega', inicioMes),
        supabase.from('acidentes').select('*', { count: 'exact', head: true }).gte('data_ocorrencia', inicioMes.split('T')[0]),
      ])
      const estoqueTotal = epis?.reduce((acc: number, e: { quantidade_atual: number }) => acc + (e.quantidade_atual ?? 0), 0) ?? 0
      return { funcionarios: funcionarios ?? 0, estoqueTotal, entregas: entregas ?? 0, acidentes: acidentes ?? 0 }
    },
    refetchInterval: 60_000,
  })

  const { data: episCriticos = [] } = useQuery({
    queryKey: ['epis-criticos'],
    queryFn: async () => {
      const { data } = await supabase.from('epis').select('id, nome, quantidade_atual, estoque_minimo').eq('ativo', true)
      return (data ?? []).filter((e: { quantidade_atual: number; estoque_minimo: number }) => e.quantidade_atual <= e.estoque_minimo).slice(0, 5)
    },
  })

  const { data: treinamentosVencendo = [] } = useQuery({
    queryKey: ['treinamentos-vencendo-dash'],
    queryFn: async () => {
      const em7dias = addDays(new Date(), 7).toISOString().split('T')[0]
      const { data } = await supabase
        .from('funcionario_treinamentos')
        .select('id, data_vencimento, funcionarios(nome), treinamentos(nome)')
        .lte('data_vencimento', em7dias)
        .gte('data_vencimento', new Date().toISOString().split('T')[0])
        .order('data_vencimento')
        .limit(5)
      return data ?? []
    },
  })

  const { data: documentosVencendo = [] } = useQuery({
    queryKey: ['documentos-vencendo-dash'],
    queryFn: async () => {
      const em60dias = addDays(new Date(), 60).toISOString().split('T')[0]
      const { data } = await supabase
        .from('documentos')
        .select('id, nome, tipo, validade')
        .not('validade', 'is', null)
        .lte('validade', em60dias)
        .gte('validade', new Date().toISOString().split('T')[0])
        .order('validade')
        .limit(5)
      return data ?? []
    },
  })

  const { data: casVencendo = [] } = useQuery({
    queryKey: ['cas-vencendo-dash'],
    queryFn: async () => {
      const em30dias = addDays(new Date(), 30).toISOString().split('T')[0]
      const { data } = await supabase
        .from('epis')
        .select('id, nome, ca, validade_ca')
        .lte('validade_ca', em30dias)
        .gte('validade_ca', new Date().toISOString().split('T')[0])
        .eq('ativo', true)
        .order('validade_ca')
        .limit(5)
      return data ?? []
    },
  })

  const { data: acidentes12m = [] } = useQuery({
    queryKey: ['acidentes-12m'],
    queryFn: async () => {
      const { data } = await supabase
        .from('acidentes')
        .select('data_ocorrencia, tipo')
        .gte('data_ocorrencia', subMonths(new Date(), 11).toISOString().split('T')[0])
        .order('data_ocorrencia')
      return data ?? []
    },
  })

  const { data: topEpis = [] } = useQuery({
    queryKey: ['top-epis'],
    queryFn: async () => {
      const { data } = await supabase
        .from('entregas_epi')
        .select('epi_id, epis(nome), quantidade')
        .gte('data_entrega', startOfMonth(new Date()).toISOString())
      if (!data) return []
      const agrupado: Record<string, { nome: string; total: number }> = {}
      for (const e of data) {
        const id = e.epi_id
        const epiObj = Array.isArray(e.epis) ? e.epis[0] : e.epis
        const nome = (epiObj as { nome: string } | null)?.nome ?? 'EPI'
        if (!agrupado[id]) agrupado[id] = { nome, total: 0 }
        agrupado[id].total += e.quantidade
      }
      return Object.values(agrupado).sort((a, b) => b.total - a.total).slice(0, 5)
    },
  })

  // Montar dados do gráfico de acidentes por mês
  const dadosGrafico = Array.from({ length: 12 }, (_, i) => {
    const mes = subMonths(new Date(), 11 - i)
    const label = format(mes, 'MMM', { locale: ptBR })
    const anoMes = format(mes, 'yyyy-MM')
    const registros = acidentes12m.filter((a: { data_ocorrencia: string }) => a.data_ocorrencia.startsWith(anoMes))
    return {
      mes: label,
      acidentes: registros.filter((a: { tipo: string }) => a.tipo.includes('acidente')).length,
      incidentes: registros.filter((a: { tipo: string }) => !a.tipo.includes('acidente')).length,
    }
  })

  const dadosEpis = topEpis.map((e: { nome: string; total: number }) => ({ nome: e.nome.split(' ')[0], entregas: e.total }))

  if (loadingStats) return <SkeletonDashboard />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral da segurança do trabalho — atualizado a cada minuto</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard titulo="EPIs em estoque" valor={stats?.estoqueTotal ?? 0} icon={Shield} cor="blue" />
        <StatCard titulo="Entregas no mês" valor={stats?.entregas ?? 0} icon={Package} cor="green" />
        <StatCard titulo="Funcionários ativos" valor={stats?.funcionarios ?? 0} icon={Users} cor="purple" />
        <StatCard titulo="Acidentes no mês" valor={stats?.acidentes ?? 0} icon={AlertTriangle} cor="red" />
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <AlertCircle className="h-4 w-4 text-red-500" />
              EPIs com estoque crítico
            </CardTitle>
          </CardHeader>
          <CardContent>
            {episCriticos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Todos os estoques estão acima do mínimo</p>
            ) : (
              <div className="space-y-2">
                {episCriticos.map((epi: { id: string; nome: string; quantidade_atual: number; estoque_minimo: number }) => (
                  <div key={epi.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <span className="text-sm font-medium">{epi.nome}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">mín: {epi.estoque_minimo}</span>
                      <Badge variant={epi.quantidade_atual === 0 ? 'danger' : 'warning'}>
                        {epi.quantidade_atual} un.
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-yellow-500" />
              Treinamentos vencendo (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {treinamentosVencendo.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum treinamento vencendo nos próximos 7 dias</p>
            ) : (
              <div className="space-y-2">
                {treinamentosVencendo.map((t: { id: string; data_vencimento: string; funcionarios: unknown; treinamentos: unknown }) => (
                  <div key={t.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{(t.funcionarios as { nome: string } | null)?.nome}</p>
                      <p className="text-xs text-muted-foreground">{(t.treinamentos as { nome: string } | null)?.nome}</p>
                    </div>
                    <Badge variant="warning">{formatDate(t.data_vencimento)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              CAs vencendo (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {casVencendo.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum CA vencendo nos próximos 30 dias</p>
            ) : (
              <div className="space-y-2">
                {casVencendo.map((epi: { id: string; nome: string; ca: string; validade_ca: string }) => (
                  <div key={epi.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{epi.nome}</p>
                      <p className="text-xs text-muted-foreground">CA: {epi.ca}</p>
                    </div>
                    <Badge variant="warning">{formatDate(epi.validade_ca)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-yellow-500" />
              Documentos vencendo (60 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documentosVencendo.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum documento vencendo nos próximos 60 dias</p>
            ) : (
              <div className="space-y-2">
                {documentosVencendo.map((doc: { id: string; nome: string; tipo: string; validade: string }) => (
                  <div key={doc.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{doc.nome}</p>
                      <p className="text-xs text-muted-foreground">{doc.tipo}</p>
                    </div>
                    <Badge variant="warning">{formatDate(doc.validade)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4" />
              Acidentes e incidentes — 12 meses
            </CardTitle>
            <CardDescription>Histórico de ocorrências registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="acidentes" stroke="#ef4444" name="Acidentes" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="incidentes" stroke="#f97316" name="Incidentes" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Top EPIs entregues — mês atual</CardTitle>
            <CardDescription>Equipamentos com mais saídas registradas</CardDescription>
          </CardHeader>
          <CardContent>
            {dadosEpis.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                Nenhuma entrega registrada neste mês
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dadosEpis} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={55} />
                  <Tooltip />
                  <Bar dataKey="entregas" fill="#3b82f6" name="Entregas" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
