import { useState } from 'react'
import { Plus, Upload, AlertTriangle, FileText, Download, ExternalLink, Eye } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { SkeletonTabela } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { TabelaResponsiva } from '@/components/shared/TabelaResponsiva'
import { useAcidentes, useRegistrarAcidente, useAvancarStatus, type Acidente } from '@/hooks/useAcidentes'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

const TIPOS = [
  { value: 'acidente_com_afastamento', label: 'Acidente com afastamento' },
  { value: 'acidente_sem_afastamento', label: 'Acidente sem afastamento' },
  { value: 'acidente_de_trajeto', label: 'Acidente de trajeto' },
  { value: 'quase_acidente', label: 'Quase-acidente' },
  { value: 'incidente', label: 'Incidente' },
  { value: 'doenca_ocupacional', label: 'Doença ocupacional' },
]

const STATUS_COR: Record<string, 'danger' | 'warning' | 'success' | 'secondary'> = {
  aberto: 'danger', em_investigacao: 'warning', concluido: 'success', arquivado: 'secondary',
}
const STATUS_LABEL: Record<string, string> = {
  aberto: 'Aberto', em_investigacao: 'Em investigação', concluido: 'Concluído', arquivado: 'Arquivado',
}

const schema = z.object({
  funcionario_id: z.string().min(1, 'Obrigatório'),
  tipo: z.string().min(1, 'Obrigatório'),
  data_ocorrencia: z.string().min(1, 'Obrigatório'),
  hora_ocorrencia: z.string().min(1, 'Obrigatório'),
  local_ocorrencia: z.string().min(1, 'Obrigatório'),
  descricao: z.string().min(10, 'Descreva com mais detalhes'),
  causa_imediata: z.string().optional(),
  medidas_corretivas: z.string().optional(),
  dias_afastamento: z.coerce.number().optional(),
  cat: z.boolean(),
})
type FormData = z.infer<typeof schema>

export default function Acidentes() {
  const [modalRegistro, setModalRegistro] = useState(false)
  const [modalEvidencias, setModalEvidencias] = useState(false)
  const [modalVisualizarEvidencias, setModalVisualizarEvidencias] = useState(false)
  const [acidenteSelecionado, setAcidenteSelecionado] = useState<Acidente | null>(null)
  const [evidencias, setEvidencias] = useState<File[]>([])
  const [enviandoEvid, setEnviandoEvid] = useState(false)
  const [pagina, setPagina] = useState(0)
  const [fileInputKey, setFileInputKey] = useState(Date.now())

  const { data: acidentes = [], isLoading } = useAcidentes(pagina)
  const registrar = useRegistrarAcidente()
  const avancar = useAvancarStatus()

  const { data: funcionarios = [] } = useQuery({
    queryKey: ['funcionarios-select'],
    queryFn: async () => {
      const { data } = await supabase.from('funcionarios').select('id, nome, matricula').eq('ativo', true).order('nome')
      return data ?? []
    },
  })

  const { data: evidenciasExistentes = [], refetch: refetchEvidencias } = useQuery({
    queryKey: ['evidencias-acidente', acidenteSelecionado?.id],
    queryFn: async () => {
      if (!acidenteSelecionado?.id) return []
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('acidente_id', acidenteSelecionado.id)
        .order('criado_em', { ascending: false })
      console.log('🔍 Evidências encontradas:', data, 'Erro:', error)
      if (error) console.error('❌ Erro ao buscar evidências:', error)
      return data ?? []
    },
    enabled: !!acidenteSelecionado?.id,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { cat: false as boolean },
  })

  async function onSubmit(data: FormData) {
    await registrar.mutateAsync(data as any)
    setModalRegistro(false)
    reset({ cat: false as boolean })
  }

  async function enviarEvidencias() {
    if (!acidenteSelecionado || evidencias.length === 0) return
    setEnviandoEvid(true)
    try {
      for (const arquivo of evidencias) {
        const path = `acidentes/${acidenteSelecionado.id}/${Date.now()}_${arquivo.name}`
        const { data: uploaded, error: uploadError } = await supabase.storage.from('documentos').upload(path, arquivo)
        if (uploadError) throw uploadError

        if (uploaded) {
          // Salva apenas o path, não a URL pública (bucket é privado)
          const { error: insertError } = await supabase.from('documentos').insert({
            nome: arquivo.name,
            tipo: 'Evidência de acidente',
            arquivo_url: uploaded.path, // Salva o path, não a URL
            acidente_id: acidenteSelecionado.id,
            tenant_id: acidenteSelecionado.tenant_id,
          })
          if (insertError) throw insertError
        }
      }
      toast.success(`${evidencias.length} evidência(s) enviada(s)`)
      setEvidencias([])
      setFileInputKey(Date.now())
      setModalEvidencias(false)
    } catch (err) {
      console.error('Erro ao enviar evidências:', err)
      toast.error('Erro ao enviar evidências')
    }
    finally { setEnviandoEvid(false) }
  }

  async function abrirEvidencia(path: string) {
    // Gera URL assinada válida por 1 hora (bucket privado)
    const { data, error } = await supabase.storage
      .from('documentos')
      .createSignedUrl(path, 3600)

    if (error || !data) {
      toast.error('Erro ao abrir evidência')
      return
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  const colunas = [
    { header: 'Funcionário', cell: (a: Acidente) => <span className="font-medium">{(a.funcionarios as any)?.nome}</span> },
    { header: 'Tipo', hideMobile: true, cell: (a: Acidente) => <span className="text-xs text-muted-foreground">{TIPOS.find(t => t.value === a.tipo)?.label}</span> },
    { header: 'Data', cell: (a: Acidente) => <span className="text-muted-foreground">{formatDate(a.data_ocorrencia)}</span> },
    { header: 'Local', hideMobile: true, cell: (a: Acidente) => <span className="text-muted-foreground text-xs truncate max-w-[120px] block">{a.local_ocorrencia}</span> },
    { header: 'CAT', hideMobile: true, cell: (a: Acidente) => a.cat ? <Badge variant="warning">CAT</Badge> : <span className="text-muted-foreground text-xs">—</span> },
    { header: 'Status', cell: (a: Acidente) => <Badge variant={STATUS_COR[a.status] ?? 'secondary'}>{STATUS_LABEL[a.status]}</Badge> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Acidentes e Incidentes</h1>
          <p className="text-muted-foreground">Registro e investigação de ocorrências</p>
        </div>
        <Button onClick={() => { setModalRegistro(true); reset({ cat: false as boolean }) }}>
          <Plus className="h-4 w-4" /> Registrar Ocorrência
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Ocorrências registradas</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <SkeletonTabela linhas={5} /> : (
            <>
              <TabelaResponsiva
                colunas={colunas}
                dados={acidentes}
                keyExtractor={a => a.id}
                acoes={(a) => (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" title="Ver evidências"
                      onClick={() => {
                        setAcidenteSelecionado(a)
                        setModalVisualizarEvidencias(true)
                        setTimeout(() => refetchEvidencias(), 100)
                      }}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Adicionar evidências"
                      onClick={() => { setAcidenteSelecionado(a); setModalEvidencias(true); setEvidencias([]) }}>
                      <Upload className="h-3.5 w-3.5" />
                    </Button>
                    {a.status !== 'arquivado' && (
                      <Button variant="outline" size="sm"
                        onClick={() => avancar.mutate({ id: a.id, status: a.status })}
                        disabled={avancar.isPending}>
                        Avançar
                      </Button>
                    )}
                  </div>
                )}
                vazio={<EmptyState icon={AlertTriangle} titulo="Nenhuma ocorrência registrada" descricao="Registre acidentes e incidentes para controle e investigação" />}
              />
              {acidentes.length > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">Página {pagina + 1}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={pagina === 0} onClick={() => setPagina(p => p - 1)}>Anterior</Button>
                    <Button variant="outline" size="sm" disabled={acidentes.length < 20} onClick={() => setPagina(p => p + 1)}>Próxima</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal Registro */}
      <Dialog open={modalRegistro} onOpenChange={setModalRegistro}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar Ocorrência</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Funcionário envolvido</Label>
              <select {...register('funcionario_id')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="">Selecione...</option>
                {funcionarios.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
              {errors.funcionario_id && <p className="text-xs text-destructive">{errors.funcionario_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select {...register('tipo')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="">Selecione...</option>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {errors.tipo && <p className="text-xs text-destructive">{errors.tipo.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" {...register('data_ocorrencia')} />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input type="time" {...register('hora_ocorrencia')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Local</Label>
              <Input {...register('local_ocorrencia')} placeholder="Ex: Setor de produção, linha 3" />
              {errors.local_ocorrencia && <p className="text-xs text-destructive">{errors.local_ocorrencia.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Descrição detalhada</Label>
              <Textarea {...register('descricao')} rows={3} placeholder="Descreva o que aconteceu..." />
              {errors.descricao && <p className="text-xs text-destructive">{errors.descricao.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Causa imediata</Label>
              <Input {...register('causa_imediata')} placeholder="Ex: Falta de EPI, piso escorregadio..." />
            </div>
            <div className="space-y-2">
              <Label>Medidas corretivas</Label>
              <Textarea {...register('medidas_corretivas')} rows={2} placeholder="Ações tomadas..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dias de afastamento</Label>
                <Input type="number" min={0} {...register('dias_afastamento')} placeholder="0" />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="cat" {...register('cat')} className="h-4 w-4 rounded" />
                <Label htmlFor="cat">Emitir CAT</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalRegistro(false)}>Cancelar</Button>
              <Button type="submit" disabled={registrar.isPending}>
                {registrar.isPending ? 'Registrando...' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Visualizar Evidências */}
      <Dialog open={modalVisualizarEvidencias} onOpenChange={setModalVisualizarEvidencias}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Evidências do Acidente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tipo: <span className="font-medium">{TIPOS.find(t => t.value === acidenteSelecionado?.tipo)?.label}</span>
            </p>

            {evidenciasExistentes.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Evidências anexadas ({evidenciasExistentes.length})</Label>
                <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
                  {evidenciasExistentes.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate" title={doc.nome}>{doc.nome}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirEvidencia(doc.arquivo_url)}
                        title="Abrir evidência"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma evidência anexada</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalVisualizarEvidencias(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Upload Evidências */}
      <Dialog open={modalEvidencias} onOpenChange={setModalEvidencias}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Adicionar Evidências</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tipo: <span className="font-medium">{TIPOS.find(t => t.value === acidenteSelecionado?.tipo)?.label}</span>
            </p>

            <div className="space-y-2">
              <Label>Selecione os arquivos (fotos, laudos, boletins)</Label>
              <input
                key={fileInputKey}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={e => setEvidencias(Array.from(e.target.files ?? []))}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
              />
              {evidencias.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {evidencias.map(f => <li key={f.name}>• {f.name}</li>)}
                </ul>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalEvidencias(false); setEvidencias([]) }}>Cancelar</Button>
            <Button onClick={enviarEvidencias} disabled={enviandoEvid || evidencias.length === 0}>
              {enviandoEvid ? 'Enviando...' : `Enviar${evidencias.length > 0 ? ` (${evidencias.length})` : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
