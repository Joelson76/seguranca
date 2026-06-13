import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2, CheckCircle, Clock, User, FileText, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { SkeletonDashboard } from '@/components/ui/skeleton'
import {
  useAcidente, useAtualizarAcidente,
  useTestemunhas, useAdicionarTestemunha, useRemoverTestemunha,
  useAcoesCorretivas, useAdicionarAcaoCorretiva, useAtualizarAcaoCorretiva, useRemoverAcaoCorretiva,
  useChecklist, useSalvarChecklist,
  type Testemunha, type AcaoCorretiva, type Checklist
} from '@/hooks/useAcidentes'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { gerarRelatorioAcidentePDF } from '@/lib/relatorios/acidente-pdf'

const METODOS_ANALISE = [
  { value: '5_porques', label: '5 Porquês' },
  { value: 'ishikawa', label: 'Diagrama Ishikawa' },
  { value: 'arvore_causas', label: 'Árvore de Causas' },
  { value: 'outro', label: 'Outro' },
]

const STATUS_CAT_COR: Record<string, 'danger' | 'warning' | 'success' | 'secondary'> = {
  pendente: 'warning', enviada: 'secondary', aceita: 'success', rejeitada: 'danger',
}
const STATUS_CAT_LABEL: Record<string, string> = {
  pendente: 'Pendente', enviada: 'Enviada', aceita: 'Aceita', rejeitada: 'Rejeitada',
}

const STATUS_ACAO_COR: Record<string, 'danger' | 'warning' | 'success' | 'secondary'> = {
  pendente: 'danger', em_andamento: 'warning', concluida: 'success', cancelada: 'secondary',
}
const STATUS_ACAO_LABEL: Record<string, string> = {
  pendente: 'Pendente', em_andamento: 'Em andamento', concluida: 'Concluída', cancelada: 'Cancelada',
}

const schemaTestemunha = z.object({
  funcionario_id: z.string().optional(),
  nome_testemunha: z.string().min(1, 'Nome obrigatório'),
  depoimento: z.string().optional(),
})

const schemaAcao = z.object({
  descricao: z.string().min(1, 'Descrição obrigatória'),
  tipo_acao: z.string().optional(),
  responsavel_id: z.string().optional(),
  responsavel_nome: z.string().optional(),
  prazo: z.string().min(1, 'Prazo obrigatório'),
  observacoes: z.string().optional(),
})

export default function AcidenteDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [modalTestemunha, setModalTestemunha] = useState(false)
  const [modalAcao, setModalAcao] = useState(false)
  const [acaoEditando, setAcaoEditando] = useState<AcaoCorretiva | null>(null)

  const { data: acidente, isLoading } = useAcidente(id!)
  const { data: testemunhas = [] } = useTestemunhas(id!)
  const { data: acoes = [] } = useAcoesCorretivas(id!)
  const { data: checklist } = useChecklist(id!)

  const atualizar = useAtualizarAcidente()
  const adicionarTestemunha = useAdicionarTestemunha()
  const removerTestemunha = useRemoverTestemunha()
  const adicionarAcao = useAdicionarAcaoCorretiva()
  const atualizarAcao = useAtualizarAcaoCorretiva()
  const removerAcao = useRemoverAcaoCorretiva()
  const salvarChecklist = useSalvarChecklist()

  const { data: funcionarios = [] } = useQuery({
    queryKey: ['funcionarios-select'],
    queryFn: async () => {
      const { data } = await supabase.from('funcionarios').select('id, nome, cargo').eq('ativo', true).order('nome')
      return data ?? []
    },
  })

  const formTestemunha = useForm({ resolver: zodResolver(schemaTestemunha) as any })
  const formAcao = useForm({ resolver: zodResolver(schemaAcao) as any })

  const [checklistLocal, setChecklistLocal] = useState<Partial<Checklist>>({})

  // Estado local para análise de causas
  const [analiseLocal, setAnaliseLocal] = useState({
    metodo_analise: '',
    causa_imediata: '',
    causa_basica: '',
    causa_raiz: '',
    analise_detalhada: {} as any,
  })

  // Sincronizar estado local quando acidente carregar
  useEffect(() => {
    if (acidente) {
      console.log('🔄 Acidente carregado:', {
        metodo: acidente.metodo_analise,
        analise_detalhada: acidente.analise_detalhada
      })
      setAnaliseLocal({
        metodo_analise: acidente.metodo_analise ?? '',
        causa_imediata: acidente.causa_imediata ?? '',
        causa_basica: acidente.causa_basica ?? '',
        causa_raiz: acidente.causa_raiz ?? '',
        analise_detalhada: acidente.analise_detalhada ?? {},
      })
    }
  }, [acidente])

  // Inicializar estruturas vazias para cada método se não existirem
  useEffect(() => {
    if (analiseLocal.metodo_analise) {
      setAnaliseLocal(prev => {
        const detalhada = prev.analise_detalhada || {}

        // Inicializar 5 porquês se não existir
        if (!detalhada.porques) {
          detalhada.porques = ['', '', '', '', '']
        }

        // Inicializar Ishikawa se não existir
        if (!detalhada.ishikawa) {
          detalhada.ishikawa = {
            metodo: '', maquina: '', material: '',
            mao_de_obra: '', meio_ambiente: '', medida: ''
          }
        }

        // Inicializar Árvore se não existir
        if (!detalhada.arvore) {
          detalhada.arvore = { nivel1: '', nivel2: '', nivel3: '' }
        }

        return { ...prev, analise_detalhada: detalhada }
      })
    }
  }, [analiseLocal.metodo_analise])

  async function salvarAnalise() {
    if (!id) return
    console.log('💾 Salvando análise:', JSON.stringify(analiseLocal, null, 2))

    const dadosParaSalvar = {
      metodo_analise: analiseLocal.metodo_analise || null,
      causa_imediata: analiseLocal.causa_imediata || null,
      causa_basica: analiseLocal.causa_basica || null,
      causa_raiz: analiseLocal.causa_raiz || null,
      analise_detalhada: analiseLocal.analise_detalhada && Object.keys(analiseLocal.analise_detalhada).length > 0
        ? analiseLocal.analise_detalhada
        : null
    }

    console.log('📤 Dados que serão enviados:', JSON.stringify(dadosParaSalvar, null, 2))

    try {
      await atualizar.mutateAsync({ id, dados: dadosParaSalvar })
      console.log('✅ Análise salva com sucesso!')
    } catch (err) {
      console.error('❌ Erro ao salvar análise:', err)
      toast.error('Erro ao salvar: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
    }
  }

  // Verificar se há mudanças não salvas na análise
  const analiseAlterada = acidente && (
    analiseLocal.metodo_analise !== (acidente.metodo_analise ?? '') ||
    analiseLocal.causa_imediata !== (acidente.causa_imediata ?? '') ||
    analiseLocal.causa_basica !== (acidente.causa_basica ?? '') ||
    analiseLocal.causa_raiz !== (acidente.causa_raiz ?? '') ||
    JSON.stringify(analiseLocal.analise_detalhada) !== JSON.stringify(acidente.analise_detalhada ?? {})
  )

  async function onSubmitTestemunha(data: any) {
    await adicionarTestemunha.mutateAsync({ ...data, acidente_id: id! })
    setModalTestemunha(false)
    formTestemunha.reset()
  }

  async function onSubmitAcao(data: any) {
    if (acaoEditando) {
      await atualizarAcao.mutateAsync({ id: acaoEditando.id, acidenteId: id!, dados: data })
    } else {
      await adicionarAcao.mutateAsync({ ...data, acidente_id: id!, status: 'pendente' as any })
    }
    setModalAcao(false)
    setAcaoEditando(null)
    formAcao.reset()
  }

  async function atualizarStatusAcao(acaoId: string, status: string) {
    const dados: any = { status }
    if (status === 'concluida') dados.data_conclusao = new Date().toISOString().split('T')[0]
    await atualizarAcao.mutateAsync({ id: acaoId, acidenteId: id!, dados })
  }

  async function salvarChecklistCompleto() {
    if (!id) return
    await salvarChecklist.mutateAsync({ acidenteId: id, dados: checklistLocal })
  }

  async function gerarPDF() {
    if (!acidente) return
    try {
      // Busca nome do tenant
      const { data: tenant } = await supabase
        .from('tenants')
        .select('nome_empresa')
        .eq('id', acidente.tenant_id)
        .single()

      await gerarRelatorioAcidentePDF(acidente, testemunhas, acoes, checklist, tenant?.nome_empresa)
      toast.success('Relatório gerado com sucesso')
    } catch (err) {
      toast.error('Erro ao gerar relatório')
      console.error(err)
    }
  }

  if (isLoading) return <SkeletonDashboard />
  if (!acidente) return <div className="p-8 text-center">Acidente não encontrado</div>

  const checklistAtual = checklist ?? checklistLocal

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/acidentes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Investigação de Acidente</h1>
          <p className="text-muted-foreground">
            {acidente.funcionarios?.nome} • {formatDate(acidente.data_ocorrencia)}
          </p>
        </div>
        <Button onClick={gerarPDF} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Gerar Relatório PDF
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Coluna 1: Dados básicos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Local:</span>
              <p className="font-medium">{acidente.local_ocorrencia}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Descrição:</span>
              <p className="font-medium">{acidente.descricao}</p>
            </div>
            {acidente.parte_corpo_atingida && (
              <div>
                <span className="text-muted-foreground">Parte atingida:</span>
                <p className="font-medium">{acidente.parte_corpo_atingida}</p>
              </div>
            )}
            {acidente.gravidade && (
              <div>
                <span className="text-muted-foreground">Gravidade:</span>
                <p className="font-medium">{acidente.gravidade}/5</p>
              </div>
            )}
            {acidente.cat && (
              <div>
                <span className="text-muted-foreground">Status CAT:</span>
                <Badge variant={STATUS_CAT_COR[acidente.status_cat ?? 'pendente']} className="ml-2">
                  {STATUS_CAT_LABEL[acidente.status_cat ?? 'pendente']}
                </Badge>
                {acidente.numero_cat && <p className="text-xs mt-1">Nº {acidente.numero_cat}</p>}
                {acidente.prazo_cat && (
                  <p className="text-xs mt-1 text-orange-600">
                    Prazo CAT: {formatDate(acidente.prazo_cat)}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coluna 2: Análise de Causas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Análise de Causas (Múltiplos Métodos)</CardTitle>
            <CardDescription>Você pode usar um ou mais métodos de análise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Abas de navegação entre métodos */}
            <div className="flex gap-2 flex-wrap border-b pb-2">
              <button
                type="button"
                onClick={() => setAnaliseLocal(prev => ({ ...prev, metodo_analise: '5_porques' }))}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  analiseLocal.metodo_analise === '5_porques'
                    ? 'bg-blue-500 text-white'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                5 Porquês
                {analiseLocal.analise_detalhada?.porques?.some((p: string) => p) && ' ✓'}
              </button>
              <button
                type="button"
                onClick={() => setAnaliseLocal(prev => ({ ...prev, metodo_analise: 'ishikawa' }))}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  analiseLocal.metodo_analise === 'ishikawa'
                    ? 'bg-purple-500 text-white'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Ishikawa
                {analiseLocal.analise_detalhada?.ishikawa && Object.values(analiseLocal.analise_detalhada.ishikawa).some((v: any) => v) && ' ✓'}
              </button>
              <button
                type="button"
                onClick={() => setAnaliseLocal(prev => ({ ...prev, metodo_analise: 'arvore_causas' }))}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  analiseLocal.metodo_analise === 'arvore_causas'
                    ? 'bg-green-500 text-white'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Árvore de Causas
                {analiseLocal.analise_detalhada?.arvore && Object.values(analiseLocal.analise_detalhada.arvore).some((v: any) => v) && ' ✓'}
              </button>
              <button
                type="button"
                onClick={() => setAnaliseLocal(prev => ({ ...prev, metodo_analise: 'outro' }))}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  analiseLocal.metodo_analise === 'outro'
                    ? 'bg-gray-500 text-white'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Outro
              </button>
            </div>

            {/* Campos específicos: 5 Porquês */}
            {analiseLocal.metodo_analise === '5_porques' && (
              <div className="space-y-3 border-l-2 border-blue-500 pl-3">
                <p className="text-xs font-medium text-blue-600">Análise 5 Porquês</p>
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-1">
                    <Label className="text-xs">Por quê? {i + 1}</Label>
                    <Input
                      value={analiseLocal.analise_detalhada?.porques?.[i] ?? ''}
                      onChange={(e) => {
                        const novosPortques = [...(analiseLocal.analise_detalhada?.porques ?? ['', '', '', '', ''])]
                        novosPortques[i] = e.target.value
                        console.log(`✏️ Por quê ${i + 1}:`, e.target.value)
                        console.log('📝 Todos os porquês:', novosPortques)
                        setAnaliseLocal(prev => ({
                          ...prev,
                          analise_detalhada: { ...prev.analise_detalhada, porques: novosPortques },
                          causa_raiz: i === 4 ? e.target.value : prev.causa_raiz
                        }))
                      }}
                      placeholder={i === 4 ? 'Causa raiz (5º Por quê)' : `Resposta ${i + 1}`}
                    />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">💡 O 5º "Por quê" é automaticamente a causa raiz</p>
              </div>
            )}

            {/* Campos específicos: Ishikawa (6M) */}
            {analiseLocal.metodo_analise === 'ishikawa' && (
              <div className="space-y-3 border-l-2 border-purple-500 pl-3">
                <p className="text-xs font-medium text-purple-600">Diagrama de Ishikawa (6M)</p>
                {[
                  { key: 'metodo', label: '🔧 Método' },
                  { key: 'maquina', label: '⚙️ Máquina' },
                  { key: 'material', label: '📦 Material' },
                  { key: 'mao_de_obra', label: '👷 Mão de obra' },
                  { key: 'meio_ambiente', label: '🌍 Meio ambiente' },
                  { key: 'medida', label: '📏 Medida' },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input
                      value={analiseLocal.analise_detalhada?.ishikawa?.[key] ?? ''}
                      onChange={(e) => {
                        setAnaliseLocal(prev => ({
                          ...prev,
                          analise_detalhada: {
                            ...prev.analise_detalhada,
                            ishikawa: { ...(prev.analise_detalhada?.ishikawa ?? {}), [key]: e.target.value }
                          }
                        }))
                      }}
                      placeholder={`Causas relacionadas a ${label.split(' ')[1]}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Campos específicos: Árvore de Causas */}
            {analiseLocal.metodo_analise === 'arvore_causas' && (
              <div className="space-y-3 border-l-2 border-green-500 pl-3">
                <p className="text-xs font-medium text-green-600">Árvore de Causas</p>
                {[
                  { key: 'nivel1', label: '🔴 Nível 1 - Evento/Acidente', placeholder: 'O que aconteceu?' },
                  { key: 'nivel2', label: '🟡 Nível 2 - Causas Diretas', placeholder: 'Fatores que contribuíram diretamente' },
                  { key: 'nivel3', label: '🟢 Nível 3 - Causas Raízes', placeholder: 'Problemas estruturais/sistêmicos' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Textarea
                      value={analiseLocal.analise_detalhada?.arvore?.[key] ?? ''}
                      onChange={(e) => {
                        setAnaliseLocal(prev => ({
                          ...prev,
                          analise_detalhada: {
                            ...prev.analise_detalhada,
                            arvore: { ...(prev.analise_detalhada?.arvore ?? {}), [key]: e.target.value }
                          },
                          causa_raiz: key === 'nivel3' ? e.target.value : prev.causa_raiz
                        }))
                      }}
                      rows={2}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">💡 Nível 3 é automaticamente a causa raiz</p>
              </div>
            )}

            {/* Campos genéricos (quando método = outro ou não selecionado) */}
            {(!analiseLocal.metodo_analise || analiseLocal.metodo_analise === 'outro') && (
              <>
                <div className="space-y-2">
                  <Label>Causa imediata</Label>
                  <Textarea
                    value={analiseLocal.causa_imediata}
                    onChange={(e) => setAnaliseLocal(prev => ({ ...prev, causa_imediata: e.target.value }))}
                    rows={2}
                    placeholder="O que causou diretamente..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Causa básica</Label>
                  <Textarea
                    value={analiseLocal.causa_basica}
                    onChange={(e) => setAnaliseLocal(prev => ({ ...prev, causa_basica: e.target.value }))}
                    rows={2}
                    placeholder="Condição subjacente..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Causa raiz</Label>
                  <Textarea
                    value={analiseLocal.causa_raiz}
                    onChange={(e) => setAnaliseLocal(prev => ({ ...prev, causa_raiz: e.target.value }))}
                    rows={3}
                    placeholder="Resultado da análise..."
                  />
                </div>
              </>
            )}

            <div className="pt-4 border-t space-y-2">
              <Button
                onClick={salvarAnalise}
                disabled={atualizar.isPending || !analiseAlterada}
                className="w-full"
                variant={analiseAlterada ? 'default' : 'outline'}
              >
                <Save className="h-4 w-4 mr-2" />
                {atualizar.isPending ? 'Salvando...' : analiseAlterada ? 'Salvar Todas as Análises *' : 'Análises Salvas'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                💡 Todos os métodos preenchidos serão salvos juntos
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Coluna 3: Prazos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prazos e Responsáveis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Prazo conclusão investigação</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {acidente.prazo_conclusao_investigacao
                    ? formatDate(acidente.prazo_conclusao_investigacao)
                    : 'Não definido'}
                </span>
              </div>
            </div>
            {acidente.data_conclusao_investigacao && (
              <div className="space-y-2">
                <Label>Concluída em</Label>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{formatDate(acidente.data_conclusao_investigacao)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Testemunhas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Testemunhas ({testemunhas.length})</CardTitle>
          <Button size="sm" onClick={() => { setModalTestemunha(true); formTestemunha.reset() }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {testemunhas.length > 0 ? (
            <div className="space-y-2">
              {testemunhas.map((t: Testemunha) => (
                <div key={t.id} className="border rounded p-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{t.nome_testemunha}</span>
                      {t.funcionarios && <Badge variant="secondary" className="text-xs">{(t.funcionarios as any).cargo}</Badge>}
                    </div>
                    {t.depoimento && <p className="text-xs text-muted-foreground mt-2">{t.depoimento}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removerTestemunha.mutate({ id: t.id, acidenteId: id! })}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma testemunha registrada</p>
          )}
        </CardContent>
      </Card>

      {/* Ações Corretivas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Ações Corretivas ({acoes.length})</CardTitle>
          <Button size="sm" onClick={() => { setModalAcao(true); setAcaoEditando(null); formAcao.reset() }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {acoes.length > 0 ? (
            <div className="space-y-3">
              {acoes.map((a: AcaoCorretiva) => (
                <div key={a.id} className="border rounded p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{a.descricao}</span>
                        <Badge variant={STATUS_ACAO_COR[a.status]}>{STATUS_ACAO_LABEL[a.status]}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {a.tipo_acao && <p>Tipo: {a.tipo_acao}</p>}
                        {(a.responsavel_nome || a.funcionarios) && (
                          <p>Responsável: {a.responsavel_nome ?? (a.funcionarios as any)?.nome}</p>
                        )}
                        <p className={new Date(a.prazo) < new Date() && a.status !== 'concluida' ? 'text-red-600 font-medium' : ''}>
                          Prazo: {formatDate(a.prazo)}
                          {new Date(a.prazo) < new Date() && a.status !== 'concluida' && ' (Vencido)'}
                        </p>
                        {a.data_conclusao && <p>Concluída em: {formatDate(a.data_conclusao)}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {a.status !== 'concluida' && a.status !== 'cancelada' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => atualizarStatusAcao(a.id, a.status === 'pendente' ? 'em_andamento' : 'concluida')}
                        >
                          {a.status === 'pendente' ? 'Iniciar' : 'Concluir'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removerAcao.mutate({ id: a.id, acidenteId: id! })}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma ação corretiva registrada</p>
          )}
        </CardContent>
      </Card>

      {/* Checklist NR-1 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Checklist de Investigação (NR-1)</CardTitle>
          <CardDescription>Itens obrigatórios conforme NR-1</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { key: 'local_preservado', label: 'Local preservado' },
              { key: 'fotos_realizadas', label: 'Fotos realizadas' },
              { key: 'testemunhas_ouvidas', label: 'Testemunhas ouvidas' },
              { key: 'epi_analisado', label: 'EPI analisado' },
              { key: 'condicoes_ambiente_verificadas', label: 'Condições ambientais verificadas' },
              { key: 'procedimentos_revisados', label: 'Procedimentos revisados' },
              { key: 'treinamento_verificado', label: 'Treinamento verificado' },
              { key: 'equipamentos_inspecionados', label: 'Equipamentos inspecionados' },
              { key: 'relatorio_elaborado', label: 'Relatório elaborado' },
              { key: 'acoes_imediatas_tomadas', label: 'Ações imediatas tomadas' },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={item.key}
                  checked={(checklistAtual as any)?.[item.key] ?? false}
                  onChange={(e) => setChecklistLocal(prev => ({ ...prev, [item.key]: e.target.checked }))}
                  className="h-4 w-4 rounded"
                />
                <Label htmlFor={item.key} className="text-sm cursor-pointer">{item.label}</Label>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={(checklistAtual as any)?.observacoes ?? ''}
              onChange={(e) => setChecklistLocal(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={3}
              placeholder="Observações adicionais sobre a investigação..."
            />
          </div>
          <div className="mt-4">
            <Button onClick={salvarChecklistCompleto} disabled={salvarChecklist.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {salvarChecklist.isPending ? 'Salvando...' : 'Salvar Checklist'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal Testemunha */}
      <Dialog open={modalTestemunha} onOpenChange={setModalTestemunha}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Testemunha</DialogTitle></DialogHeader>
          <form onSubmit={formTestemunha.handleSubmit(onSubmitTestemunha)} className="space-y-4">
            <div className="space-y-2">
              <Label>Funcionário (opcional)</Label>
              <select {...formTestemunha.register('funcionario_id')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">Não é funcionário</option>
                {funcionarios.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input {...formTestemunha.register('nome_testemunha')} placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label>Depoimento</Label>
              <Textarea {...formTestemunha.register('depoimento')} rows={3} placeholder="O que a testemunha relatou..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalTestemunha(false)}>Cancelar</Button>
              <Button type="submit">Adicionar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Ação Corretiva */}
      <Dialog open={modalAcao} onOpenChange={setModalAcao}>
        <DialogContent>
          <DialogHeader><DialogTitle>{acaoEditando ? 'Editar' : 'Adicionar'} Ação Corretiva</DialogTitle></DialogHeader>
          <form onSubmit={formAcao.handleSubmit(onSubmitAcao)} className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Textarea {...formAcao.register('descricao')} rows={2} placeholder="Descreva a ação..." />
            </div>
            <div className="space-y-2">
              <Label>Tipo de ação</Label>
              <select {...formAcao.register('tipo_acao')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">Selecione...</option>
                <option value="Corretiva">Corretiva</option>
                <option value="Preventiva">Preventiva</option>
                <option value="Paliativa">Paliativa</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsável</Label>
                <select {...formAcao.register('responsavel_id')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="">Selecione...</option>
                  {funcionarios.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Prazo *</Label>
                <Input type="date" {...formAcao.register('prazo')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea {...formAcao.register('observacoes')} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalAcao(false)}>Cancelar</Button>
              <Button type="submit">{acaoEditando ? 'Salvar' : 'Adicionar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
