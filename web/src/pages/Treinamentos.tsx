import { useState } from 'react'
import { Plus, FileDown, LayoutGrid, BookOpen, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
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
import { SkeletonTabela } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TabelaResponsiva } from '@/components/shared/TabelaResponsiva'
import {
  useTreinamentos, useParticipacoes, useCriarTreinamento, useRegistrarParticipacao, useExcluirParticipacao,
  type Treinamento, type Participacao,
} from '@/hooks/useTreinamentos'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

const schemaTrein = z.object({
  nome: z.string().min(1, 'Obrigatório'),
  descricao: z.string().optional(),
  carga_horaria: z.coerce.number().min(1),
  validade_meses: z.coerce.number().min(1),
  norma_regulamentadora: z.string().optional(),
})

const schemaPartic = z.object({
  funcionario_id: z.string().min(1, 'Obrigatório'),
  treinamento_id: z.string().min(1, 'Obrigatório'),
  data_realizacao: z.string().min(1, 'Obrigatório'),
  instrutor: z.string().optional(),
  local_realizacao: z.string().optional(),
})

type FormTrein = z.infer<typeof schemaTrein>
type FormPartic = z.infer<typeof schemaPartic>

function statusBadge(dataVencimento: string) {
  const diff = Math.ceil((new Date(dataVencimento).getTime() - Date.now()) / 86400000)
  if (diff < 0) return <Badge variant="danger">Vencido</Badge>
  if (diff <= 30) return <Badge variant="warning">Vence em {diff}d</Badge>
  return <Badge variant="success">Válido</Badge>
}

export default function Treinamentos() {
  const navigate = useNavigate()
  const [aba, setAba] = useState<'tipos' | 'participacoes'>('tipos')
  const [modalTrein, setModalTrein] = useState(false)
  const [modalPartic, setModalPartic] = useState(false)
  const [certArquivo, setCertArquivo] = useState<File | null>(null)
  const [pagina, setPagina] = useState(0)
  const [confirmExcluir, setConfirmExcluir] = useState<Participacao | null>(null)

  const { data: treinamentos = [], isLoading: loadTrein } = useTreinamentos()
  const { data: participacoes = [], isLoading: loadPartic } = useParticipacoes(pagina)
  const criarTrein = useCriarTreinamento()
  const registrarPartic = useRegistrarParticipacao()
  const excluirPartic = useExcluirParticipacao()

  const { data: funcionarios = [] } = useQuery({
    queryKey: ['funcionarios-select'],
    queryFn: async () => {
      const { data } = await supabase.from('funcionarios').select('id, nome, matricula').eq('ativo', true).order('nome')
      return data ?? []
    },
  })

  const formTrein = useForm<FormTrein>({ resolver: zodResolver(schemaTrein) as any })
  const formPartic = useForm<FormPartic>({ resolver: zodResolver(schemaPartic) as any })

  async function onSubmitTrein(data: FormTrein) {
    await criarTrein.mutateAsync(data)
    setModalTrein(false)
    formTrein.reset()
  }

  async function onSubmitPartic(data: FormPartic) {
    const trein = treinamentos.find(t => t.id === data.treinamento_id)
    let certificado_url: string | undefined
    if (certArquivo) {
      const path = `${Date.now()}_${certArquivo.name}` // ✅ CORRIGIDO: removido "certificados/" duplicado
      const { data: up } = await supabase.storage.from('certificados').upload(path, certArquivo)
      if (up) {
        const { data: urlData } = supabase.storage.from('certificados').getPublicUrl(up.path)
        certificado_url = urlData.publicUrl
      }
    }
    await registrarPartic.mutateAsync({
      ...data,
      validade_meses: trein?.validade_meses ?? 12,
      certificado_url,
    })
    setModalPartic(false)
    formPartic.reset()
    setCertArquivo(null)
  }

  const colunasPartic = [
    { header: 'Funcionário', cell: (p: Participacao) => <span className="font-medium">{(p.funcionarios as any)?.nome}</span> },
    { header: 'Treinamento', cell: (p: Participacao) => (p.treinamentos as any)?.nome },
    { header: 'Realização', hideMobile: true, cell: (p: Participacao) => <span className="text-muted-foreground">{formatDate(p.data_realizacao)}</span> },
    { header: 'Vencimento', cell: (p: Participacao) => <span className="text-muted-foreground">{formatDate(p.data_vencimento)}</span> },
    { header: 'Status', cell: (p: Participacao) => statusBadge(p.data_vencimento) },
  ]

  function acoesParticipacao(p: Participacao) {
    return (
      <div className="flex gap-1">
        {p.certificado_url && (
          <a href={p.certificado_url} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" title="Ver certificado">
              <FileDown className="h-3.5 w-3.5" />
            </Button>
          </a>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmExcluir(p)}
          title="Excluir participação"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Treinamentos</h1>
          <p className="text-muted-foreground">Gerencie treinamentos e certificações NR</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/treinamentos/matriz')}>
            <LayoutGrid className="h-4 w-4" /> Matriz
          </Button>
          <Button variant="outline" onClick={() => { setModalTrein(true); formTrein.reset() }}>
            <Plus className="h-4 w-4" /> Novo Tipo
          </Button>
          <Button onClick={() => { setModalPartic(true); formPartic.reset(); setCertArquivo(null) }}>
            <Plus className="h-4 w-4" /> Registrar Participação
          </Button>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 border-b">
        {(['tipos', 'participacoes'] as const).map(tab => (
          <button key={tab} onClick={() => setAba(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              aba === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {tab === 'tipos' ? 'Tipos de Treinamento' : 'Participações'}
          </button>
        ))}
      </div>

      {aba === 'tipos' ? (
        <Card>
          <CardHeader><CardTitle className="text-base">{treinamentos.length} tipo(s)</CardTitle></CardHeader>
          <CardContent>
            {loadTrein ? <SkeletonTabela linhas={4} /> : (
              <TabelaResponsiva
                colunas={[
                  { header: 'Nome', cell: (t: Treinamento) => <span className="font-medium">{t.nome}</span> },
                  { header: 'NR', hideMobile: true, cell: (t: Treinamento) => <span className="text-muted-foreground">{t.norma_regulamentadora ?? '—'}</span> },
                  { header: 'Carga', cell: (t: Treinamento) => `${t.carga_horaria}h` },
                  { header: 'Validade', cell: (t: Treinamento) => `${t.validade_meses} meses` },
                ]}
                dados={treinamentos}
                keyExtractor={t => t.id}
                vazio={<EmptyState icon={BookOpen} titulo="Nenhum treinamento cadastrado" />}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Participações registradas</CardTitle></CardHeader>
          <CardContent>
            {loadPartic ? <SkeletonTabela linhas={5} /> : (
              <>
                <TabelaResponsiva
                  colunas={colunasPartic}
                  dados={participacoes}
                  keyExtractor={p => p.id}
                  acoes={acoesParticipacao}
                  vazio={<EmptyState icon={BookOpen} titulo="Nenhuma participação registrada" />}
                />
                {participacoes.length > 0 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">Página {pagina + 1}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={pagina === 0} onClick={() => setPagina(p => p - 1)}>Anterior</Button>
                      <Button variant="outline" size="sm" disabled={participacoes.length < 20} onClick={() => setPagina(p => p + 1)}>Próxima</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal Novo Tipo */}
      <Dialog open={modalTrein} onOpenChange={setModalTrein}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Tipo de Treinamento</DialogTitle></DialogHeader>
          <form onSubmit={formTrein.handleSubmit(onSubmitTrein)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input {...formTrein.register('nome')} placeholder="NR-35 Trabalho em Altura" />
              {formTrein.formState.errors.nome && <p className="text-xs text-destructive">{formTrein.formState.errors.nome.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NR (opcional)</Label>
                <Input {...formTrein.register('norma_regulamentadora')} placeholder="NR-35" />
              </div>
              <div className="space-y-2">
                <Label>Carga horária (h)</Label>
                <Input type="number" min={1} {...formTrein.register('carga_horaria')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Validade (meses)</Label>
              <Input type="number" min={1} {...formTrein.register('validade_meses')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalTrein(false)}>Cancelar</Button>
              <Button type="submit" disabled={criarTrein.isPending}>
                {criarTrein.isPending ? 'Salvando...' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Participação */}
      <Dialog open={modalPartic} onOpenChange={setModalPartic}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Participação</DialogTitle></DialogHeader>
          <form onSubmit={formPartic.handleSubmit(onSubmitPartic)} className="space-y-4">
            <div className="space-y-2">
              <Label>Funcionário</Label>
              <select {...formPartic.register('funcionario_id')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="">Selecione...</option>
                {funcionarios.map((f: any) => <option key={f.id} value={f.id}>{f.nome} — {f.matricula}</option>)}
              </select>
              {formPartic.formState.errors.funcionario_id && <p className="text-xs text-destructive">{formPartic.formState.errors.funcionario_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Treinamento</Label>
              <select {...formPartic.register('treinamento_id')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="">Selecione...</option>
                {treinamentos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
              {formPartic.formState.errors.treinamento_id && <p className="text-xs text-destructive">{formPartic.formState.errors.treinamento_id.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de realização</Label>
                <Input type="date" {...formPartic.register('data_realizacao')} />
              </div>
              <div className="space-y-2">
                <Label>Instrutor</Label>
                <Input {...formPartic.register('instrutor')} placeholder="Nome" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Local</Label>
              <Input {...formPartic.register('local_realizacao')} placeholder="Ex: Sala de treinamento" />
            </div>
            <div className="space-y-2">
              <Label>Certificado (PDF ou imagem)</Label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setCertArquivo(e.target.files?.[0] ?? null)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
              />
              {certArquivo && <p className="text-xs text-muted-foreground">{certArquivo.name}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalPartic(false)}>Cancelar</Button>
              <Button type="submit" disabled={registrarPartic.isPending}>
                {registrarPartic.isPending ? 'Registrando...' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <ConfirmDialog
        open={!!confirmExcluir}
        titulo={`Excluir participação?`}
        descricao={`Remover o registro de ${(confirmExcluir?.funcionarios as any)?.nome} no treinamento "${(confirmExcluir?.treinamentos as any)?.nome}"? Esta ação não pode ser desfeita.`}
        textoBotao="Excluir"
        onConfirmar={async () => {
          if (!confirmExcluir) return
          await excluirPartic.mutateAsync(confirmExcluir.id)
          setConfirmExcluir(null)
        }}
        onCancelar={() => setConfirmExcluir(null)}
        carregando={excluirPartic.isPending}
      />
    </div>
  )
}
