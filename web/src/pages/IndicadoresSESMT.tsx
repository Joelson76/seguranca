import { useState } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SkeletonDashboard } from '@/components/ui/skeleton'
import { useIndicadoresSESMT, useRecorrenciaAcidentes } from '@/hooks/useAcidentes'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CORES_GRAFICO = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6']

export default function IndicadoresSESMT() {
  const [meses, setMeses] = useState(12)
  const { data: indicadores = [], isLoading, error } = useIndicadoresSESMT(meses)
  const { data: recorrencia = [] } = useRecorrenciaAcidentes()

  if (isLoading) return <SkeletonDashboard />

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Indicadores SESMT</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <p className="text-lg font-medium mb-2">Erro ao carregar indicadores</p>
            <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
            <p className="text-xs text-muted-foreground">
              Verifique se há acidentes cadastrados e se as views estão criadas no banco.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const ultimoMes = indicadores[0] || null
  const mesAnterior = indicadores[1] || null

  // Cálculo de tendências
  const tendenciaTF = ultimoMes && mesAnterior && mesAnterior.taxa_frequencia > 0
    ? ((ultimoMes.taxa_frequencia - mesAnterior.taxa_frequencia) / mesAnterior.taxa_frequencia) * 100
    : 0

  const tendenciaTG = ultimoMes && mesAnterior && mesAnterior.taxa_gravidade > 0
    ? ((ultimoMes.taxa_gravidade - mesAnterior.taxa_gravidade) / mesAnterior.taxa_gravidade) * 100
    : 0

  const tendenciaCAI = ultimoMes && mesAnterior && mesAnterior.coeficiente_acidente_incapacitante > 0
    ? ((ultimoMes.coeficiente_acidente_incapacitante - mesAnterior.coeficiente_acidente_incapacitante) / mesAnterior.coeficiente_acidente_incapacitante) * 100
    : 0

  // Dados para gráficos
  const dadosGraficoTendencia = [...indicadores].reverse().map(i => ({
    mes: format(new Date(i.mes), 'MMM/yy', { locale: ptBR }),
    TF: i.taxa_frequencia,
    TG: i.taxa_gravidade / 100, // Dividir por 100 para escalar melhor no gráfico
    CAI: i.coeficiente_acidente_incapacitante,
  }))

  const dadosGraficoAcidentes = [...indicadores].reverse().map(i => ({
    mes: format(new Date(i.mes), 'MMM/yy', { locale: ptBR }),
    total: i.total_acidentes,
    com_afastamento: i.acidentes_com_afastamento,
  }))

  // Análise por tipo (simulado - em produção viria do banco)
  const tiposAcidente = recorrencia.reduce((acc: any, r: any) => {
    if (!acc[r.tipo]) acc[r.tipo] = 0
    acc[r.tipo] += r.ocorrencias
    return acc
  }, {})

  const dadosTipos = Object.entries(tiposAcidente).map(([tipo, count]) => ({
    name: tipo.replace(/_/g, ' '),
    value: count,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Indicadores SESMT</h1>
        <p className="text-muted-foreground">Taxa de Frequência, Gravidade e Coeficiente de Acidente Incapacitante</p>
      </div>

      {/* Cards de Indicadores Principais */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Taxa de Frequência (TF)</span>
            </div>
            <div className="text-3xl font-bold">{ultimoMes?.taxa_frequencia?.toFixed(2) ?? '0.00'}</div>
            <p className="text-xs text-muted-foreground mt-1">Acidentes por milhão de horas</p>
            {tendenciaTF !== 0 && (
              <p className="text-xs mt-2">
                {tendenciaTF > 0 ? '↑' : '↓'} {Math.abs(tendenciaTF).toFixed(1)}% vs mês anterior
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium">Taxa de Gravidade (TG)</span>
            </div>
            <div className="text-3xl font-bold">{ultimoMes?.taxa_gravidade?.toFixed(2) ?? '0.00'}</div>
            <p className="text-xs text-muted-foreground mt-1">Dias perdidos por milhão de horas</p>
            {tendenciaTG !== 0 && (
              <p className="text-xs mt-2">
                {tendenciaTG > 0 ? '↑' : '↓'} {Math.abs(tendenciaTG).toFixed(1)}% vs mês anterior
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">CAI</span>
            </div>
            <div className="text-3xl font-bold">{ultimoMes?.coeficiente_acidente_incapacitante?.toFixed(2) ?? '0.00'}</div>
            <p className="text-xs text-muted-foreground mt-1">Coeficiente Acidente Incapacitante</p>
            {tendenciaCAI !== 0 && (
              <p className="text-xs mt-2">
                {tendenciaCAI > 0 ? '↑' : '↓'} {Math.abs(tendenciaCAI).toFixed(1)}% vs mês anterior
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total de Acidentes</CardTitle>
            <CardDescription>Mês atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ultimoMes?.total_acidentes ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {ultimoMes?.acidentes_com_afastamento ?? 0} com afastamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dias Perdidos</CardTitle>
            <CardDescription>Mês atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ultimoMes?.total_dias_perdidos ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Total de dias de afastamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Horas Trabalhadas</CardTitle>
            <CardDescription>Mês atual (estimado)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {((ultimoMes?.horas_homem_trabalhadas ?? 0) / 1000).toFixed(1)}k
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {ultimoMes?.total_funcionarios ?? 0} funcionários ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Tendência */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução dos Indicadores ({meses} meses)</CardTitle>
          <CardDescription>TF, TG/100 e CAI ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosGraficoTendencia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="TF" stroke="#3b82f6" name="Taxa Frequência" strokeWidth={2} />
                <Line type="monotone" dataKey="TG" stroke="#ef4444" name="Taxa Gravidade ÷100" strokeWidth={2} />
                <Line type="monotone" dataKey="CAI" stroke="#f59e0b" name="CAI" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Acidentes */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acidentes por Mês</CardTitle>
            <CardDescription>Total vs. com afastamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGraficoAcidentes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#3b82f6" name="Total" />
                  <Bar dataKey="com_afastamento" fill="#ef4444" name="Com afastamento" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {dadosTipos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição por Tipo</CardTitle>
              <CardDescription>Últimos 24 meses (recorrências)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosTipos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosTipos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Análise de Recorrência */}
      {recorrencia.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Padrões e Recorrências Detectadas ({recorrencia.length})
            </CardTitle>
            <CardDescription>Acidentes similares que ocorreram mais de uma vez</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recorrencia.slice(0, 10).map((r: any, i: number) => (
                <div key={i} className="border rounded p-3 hover:bg-muted/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="danger">{r.ocorrencias}x</Badge>
                        <span className="font-medium text-sm">{r.tipo?.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <strong>Local:</strong> {r.local_ocorrencia}
                      </p>
                      {r.causa_imediata && (
                        <p className="text-xs text-muted-foreground">
                          <strong>Causa:</strong> {r.causa_imediata}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Primeira: {format(new Date(r.primeira_ocorrencia), 'dd/MM/yyyy', { locale: ptBR })} •
                        Última: {format(new Date(r.ultima_ocorrencia), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
                    <strong>⚠️ Ação recomendada:</strong> Revisar procedimentos e reforçar treinamento sobre este tipo de ocorrência
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Explicação dos Indicadores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como interpretar os indicadores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <strong className="text-blue-600">Taxa de Frequência (TF)</strong>
            <p className="text-muted-foreground">
              Número de acidentes com afastamento por milhão de horas trabalhadas.
              Quanto menor, melhor. Benchmark: {'<'} 10 é considerado bom.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Fórmula: (Acidentes com afastamento × 1.000.000) ÷ Horas trabalhadas
            </p>
          </div>
          <div>
            <strong className="text-red-600">Taxa de Gravidade (TG)</strong>
            <p className="text-muted-foreground">
              Dias perdidos por acidentes por milhão de horas trabalhadas.
              Indica a severidade dos acidentes. Quanto menor, melhor.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Fórmula: (Total dias perdidos × 1.000.000) ÷ Horas trabalhadas
            </p>
          </div>
          <div>
            <strong className="text-orange-600">CAI - Coeficiente de Acidente Incapacitante</strong>
            <p className="text-muted-foreground">
              Indicador composto que relaciona frequência e gravidade.
              É o principal indicador de performance de segurança. Quanto menor, melhor.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Fórmula: (TF × TG) ÷ 1.000
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
