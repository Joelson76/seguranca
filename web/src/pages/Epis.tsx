import { useState } from 'react'
import { Plus, Search, Loader2, ArrowUpDown, History } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { TabelaResponsiva } from '@/components/shared/TabelaResponsiva'
import { EmptyState } from '@/components/shared/EmptyState'
import { useEpis, useCriarEPI, useAtualizarEPI, useMovimentarEstoque, type EPI } from '@/hooks/useEpis'
import { SkeletonTabela } from '@/components/ui/skeleton'
import { useDebounce } from '@/hooks/useDebounce'
import { supabase } from '@/lib/supabase'
import { formatDate, formatDateTime } from '@/lib/utils'

const schemaEpi = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  ca: z.string().min(1, 'CA obrigatório'),
  validade_ca: z.string().min(1, 'Validade obrigatória'),
  quantidade_atual: z.coerce.number().min(0),
  estoque_minimo: z.coerce.number().min(0),
  ativo: z.boolean().default(true),
})

const schemaMov = z.object({
  tipo: z.enum(['entrada', 'saida', 'ajuste', 'devolucao', 'descarte']),
  quantidade: z.coerce.number().min(1),
  motivo: z.string().optional(),
})

type FormEpi = z.infer<typeof schemaEpi>
type FormMov = z.infer<typeof schemaMov>

function badgeEstoque(atual: number, minimo: number) {
  if (atual <= 0) return <Badge variant="danger">Sem estoque</Badge>
  if (atual <= minimo) return <Badge variant="warning">Estoque baixo</Badge>
  return <Badge variant="success">OK</Badge>
}

export default function Epis() {
  const [busca, setBusca] = useState('')
  const buscaDebounced = useDebounce(busca)
  const [modalEpi, setModalEpi] = useState(false)
  const [modalMov, setModalMov] = useState(false)
  const [modalHist, setModalHist] = useState(false)
  const [editando, setEditando] = useState<EPI | null>(null)
  const [epiSelecionado, setEpiSelecionado] = useState<EPI | null>(null)
  const qc = useQueryClient()

  const { data: epis = [], isLoading } = useEpis(buscaDebounced)
  const criarEPI = useCriarEPI()
  const atualizarEPI = useAtualizarEPI()
  const movimentar = useMovimentarEstoque()

  const { data: historico = [] } = useQuery({
    queryKey: ['hist-mov', epiSelecionado?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('estoque_movimentos')
        .select('*')
        .eq('epi_id', epiSelecionado!.id)
        .order('criado_em', { ascending: false })
        .limit(30)
      return data ?? []
    },
    enabled: !!epiSelecionado && modalHist,
  })

  const formEpi = useForm<FormEpi>({ resolver: zodResolver(schemaEpi) as any })
  const formMov = useForm<FormMov>({ resolver: zodResolver(schemaMov) as any })

  async function salvarEpi(dados: FormEpi) {
    try {
      if (editando) {
        await atualizarEPI.mutateAsync({ id: editando.id, ...dados })
      } else {
        await criarEPI.mutateAsync(dados)
      }
      setModalEpi(false)
      formEpi.reset()
      setEditando(null)
    } catch (error) {
      // Erro já tratado pelos hooks
    }
  }

  function abrirModalEpi(epi?: EPI) {
    setEditando(epi ?? null)
    formEpi.reset(epi ? {
      nome: epi.nome,
      ca: epi.ca,
      validade_ca: epi.validade_ca,
      quantidade_atual: epi.quantidade_atual,
      estoque_minimo: epi.estoque_minimo,
      ativo: epi.ativo,
    } : {
      quantidade_atual: 0,
      estoque_minimo: 10,
      ativo: true
    })
    setModalEpi(true)
  }

  function abrirModalMov(epi: EPI) {
    setEpiSelecionado(epi)
    formMov.reset({ tipo: 'entrada', quantidade: 1 })
    setModalMov(true)
  }

  async function onSubmitEpi(data: FormEpi) {
    await salvarEpi(data)
  }

  async function onSubmitMov(data: FormMov) {
    if (!epiSelecionado) return
    await movimentar.mutateAsync({ epi_id: epiSelecionado.id, ...data })
    setModalMov(false)
    formMov.reset()
  }

  const colunas = [
    { header: 'Nome', cell: (e: EPI) => <span className="font-medium">{e.nome}</span> },
    { header: 'CA', cell: (e: EPI) => <span className="font-mono text-xs">{e.ca}</span> },
    { header: 'Val. CA', mobileLabel: 'Validade CA', cell: (e: EPI) => <span className="text-muted-foreground">{formatDate(e.validade_ca)}</span> },
    {
      header: 'Estoque',
      cell: (e: EPI) => (
        <span>
          <span className="font-medium">{e.quantidade_atual}</span>
          <span className="text-muted-foreground text-xs"> / {e.estoque_minimo} mín</span>
        </span>
      ),
    },
    { header: 'Status', cell: (e: EPI) => badgeEstoque(e.quantidade_atual, e.estoque_minimo) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">EPIs</h1>
          <p className="text-muted-foreground">Catálogo e controle de estoque</p>
        </div>
        <Button onClick={() => abrirModalEpi()}>
          <Plus className="h-4 w-4" /> Novo EPI
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar EPI..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isLoading ? 'Carregando...' : `${epis.length} EPI(s)`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTabela linhas={5} />
          ) : (
            <TabelaResponsiva
              colunas={colunas}
              dados={epis}
              keyExtractor={e => e.id}
              acoes={(epi) => (
                <div className="flex gap-1 flex-wrap">
                  <Button variant="ghost" size="sm" onClick={() => abrirModalEpi(epi)}>Editar</Button>
                  <Button variant="outline" size="sm" onClick={() => abrirModalMov(epi)}>
                    <ArrowUpDown className="h-3 w-3 mr-1" /> Mover
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setEpiSelecionado(epi); setModalHist(true) }}>
                    <History className="h-3 w-3 mr-1" /> Histórico
                  </Button>
                </div>
              )}
              vazio={<EmptyState icon={Search} titulo="Nenhum EPI cadastrado" descricao="Cadastre os EPIs da empresa para controlar o estoque" />}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal EPI */}
      <Dialog open={modalEpi} onOpenChange={setModalEpi}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editando ? 'Editar EPI' : 'Novo EPI'}</DialogTitle></DialogHeader>
          <form onSubmit={formEpi.handleSubmit(salvarEpi)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do EPI</Label>
              <Input {...formEpi.register('nome')} placeholder="Capacete de segurança" />
              {formEpi.formState.errors.nome && <p className="text-xs text-destructive">{formEpi.formState.errors.nome.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número CA</Label>
                <Input {...formEpi.register('ca')} placeholder="12345" />
                {formEpi.formState.errors.ca && <p className="text-xs text-destructive">{formEpi.formState.errors.ca.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Validade CA</Label>
                <Input type="date" {...formEpi.register('validade_ca')} />
                {formEpi.formState.errors.validade_ca && <p className="text-xs text-destructive">{formEpi.formState.errors.validade_ca.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estoque Atual</Label>
                <Input type="number" {...formEpi.register('quantidade_atual')} />
                {formEpi.formState.errors.quantidade_atual && <p className="text-xs text-destructive">{formEpi.formState.errors.quantidade_atual.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Estoque Mínimo</Label>
                <Input type="number" {...formEpi.register('estoque_minimo')} />
                {formEpi.formState.errors.estoque_minimo && <p className="text-xs text-destructive">{formEpi.formState.errors.estoque_minimo.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalEpi(false)}>Cancelar</Button>
              <Button type="submit" disabled={criarEPI.isPending || atualizarEPI.isPending}>
                {(criarEPI.isPending || atualizarEPI.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editando ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Movimentação */}
      <Dialog open={modalMov} onOpenChange={setModalMov}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Movimentação — {epiSelecionado?.nome}</DialogTitle></DialogHeader>
          <form onSubmit={formMov.handleSubmit(onSubmitMov)} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select {...formMov.register('tipo')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="ajuste">Ajuste de inventário</option>
                <option value="devolucao">Devolução</option>
                <option value="descarte">Descarte</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input type="number" min={1} {...formMov.register('quantidade')} />
            </div>
            <div className="space-y-2">
              <Label>Motivo / Observação</Label>
              <Input {...formMov.register('motivo')} placeholder="Opcional" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalMov(false)}>Cancelar</Button>
              <Button type="submit" disabled={movimentar.isPending}>
                {movimentar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Histórico */}
      <Dialog open={modalHist} onOpenChange={setModalHist}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Histórico — {epiSelecionado?.nome}</DialogTitle></DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            {historico.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma movimentação registrada</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {['Tipo', 'Qtd', 'Motivo', 'Data'].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historico.map((m: any) => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="py-2 px-2">
                        <Badge variant={['entrada', 'devolucao'].includes(m.tipo) ? 'success' : 'danger'} className="capitalize text-xs">
                          {m.tipo}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 font-medium">
                        {['entrada', 'devolucao'].includes(m.tipo) ? '+' : '-'}{m.quantidade}
                      </td>
                      <td className="py-2 px-2 text-muted-foreground text-xs">{m.motivo ?? '—'}</td>
                      <td className="py-2 px-2 text-muted-foreground text-xs">{formatDateTime(m.criado_em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
